const Category = require("../models/Category");
const Product = require("../models/Product");

const findByName = async (storeId, name) => {
  return Category.findOne({ storeId, name });
};

const findById = async (storeId, id) => {
  return Category.findOne({ storeId, _id: id }).populate("products");
};

const find = async (storeId, sort = { orderIndex: 1 }, page, limit) => {
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

const addCategoryToProducts = async (productIds, categoryIds, storeId) => {
  return Product.updateMany(
    { _id: { $in: productIds }, storeId },
    { $push: { categories: { $each: categoryIds } } }
  );
};

const addProductToCategories = async (categoryIds, productIds, storeId) => {
  return Category.updateMany(
    { _id: { $in: categoryIds }, storeId },
    { $addToSet: { products: { $each: productIds } } }
  );
};

const bulkUpdateVisibility = async (storeId, ids, visibility) => {
  const bulkOps = ids.map((id) => ({
    updateOne: {
      filter: { _id: id, storeId },
      update: { $set: { visibility } },
    },
  }));

  return Category.bulkWrite(bulkOps);
};

const bulkUpdateOrder = async (storeId, categories) => {
  const bulkOps = categories.map((c, index) => ({
    updateOne: {
      filter: { _id: c._id, storeId },
      update: { $set: { orderIndex: index } },
    },
  }));

  return Category.bulkWrite(bulkOps);
};

const updateById = async (id, storeId, updateData) => {
  return Category.findOneAndUpdate({ _id: id, storeId }, updateData, {
    new: true,
  });
};

const findByIds = async (ids, storeId, session) => {
  return Category.find({ _id: { $in: ids }, storeId }).session(session);
};

const deleteMany = async (ids, storeId, session) => {
  return Category.deleteMany({ _id: { $in: ids }, storeId }).session(session);
};

const removeCategoriesFromProducts = async (ids, storeId, session) => {
  return Product.updateMany(
    { storeId, categories: { $in: ids } },
    { $pull: { categories: { $in: ids } } }
  ).session(session);
};

const removeCategoryFromProducts = async (
  categoryIds,
  productsToRemove,
  storeId
) => {
  return Product.updateMany(
    { _id: { $in: productsToRemove }, storeId },
    { $pull: { categories: { $in: categoryIds } } }
  );
};

const removeProductFromCategories = async (
  categoryIds,
  productIds,
  storeId
) => {
  return Category.updateMany(
    { _id: { $in: categoryIds }, storeId },
    { $pull: { products: { $in: productIds } } }
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
  bulkUpdateVisibility,
  bulkUpdateOrder,
  updateById,
  findByIds,
  deleteMany,
  removeCategoriesFromProducts,
  removeCategoryFromProducts,
  removeProductFromCategories,
};
