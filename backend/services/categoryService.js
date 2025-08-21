const mongoose = require("mongoose");
const Category = require("../models/Category");
const redisClient = require("../config/redisClient");
const Product = require("../models/Product");
const CategoryRepo = require("../repo/categoryRepo");
const clearProductCache = require("../helpers/clearProductCache");
const generateCacheKey = require("../helpers/generateCacheKey");
const handler = require("../helpers/handler");
const clearCache = require("../helpers/clearCache");

const findCategories = async (storeId, queryParams) => {
  const cacheKey = generateCacheKey(storeId, "categories", queryParams);
  let cached = await redisClient.get(cacheKey);
  if (cached) return cached;

  const page = Number(queryParams.page) || 1;
  const limit = Number(queryParams.limit) || 10;

  const sort = { orderIndex: 1 };

  const result = await CategoryRepo.find(storeId, sort, page, limit);

  await redisClient.set(cacheKey, JSON.stringify(result), { EX: 3600 });

  return result;
};

const ensureTenantCategories = async (storeId, userId, categoryNames) => {
  const categoryIds = [];

  for (const input of categoryNames) {
    let category;

    if (mongoose.Types.ObjectId.isValid(input)) {
      category = await CategoryRepo.findById(storeId, input);
    }

    if (!category) {
      category = await CategoryRepo.findByName(storeId, input);
      if (!category) {
        category = await CategoryRepo.create(storeId, {
          name: input,
          createdBy: userId,
        });
      }
    }

    categoryIds.push(category._id);
  }

  return categoryIds;
};

const validateProductIds = (products) => {
  return products
    .map((productId) =>
      mongoose.Types.ObjectId.isValid(productId)
        ? new mongoose.Types.ObjectId(productId)
        : null
    )
    .filter(Boolean);
};

const createCategory = async ({
  storeId,
  userId,
  name,
  visibility,
  description,
  products,
}) => {
  const existing = await CategoryRepo.findByName(storeId, name);
  if (existing) throw handler.conflictError("Category already exists");

  const lastCategory = await CategoryRepo.findLastCategory();
  const newOrderIndex = lastCategory ? lastCategory.orderIndex + 1 : 0;

  const extractedProductIds = products?.map((p) => p._id) || [];

  const productIds = validateProductIds(extractedProductIds);

  const category = await CategoryRepo.create(storeId, {
    name,
    visibility,
    orderIndex: newOrderIndex,
    description,
    products: productIds,
    createdBy: userId,
  });

  await CategoryRepo.addCategoryToProducts(productIds, category._id);
  return category;
};

// Show

const validateId = (categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw handler.invalidError("Invalid category ID");
  }
  return categoryId;
};

const findCategoryById = async (storeId, id) => {
  const validatedCategoryId = validateId(id);
  const category = await CategoryRepo.findById(storeId, validatedCategoryId);
  if (!category) {
    throw handler.notFoundError("Category not found");
  }
  return category;
};

// UPDATE
const updateProducts = async (existingCategory, newProductIds, id) => {
  const oldProductIds = existingCategory.products || [];

  // Products to remove (exist in old but not in new)
  const productsToRemove = oldProductIds.filter(
    (pId) => !newProductIds.includes(pId.toString())
  );

  // Products to add (exist in new but not in old)
  const productsToAdd = newProductIds.filter(
    (pId) => !oldProductIds.includes(pId.toString())
  );

  // Only update Products if necessary
  const updateOperations = [];
  if (productsToRemove.length > 0) {
    updateOperations.push(
      Product.updateMany(
        { _id: { $in: productsToRemove } },
        { $pull: { categories: id } }
      )
    );
  }
  if (productsToAdd.length > 0) {
    updateOperations.push(
      Product.updateMany(
        { _id: { $in: productsToAdd } },
        { $addToSet: { categories: id } }
      )
    );
  }

  await Promise.all(updateOperations);
};

const deleteCategories = async (ids) => {
  const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    return { deletedCount: 0, invalidIds };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const categories = await Category.find({ _id: { $in: ids } }).session(
      session
    );
    console.log("categories", categories);
    if (categories.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return { deletedCount: 0, invalidIds: [] };
    }

    await Category.deleteMany({ _id: { $in: ids } }).session(session);

    await Promise.all([
      Product.updateMany(
        { categories: { $in: ids } },
        { $pull: { categories: { $in: ids } } }
      ).session(session),
    ]);

    await session.commitTransaction();
    session.endSession();

    await clearProductCache();

    return {
      deletedCount: categories.length,
      invalidIds: [],
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const updateVisibility = async (storeId, ids, visibility) => {
  // Validate IDs
  const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    throw handler.invalidError("Invalid product ids");
  }

  // Call repo with storeId
  const result = await CategoryRepo.bulkUpdateVisibility(
    storeId,
    ids,
    visibility
  );

  await clearCache(storeId, "categories");
  return result;
};

const updateCategorySequence = async (storeId, categories) => {
  console.log("categories",categories);
  const validCategories = categories.filter((c) => c._id);
  if (validCategories.length === 0) {
    throw handler.invalidError("Invalid or empty category list.");
  }

  const result = await CategoryRepo.bulkUpdateOrder(storeId, validCategories);

  // clear cache after updating sequence
  await clearCache(storeId, "categories");

  return {
    modifiedCount: result.modifiedCount,
    message: "Category sequence updated successfully",
  };
};

module.exports = {
  findCategories,
  findCategoryById,
  createCategory,
  ensureTenantCategories,
  updateProducts,
  deleteCategories,
  updateVisibility,
  updateCategorySequence,
};
