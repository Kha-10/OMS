const mongoose = require("mongoose");
const redisClient = require("../config/redisClient");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const User = require("../models/User");
const clearProductCache = require("../helpers/clearProductCache");
const clearCache = require("../helpers/clearCache");
const uploadAdapter = require("./adapters/index");
const ProductRepo = require("../repo/productRepo");
const StoreRepo = require("../repo/storeRepo");
const CategoryService = require("../services/categoryService");
const CategoryRepo = require("../repo/categoryRepo");
const generateCacheKey = require("../helpers/generateCacheKey");
const handler = require("../helpers/handler");

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

// const fetchProductsExplain = async (queryParams) => {
//   const query = buildQuery(queryParams);
//   const sort = buildSort(queryParams.sortBy, queryParams.sortDirection);
//   const page = Number(queryParams.page) || 1;
//   const limit = Number(queryParams.limit) || 10;
//   const skip = (page - 1) * limit;

//   // Base query WITHOUT populate, but with collation, sort, skip, limit
//   const baseQuery = Product.find(query)
//     // .collation({ locale: "en", strength: 2 })
//     .sort(sort)
//     .skip(skip)
//     .limit(limit);

//   const explain = await baseQuery.explain("executionStats");

//   console.log("Execution stats:", JSON.stringify(explain, null, 2));
//   return explain;
// };

const findProducts = async (storeId, queryParams) => {
  const cacheKey = generateCacheKey(storeId, "products", queryParams);

  // Try cache first
  let cached = await redisClient.get(cacheKey);
  if (cached) return cached;
  // Build query & fetch from repo
  const query = buildQuery(queryParams);
  const sort = buildSort(queryParams.sortBy, queryParams.sortDirection);
  let page = Number(queryParams.page) || 1;
  let limit = Number(queryParams.limit) || 10;

  if (queryParams.all) {
    page = 1;
    limit = 0;
  }

  const result = await ProductRepo.find(
    storeId,
    query,
    sort,
    page,
    limit,
    queryParams.search
  );

  // Cache result
  await redisClient.set(cacheKey, result, { EX: 3600 });
  return result;
};

const enhanceProductImages = (input) => {
  if (!input) return input;
  if (Array.isArray(input)) {
    return input.map((product) => uploadAdapter.getImageUrls(product));
  }
  return uploadAdapter.getImageUrls(input,"products");
};

// POST
const findByName = async (name) => {
  return await Product.findOne({ name });
};

const validateCategoryIds = (categories) => {
  console.log("143", categories);
  return categories
    .map((categoryId) =>
      mongoose.Types.ObjectId.isValid(categoryId)
        ? new mongoose.Types.ObjectId(categoryId)
        : null
    )
    .filter(Boolean);
};

const createProduct = async (storeId, userId, productData) => {
  const existing = await ProductRepo.findByName(storeId, productData.name);
  if (existing) throw handler.conflictError("Product already exists");

  // Handle sample product case
  let data = { ...productData };
  if (productData.addSamples) {
    data = {
      ...data,
      name: "Hamburger",
      categories: ["Food & Beverages"],
      price: "20",
    };
  }

  const storeCategoryIds = await CategoryService.ensureTenantCategories(
    storeId,
    userId,
    data.categories
  );
  const categoryIds = validateCategoryIds(storeCategoryIds);

  const product = await ProductRepo.create(storeId, {
    ...data,
    categories: categoryIds,
    createdBy: userId,
  });

  const productIds = [product._id];
  const categoryIdsArray = categoryIds.length ? categoryIds : [];

  if (categoryIdsArray.length > 0) {
    await ProductRepo.addProductToCategories(
      categoryIdsArray,
      productIds,
      storeId
    );
  }

  // Onboarding step update
  const existingUser = await User.findById(userId);
  if (!existingUser) throw handler.notFoundError("User not found");

  if (existingUser.onboarding_step < 7) {
    await User.findByIdAndUpdate(userId, { onboarding_step: 5 });
  }

  await StoreRepo.update(storeId, {
    "settings.currency": data.currency,
  });

  return product;
};

// Show

const validateId = (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw handler.invalidError("Invalid product ID");
  }
  return productId;
};

const findProductById = async (storeId, id) => {
  const validatedProductId = validateId(id);
  const product = await ProductRepo.findById(storeId, validatedProductId);
  if (!product) {
    throw handler.notFoundError("Product not found");
  }
  return product;
};

const updateCategories = async (
  existingProduct,
  newCategoryIds,
  productId,
  storeId
) => {
  const oldCategoryIds = (existingProduct.categories || []).map((c) =>
    typeof c === "object" && c._id ? c._id.toString() : c.toString()
  );

  const categoriesToRemove = oldCategoryIds.filter(
    (catId) => !newCategoryIds.includes(catId)
  );
  const categoriesToAdd = newCategoryIds.filter(
    (catId) => !oldCategoryIds.includes(catId)
  );

  const productIds = [productId];

  const ops = [];

  if (categoriesToRemove.length > 0) {
    ops.push(
      CategoryRepo.removeProductFromCategories(
        categoriesToRemove,
        productIds,
        storeId
      )
    );
  }

  if (categoriesToAdd.length > 0) {
    ops.push(
      CategoryRepo.addProductToCategories(categoriesToAdd, productIds, storeId)
    );
  }

  await Promise.all(ops);
};

const updateProductWithCategories = async (
  storeId,
  productId,
  updateData,
  newCategoryIds
) => {
  // 1. Find product within store
  const existingProduct = await ProductRepo.findById(storeId, productId);
  if (!existingProduct) {
    throw handler.notFoundError("Product not found");
  }

  // 2. Update categories if changed
  await updateCategories(existingProduct, newCategoryIds, productId, storeId);

  // 3. Update product fields/images
  const updatedProduct = await ProductRepo.update(
    storeId,
    productId,
    updateData
  );

  return updatedProduct;
};

const updateVisibility = async (storeId, ids, visibility) => {
  // Validate IDs
  const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    throw handler.invalidError("Invalid product ids");
  }

  // Call repo with storeId
  const result = await ProductRepo.bulkUpdateVisibility(
    storeId,
    ids,
    visibility
  );

  // Clear cache scoped to this store
  await clearCache(storeId, "products");
  // await clearProductCache(storeId);

  return result;
};

const duplicateProducts = async (ids, storeId) => {
  const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));

  if (validIds.length === 0) {
    return { duplicatedCount: 0, invalidIds };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const originalProducts = await ProductRepo.findByIds(
      validIds,
      storeId,
      session
    );
    console.log("originalProducts", originalProducts);
    if (originalProducts.length === 0) {
      await session.abortTransaction();
      return { duplicatedCount: 0, invalidIds };
    }

    const duplicatedProducts = [];

    for (const original of originalProducts) {
      const originalData = original.toObject();

      // handle photos (if needed)
      let duplicatedImages = [];
      if (Array.isArray(originalData.photo) && originalData.photo.length > 0) {
        duplicatedImages = await uploadAdapter.duplicateImages(
          originalData.photo
        );
      }

      const duplicated = {
        ...originalData,
        _id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        name: `${originalData.name} (Copy)`,
        photo: duplicatedImages,
      };

      duplicatedProducts.push(duplicated);
    }

    const newProducts = await ProductRepo.insertMany(
      storeId,
      duplicatedProducts,
      session
    );

    const categoryIds = originalProducts.flatMap((org) => org.categories);

    const productIds = newProducts.map((p) => p._id);

    await CategoryRepo.addProductToCategories(categoryIds, productIds, storeId);

    await session.commitTransaction();
    await clearCache(storeId, "products");
    // await clearProductCache(storeId);
    await clearCache(storeId, "categories");

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

const deleteProducts = async (storeId, ids) => {
  const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    return { deletedCount: 0, invalidIds };
  }
  console.log("invalidIds", invalidIds);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const products = await ProductRepo.findByIds(ids, storeId, session);
    if (products.length === 0) {
      await session.abortTransaction();
      return { deletedCount: 0, invalidIds: [] };
    }
    console.log("products", products);

    const photosToDelete = products.flatMap((p) => p.photo || []);

    await ProductRepo.deleteMany(storeId, ids, session);

    await session.commitTransaction();

    if (photosToDelete.length > 0) {
      uploadAdapter.removeImages(photosToDelete);
    }

    console.log("products.length", products.length);
    await clearCache(storeId, "products");
    // await clearProductCache(storeId);
    await clearCache(storeId, "categories");

    return { deletedCount: products.length, invalidIds: [] };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
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
  updateProductWithCategories,
  duplicateProducts,
  updateVisibility,
};
