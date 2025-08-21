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

  // Extract product IDs if products provided
  const extractedProductIds =
    products?.map((p) =>
      typeof p === "object" && p._id ? p._id.toString() : p.toString()
    ) || [];

  const productIds = validateProductIds(extractedProductIds);

  // Create category with initial products
  const category = await CategoryRepo.create(storeId, {
    name,
    visibility,
    orderIndex: newOrderIndex,
    description,
    products: productIds,
    createdBy: userId,
  });

  // Keep consistent: always wrap categoryId in array
  const categoryIds = [category._id];

  if (productIds.length > 0) {
    await CategoryRepo.addCategoryToProducts(productIds, categoryIds, storeId);
  }

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

const updateCategoryProducts = async (storeId, categoryId, newProductIds) => {
  const existingCategory = await CategoryRepo.findById(storeId, categoryId);
  if (!existingCategory) throw handler.notFoundError("Category not found");

  const oldProductIds = (existingCategory.products || []).map((p) =>
    p._id.toString()
  );

  const productsToAdd = newProductIds.filter(
    (id) => !oldProductIds.includes(id)
  );
  const productsToRemove = oldProductIds.filter(
    (id) => !newProductIds.includes(id)
  );

  const categoryIds = [categoryId];

  const ops = [];
  if (productsToAdd.length > 0)
    ops.push(
      CategoryRepo.addProductToCategories(categoryIds, productsToAdd, storeId),
      CategoryRepo.addCategoryToProducts(productsToAdd, categoryIds, storeId)
    );

  if (productsToRemove.length > 0) {
    ops.push(
      CategoryRepo.removeProductFromCategories(
        categoryIds,
        productsToRemove,
        storeId
      ),
      CategoryRepo.removeCategoryFromProducts(categoryIds, storeId)
    );
  }

  await Promise.all(ops);

  const categoryUpdateData = {};
  const updatedCategory = await CategoryRepo.updateById(
    categoryId,
    storeId,
    categoryUpdateData
  );

  await clearCache(storeId, "products");
  await clearCache(storeId, "categories");

  return updatedCategory;
};

const deleteCategories = async (storeId, ids) => {
  const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    return { deletedCount: 0, invalidIds };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const categories = await CategoryRepo.findByIds(ids, storeId, session);

    if (categories.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return { deletedCount: 0, invalidIds: [] };
    }

    await CategoryRepo.deleteMany(ids, storeId, session);

    await CategoryRepo.removeCategoriesFromProducts(ids, storeId, session);

    await session.commitTransaction();
    session.endSession();

    await clearCache(storeId, "products");
    await clearCache(storeId, "categories");

    return { deletedCount: categories.length, invalidIds: [] };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = {
  findCategories,
  findCategoryById,
  createCategory,
  ensureTenantCategories,
  deleteCategories,
  updateVisibility,
  updateCategorySequence,
  updateCategoryProducts,
};
