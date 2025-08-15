const Product = require("../models/Product");
const Category = require("../models/Category");

const findByName = async (storeId, name) => {
  return Product.findOne({ storeId, name });
};

const create = async (storeId, data) => {
  return Product.create({ ...data, storeId });
};

const addProductToCategories = async (categoryIds, productId) => {
  return Category.updateMany(
    { _id: { $in: categoryIds } },
    { $push: { products: productId } }
  );
};

module.exports = {
  findByName,
  create,
  addProductToCategories,
};
