const Category = require("../models/Category");
const Product = require("../models/Product");

const findByName = async (storeId, name) => {
  return Category.findOne({ storeId, name });
};

const findById = async (storeId, id) => {
  return Category.findOne({ storeId, _id: id }).populate("products");
};

const find = async (
  storeId,
  sort = { orderIndex: 1 },
  page = 1,
  limit = 10
) => {
  const skip = (page - 1) * limit;
  const query = { storeId: storeId };

  const [categories, totalCategories] = await Promise.all([
    Category.find(query)
      .populate("products")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Category.countDocuments(query),
  ]);

  return { categories, totalCategories, page, limit };
};

const create = async (storeId, data) => {
  return Category.create({ ...data, storeId });
};

const findLastCategory = async (storeId) => {
  return Category.findOne({ storeId }).sort({ orderIndex: -1 });
};

const addCategoryToProducts = async (productIds, categoryId) => {
  return Product.updateMany(
    { _id: { $in: productIds } },
    { $push: { products: categoryId } }
  );
};

const addProductToCategories = async (categoryIds, productId, storeId) => {
  return Category.updateMany(
    { _id: { $in: categoryIds }, storeId },
    { $addToSet: { products: productId } }
  );
};

const removeProductFromCategories = async (categoryIds, productId, storeId) => {
  return Category.updateMany(
    { _id: { $in: categoryIds }, storeId },
    { $pull: { products: productId } }
  );
};

module.exports = {
  findByName,
  findById,
  find,
  create,
  findLastCategory,
  addCategoryToProducts,
  addProductToCategories,
  removeProductFromCategories,
};
