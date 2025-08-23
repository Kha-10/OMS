const Product = require("../models/Product");
const Category = require("../models/Category");
const uploadAdapter = require("../services/adapters/index");
const handler = require("../helpers/handler");

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

const addProductToCategories = async (categoryIds, productId, storeId) => {
  return Category.updateMany(
    { _id: { $in: categoryIds }, storeId },
    { $push: { products: { $each: productId } } }
  );
};

const findById = (storeId, id) => {
  return Product.findOne({ storeId, _id: id }).populate("categories");
};

const update = async (storeId, productId, updateData) => {
  const { images, deletedImages, ...rest } = updateData;

  if (deletedImages && deletedImages.length > 0) {
    uploadAdapter.updateImages(productId, deletedImages, images);
  }

  return Product.findOneAndUpdate(
    { _id: productId, storeId },
    { ...rest, images },
    { new: true }
  );
};

const bulkUpdateVisibility = async (storeId, ids, visibility) => {
  const bulkOps = ids.map((id) => ({
    updateOne: {
      filter: { _id: id, storeId },
      update: { $set: { visibility } },
    },
  }));

  return Product.bulkWrite(bulkOps);
};

const findByIds = async (ids, storeId, session) => {
  return Product.find({
    _id: { $in: ids },
    storeId: storeId,
  }).session(session);
};

const insertMany = async (storeId, products, session) => {
  const productsWithStore = products.map((p) => ({
    ...p,
    storeId,
  }));
  return Product.insertMany(productsWithStore, { session });
};

const deleteMany = async (storeId, ids, session) => {
  return Product.deleteMany({
    _id: { $in: ids },
    storeId,
  }).session(session);
};

const validateAndDecrementInventory = async (item, session, storeId) => {
  const product = await Product.findOne({
    _id: item.productId,
    storeId,
  }).session(session);

  if (!product) {
    handler.notFoundError("Product not found");
  }

  if (
    product.trackQuantityEnabled &&
    product.inventory.quantity < item.quantity
  ) {
    handler.insufficient(`Insufficient inventory for product ${product.name}`);
  }

  if (product.trackQuantityEnabled) {
    product.inventory.quantity -= item.quantity;
    await product.save({ session });
  }
};

const bulkDeductInventory = async (items, session, storeId) => {
  return Product.bulkWrite(
    items.map((item) => ({
      updateOne: {
        filter: { _id: item.productId, storeId, trackQuantityEnabled: true },
        update: { $inc: { "inventory.quantity": -item.quantity } },
      },
    })),
    { session }
  );
};

module.exports = {
  find,
  findById,
  findByName,
  create,
  update,
  addProductToCategories,
  bulkUpdateVisibility,
  findByIds,
  insertMany,
  deleteMany,
  validateAndDecrementInventory,
  bulkDeductInventory,
};
