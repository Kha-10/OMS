const mongoose = require("mongoose");
const redisClient = require("../config/redisClient");
const Product = require("../models/Product");
const Category = require("../models/Category");
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");
const {
  awsRemove,
  extractFilename,
  invalidateCloudFrontCache,
  duplicateImages,
} = require("./imageService");
const clearProductCache = require("../helpers/clearProductCache");

// GET
const getCachedProducts = async (cacheKey) => {
  const cachedData = await redisClient.get(cacheKey);
  return cachedData ? JSON.parse(cachedData) : null;
};

const cacheProducts = async (cacheKey, products) => {
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(products)); // Cache for 1 hour
};

const buildQuery = (queryParams) => {
  let query = {};

  if (queryParams.categories) {
    query.categories = { $in: queryParams.categories.split(",") };
  }

  if (queryParams.visibility) {
    query.visibility = queryParams.visibility;
  }

  if (queryParams.search) {
    query.$or = [
      { name: { $regex: queryParams.search, $options: "i" } },
      { sku: { $regex: queryParams.search, $options: "i" } },
      { "variants.name": { $regex: queryParams.search, $options: "i" } },
    ];
  }

  return query;
};

const buildSort = (sortBy, sortDirection) => {
  const direction = sortDirection === "asc" ? 1 : -1;
  return sortBy === "title"
    ? { name: direction }
    : sortBy === "updatedAt"
    ? { updatedAt: direction }
    : { createdAt: direction };
};

const fetchProductsFromDB = async (queryParams) => {
  const query = buildQuery(queryParams);
  const sort = buildSort(queryParams.sortBy, queryParams.sortDirection);
  const page = Number(queryParams.page) || 1;
  const limit = Number(queryParams.limit) || 10;
  const skip = (page - 1) * limit;

  const [products, totalProducts, allProductsCount] = await Promise.all([
    Product.find(query)
      .populate("categories")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(query),
    Product.countDocuments({}),
  ]);

  return { products, totalProducts, allProductsCount, page, limit };
};

const generateCacheKey = (queryParams) => {
  let cacheKey = `products:page${queryParams.page}:limit${queryParams.limit}`;
  if (queryParams.categories)
    cacheKey += `:categories${queryParams.categories}`;
  if (queryParams.visibility)
    cacheKey += `:visibility${queryParams.visibility}`;
  if (queryParams.sortBy) cacheKey += `:sortBy${queryParams.sortBy}`;
  if (queryParams.sortDirection)
    cacheKey += `:sortDirection${queryParams.sortDirection}`;
  if (queryParams.search) cacheKey += `:searchQuery${queryParams.search}`;
  return cacheKey;
};

const findProducts = async (queryParams) => {
  const cacheKey = generateCacheKey(queryParams);
  let cachedProducts = await getCachedProducts(cacheKey);
  console.log("cachedProducts",cachedProducts);
  if (!cachedProducts) {
    cachedProducts = await fetchProductsFromDB(queryParams);
    console.log("db",cachedProducts);
    await cacheProducts(cacheKey, cachedProducts);
  }
  return cachedProducts;
};

const enhanceProductImages = (input) => {
  if (!input) return input;

  const processProduct = (product) => {
    if (product?.photo?.length > 0) {
      product.imgUrls = product.photo.map((image) =>
        getSignedUrl({
          url: `https://d1pgjvyfhid4er.cloudfront.net/${image}`,
          dateLessThan: new Date(Date.now() + 1000 * 60 * 60),
          privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
          keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
        })
      );
    }
    return product;
  };

  return Array.isArray(input)
    ? input.map(processProduct)
    : processProduct(input);
};

// POST
const findByName = async (name) => {
  return await Product.findOne({ name });
};

const validateCategoryIds = (categories) => {
  return categories
    .map((categoryId) =>
      mongoose.Types.ObjectId.isValid(categoryId)
        ? new mongoose.Types.ObjectId(categoryId)
        : null
    )
    .filter(Boolean);
};

const createProduct = async (productData) => {
  return await Product.create(productData);
};

// Show
const findProductById = async (id) => {
  return await Product.findById(id).populate("categories");
};

// Delete
const removeProduct = async (productId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      session.endSession();
      return null;
    }

    // Delete product
    await Product.findByIdAndDelete(productId).session(session);

    // Remove images from AWS if present
    if (product.photo?.length > 0) {
      await awsRemove(product.photo);
      await invalidateCloudFrontCache(product.photo);
    }

    await session.commitTransaction();
    session.endSession();

    // Clear cache
    await clearProductCache();

    return product;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Update
const updateProduct = async (id, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid id");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let product = await Product.findById(id).session(session);
    if (!product) {
      await session.abortTransaction();
      session.endSession();
      throw new Error("Product not found");
    }

    // Process images
    const { images, deletedImages } = updateData;
    const formattedDeletedImages = (deletedImages || [])
      .map(extractFilename)
      .filter(Boolean);
    const formattedImages = (images || []).map(extractFilename).filter(Boolean);

    // Remove deleted images from S3 and invalidate cache
    if (formattedDeletedImages.length > 0) {
      await awsRemove(formattedDeletedImages);
      await invalidateCloudFrontCache(formattedDeletedImages);
    }

    // Update product fields
    product = await Product.findByIdAndUpdate(
      id,
      {
        ...updateData,
        ...(images && {
          photo: formattedImages,
          imgUrls: formattedImages.map(
            (filename) => `https://d1pgjvyfhid4er.cloudfront.net/${filename}`
          ),
        }),
      },
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    await clearProductCache();
    return product;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Update categories in a single operation
const updateCategories = async (existingProduct, newCategoryIds, id) => {
  const oldCategoryIds = existingProduct.categories || [];

  // Categories to remove (exist in old but not in new)
  const categoriesToRemove = oldCategoryIds.filter(
    (catId) => !newCategoryIds.includes(catId.toString())
  );

  // Categories to add (exist in new but not in old)
  const categoriesToAdd = newCategoryIds.filter(
    (catId) => !oldCategoryIds.includes(catId.toString())
  );

  // Only update categories if necessary
  const updateOperations = [];
  if (categoriesToRemove.length > 0) {
    updateOperations.push(
      Category.updateMany(
        { _id: { $in: categoriesToRemove } },
        { $pull: { products: id } }
      )
    );
  }
  if (categoriesToAdd.length > 0) {
    updateOperations.push(
      Category.updateMany(
        { _id: { $in: categoriesToAdd } },
        { $addToSet: { products: id } }
      )
    );
  }

  await Promise.all(updateOperations);
};

// Duplicate
const duplicateProduct = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid id");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let originalProduct = await Product.findById(id).session(session);
    if (!originalProduct) {
      await session.abortTransaction();
      session.endSession();
      throw new Error("originalProduct not found");
    }

    let duplicatedImages;
    if (originalProduct.photo && originalProduct.photo.length > 0) {
      duplicatedImages = await duplicateImages(originalProduct.photo);
    }

    const productData = originalProduct.toObject();
    delete productData._id;
    delete productData.createdAt;
    delete productData.updatedAt;

    productData.photo = duplicatedImages;
    productData.name = `${productData.name} (Copy)`;

    const [newProduct] = await Product.create([productData], { session });

    await session.commitTransaction();
    session.endSession();
    await clearProductCache();
    return newProduct;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = {
  findProducts,
  enhanceProductImages,
  findByName,
  validateCategoryIds,
  createProduct,
  findProductById,
  removeProduct,
  updateProduct,
  updateCategories,
  duplicateProduct,
};
