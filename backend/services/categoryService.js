const mongoose = require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");
const CategoryRepo = require("../repos/categoryRepo");
const clearProductCache = require("../helpers/clearProductCache");

const fetchCategoriesFromDB = async (queryParams) => {
  const page = Number(queryParams.page) || 1;
  const limit = Number(queryParams.limit) || 10;
  const skip = (page - 1) * limit;

  const [categories, totalCategories] = await Promise.all([
    Category.find()
      .populate("products")
      .sort({ orderIndex: 1 })
      .skip(skip)
      .limit(limit),
    Category.countDocuments(),
  ]);

  return { categories, totalCategories, page, limit };
};

const findCategories = async (queryParams) => {
  let categoriesData = await fetchCategoriesFromDB(queryParams);

  return categoriesData;
};

// const validateProductIds = (categories) => {
//   if (!Array.isArray(categories) || categories.length === 0) {
//     throw new Error("Category must be a non-empty array");
//   }
//   return categories;
// };

const ensureTenantCategories = async (storeId, userId, categoryNames) => {
  const storeCategoryIds = [];
  for (const name of categoryNames) {
    let storeCategory = await CategoryRepo.findByName(storeId, name);

    if (!storeCategory) {
      storeCategory = await CategoryRepo.create(storeId, {
        name,
        createdBy: userId,
      });
    }

    storeCategoryIds.push(storeCategory._id);
  }

  return storeCategoryIds;
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
  if (existing) throw new Error("Category already exists");

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

module.exports = {
  findCategories,
  createCategory,
  ensureTenantCategories,
  updateProducts,
  deleteCategories,
};
