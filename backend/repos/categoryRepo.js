const Category = require("../models/Category");
const Product = require("../models/Product");

const findByName = async (storeId, name) => {
  return Category.findOne({ storeId, name });
};

const create = async (storeId, data) => {
  return Category.create({ ...data, storeId });
};

const findLastCategory = async (storeId) => {
  return Category.findOne({storeId}).sort({ orderIndex: -1 });
};

const addCategoryToProducts = async (productIds, categoryId) => {
  return Product.updateMany(
    { _id: { $in: productIds } },
    { $push: { products: categoryId } }
  );
};

module.exports = {
  findByName,
  create,
  findLastCategory,
  addCategoryToProducts,
};
