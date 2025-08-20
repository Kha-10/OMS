const Product = require("../models/Product");
const Category = require("../models/Category");

const find = async (storeId, query, sort, page, limit, search) => {
  const skip = (page - 1) * limit;

  const tenantQuery = { storeId: storeId, ...query };

  const findQuery = Product.find(tenantQuery)
    .populate("categories")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  if (search) {
    findQuery.collation({ locale: "en", strength: 2 });
  }

  const [products, totalProducts, allProductsCount] = await Promise.all([
    findQuery,
    Product.countDocuments(tenantQuery),
    Product.countDocuments({ store: storeId }),
  ]);

  return { products, totalProducts, allProductsCount, page, limit };
};

const findByName = async (storeId, name) => {
  return Product.findOne({ storeId, name });
};

const create = async (storeId, data) => {
  return Product.create({ ...data, storeId });
};

const addProductToCategories = async (categoryIds, productId) => {
  console.log("categoryIds", categoryIds);
  console.log("productId", productId);
  return Category.updateMany(
    { _id: { $in: categoryIds } },
    { $push: { products: productId } }
  );
};

const findById = (storeId,id) => {
  return Product.findOne({ storeId, _id: id }).populate("categories");
};

module.exports = {
  find,
  findById,
  findByName,
  create,
  addProductToCategories,
};
