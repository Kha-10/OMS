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

const addCategoryToProducts = async (productIds, categoryIds, storeId) => {
  console.log("categoryIds",categoryIds);
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

module.exports = {
  findByName,
  findById,
  find,
  create,
  findLastCategory,
  addCategoryToProducts,
  addProductToCategories,
  removeProductFromCategories,
  bulkUpdateVisibility,
  bulkUpdateOrder,
  updateById,
};
