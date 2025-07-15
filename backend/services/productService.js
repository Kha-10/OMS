const mongoose = require("mongoose");
const redisClient = require("../config/redisClient");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
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
      { name: { $regex: `^${queryParams.search}`, $options: "i" } },
      { sku: { $regex: `^${queryParams.search}` }, $options: "i" },
      { "variants.name": { $regex: `^${queryParams.search}`, $options: "i" } },
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

  const findQuery = Product.find(query)
    .populate("categories")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  if (queryParams.search) {
    findQuery.collation({ locale: "en", strength: 2 });
  }

  const [products, totalProducts, allProductsCount] = await Promise.all([
    findQuery,
    Product.countDocuments(query),
    Product.countDocuments({}),
  ]);

  return { products, totalProducts, allProductsCount, page, limit };
};

const fetchProductsExplain = async (queryParams) => {
  const query = buildQuery(queryParams);
  const sort = buildSort(queryParams.sortBy, queryParams.sortDirection);
  const page = Number(queryParams.page) || 1;
  const limit = Number(queryParams.limit) || 10;
  const skip = (page - 1) * limit;

  // Base query WITHOUT populate, but with collation, sort, skip, limit
  const baseQuery = Product.find(query)
    // .collation({ locale: "en", strength: 2 })
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const explain = await baseQuery.explain("executionStats");

  console.log("Execution stats:", JSON.stringify(explain, null, 2));
  return explain;
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
  await fetchProductsExplain(queryParams);
  const cacheKey = generateCacheKey(queryParams);
  let cachedProducts = await getCachedProducts(cacheKey);
  console.log("cachedProducts", cachedProducts);
  if (!cachedProducts) {
    cachedProducts = await fetchProductsFromDB(queryParams);
    console.log("db", cachedProducts);
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

const deleteProducts = async (ids) => {
  const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    return { deletedCount: 0, invalidIds };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const products = await Product.find({ _id: { $in: ids } }).session(session);

    if (products.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return { deletedCount: 0, invalidIds: [] };
    }

    const photosToDelete = products.flatMap((product) => product.photo || []);

    await Product.deleteMany({ _id: { $in: ids } }).session(session);

    await Promise.all([
      Category.updateMany(
        { products: { $in: ids } },
        { $pull: { products: { $in: ids } } }
      ).session(session),

      Order.updateMany(
        { "items.productId": { $in: ids } },
        {
          $set: {
            "items.$[elem].productId": null,
            "items.$[elem]._id": null,
          },
        },
        {
          arrayFilters: [{ "elem.productId": { $in: ids } }],
          session,
        }
      ),
    ]);

    await session.commitTransaction();
    session.endSession();

    // AWS removal and cache clearing outside the transaction
    if (photosToDelete.length > 0) {
      await awsRemove(photosToDelete);
      await invalidateCloudFrontCache(photosToDelete);
    }

    await clearProductCache();

    return {
      deletedCount: products.length,
      invalidIds: [],
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const updateProduct = async (id, updateData) => {
  const { images, deletedImages } = updateData;

  const formattedDeletedImages = (deletedImages || [])
    .map(extractFilename)
    .filter(Boolean);

  const formattedImages = (images || []).map(extractFilename).filter(Boolean);

  if (formattedDeletedImages.length > 0) {
    await awsRemove(formattedDeletedImages);
    await invalidateCloudFrontCache(formattedDeletedImages);
  }

  const updateFields = {
    ...updateData,
    ...(images && {
      photo: formattedImages,
      imgUrls: formattedImages.map(
        (filename) => `https://d1pgjvyfhid4er.cloudfront.net/${filename}`
      ),
    }),
  };

  const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, {
    new: true,
  });

  return updatedProduct;
};

const updateCategories = async (existingProduct, newCategoryIds, id) => {
  const oldCategoryIds = (existingProduct.categories || []).map((c) =>
    c.toString()
  );

  const categoriesToRemove = oldCategoryIds.filter(
    (catId) => !newCategoryIds.includes(catId)
  );

  const categoriesToAdd = newCategoryIds.filter(
    (catId) => !oldCategoryIds.includes(catId)
  );

  const ops = [];

  if (categoriesToRemove.length > 0) {
    ops.push(
      Category.updateMany(
        { _id: { $in: categoriesToRemove } },
        { $pull: { products: id } }
      )
    );
  }

  if (categoriesToAdd.length > 0) {
    ops.push(
      Category.updateMany(
        { _id: { $in: categoriesToAdd } },
        { $addToSet: { products: id } }
      )
    );
  }

  await Promise.all(ops);
};

// Duplicate
const duplicateProduct = async (ids) => {
  const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));

  if (validIds.length === 0) {
    return { duplicatedCount: 0, invalidIds };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const originalProducts = await Product.find({
      _id: { $in: validIds },
    }).session(session);
    if (originalProducts.length === 0) {
      await session.abortTransaction();
      return { duplicatedCount: 0, invalidIds };
    }

    const duplicatedProducts = [];

    for (const original of originalProducts) {
      const originalData = original.toObject();

      // Optional: duplicate photo array if needed
      let duplicatedImages = [];
      if (Array.isArray(originalData.photo) && originalData.photo.length > 0) {
        duplicatedImages = await duplicateImages(originalData.photo);
      }

      const duplicated = {
        ...originalData,
        _id: undefined, // allow Mongo to generate new ID
        createdAt: undefined,
        updatedAt: undefined,
        name: `${originalData.name} (Copy)`,
        photo: duplicatedImages,
      };

      duplicatedProducts.push(duplicated);
    }

    const newProducts = await Product.insertMany(duplicatedProducts, {
      session,
    });

    await session.commitTransaction();
    await clearProductCache();

    return {
      duplicatedCount: newProducts.length,
      invalidIds,
      newProducts,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  findProducts,
  enhanceProductImages,
  findByName,
  validateCategoryIds,
  createProduct,
  findProductById,
  deleteProducts,
  updateProduct,
  updateCategories,
  duplicateProduct,
};
