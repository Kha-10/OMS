const mongoose = require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");

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
  updateProducts,
  deleteCategories,
};
