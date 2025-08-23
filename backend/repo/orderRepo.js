const Order = require("../models/Order");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const mongoose = require("mongoose");

const fetchOrders = async (queryParams) => {
  const sort = buildSort(queryParams.sortBy, queryParams.sortDirection);
  const page = Number(queryParams.page) || 1;
  const limit = Number(queryParams.limit) || 10;
  const skip = (page - 1) * limit;

  const matchStage = buildMatchStage(queryParams);

  if (queryParams.storeId) {
    matchStage.storeId = new mongoose.Types.ObjectId(queryParams.storeId);
  }

  const [orders, totalOrdersData] = await Promise.all([
    Order.aggregate([
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      { $match: matchStage },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ]),
    Order.aggregate([
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      { $match: matchStage },
      { $count: "count" },
    ]),
  ]);

  const totalOrders = totalOrdersData[0]?.count || 0;
  console.log("orders", orders);
  return { orders, totalOrders, page, limit };
};

// Helpers
const buildSort = (sortBy, sortDirection) => {
  const direction = sortDirection === "asc" ? 1 : -1;
  return sortBy === "amount"
    ? { totalAmount: direction }
    : { createdAt: direction };
};

const buildMatchStage = (queryParams) => {
  let match = {};
  if (queryParams.orderStatus) {
    match.orderStatus = { $in: queryParams.orderStatus.split(",") };
  }
  if (queryParams.paymentStatus) {
    match.paymentStatus = queryParams.paymentStatus;
  }
  if (queryParams.fulfillmentStatus) {
    match.fulfillmentStatus = queryParams.fulfillmentStatus;
  }

  if (queryParams.search) {
    const regex = new RegExp(queryParams.search, "i");
    match.$or = [
      { orderNumber: regex },
      { "customer.name": regex },
      { "manualCustomer.name": regex },
      { "items.productName": regex },
    ];
  }

  return match;
};

const createOrder = async (orderData, session) => {
  const [order] = await Order.create([orderData], { session });
  return order;
};

const findById = async (orderId, storeId, session = null) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return null;
  }

  const query = Order.findOne({ _id: orderId, storeId }).populate("customer");

  if (session) {
    query.session(session);
  }

  return query;
};

const findProductById = async (productId, storeId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return null;
  }

  return Product.findOne({ _id: productId, storeId });
};

const saveOrder = async (order) => {
  return order.save();
};

const findCustomerById = async (id, storeId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Customer.findOne({ _id: id, storeId });
};

const saveCustomer = async (customer) => {
  return customer.save();
};

const updateOrder = async (id, storeId, updateData, session = null) => {
  const query = Order.updateOne({ _id: id, storeId }, { $set: updateData });

  if (session) {
    query.session(session);
  }

  return query;
};

const restoreProductQuantity = async (
  productId,
  quantity,
  storeId,
  session
) => {
  return Product.updateOne(
    { _id: productId, storeId, trackQuantityEnabled: true },
    { $inc: { "inventory.quantity": quantity } },
    { session }
  );
};

const deductProductQuantity = async (productId, quantity, storeId, session) => {
  return Product.updateOne(
    { _id: productId, storeId, trackQuantityEnabled: true },
    { $inc: { "inventory.quantity": -quantity } },
    { session }
  );
};

const removeOrder = async (orderId, storeId, session = null) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return null;
  }

  const query = Order.findOneAndDelete({ _id: orderId, storeId });
  if (session) query.session(session);
  return query;
};

const restockOrderItems = async (order, session) => {
  if (!order || !order.items) return;

  await Product.bulkWrite(
    order.items.map((item) => ({
      updateOne: {
        filter: {
          _id: item.productId,
          storeId: order.storeId,
          trackQuantityEnabled: true,
        },
        update: { $inc: { "inventory.quantity": item.quantity } },
      },
    })),
    { session }
  );
};

const bulkDeleteOrders = async (orderIds, storeId, session) => {
  return Order.deleteMany({ _id: { $in: orderIds }, storeId }).session(session);
};

const findOrdersByIds = async (orderIds, storeId, session) => {
  return Order.find({ _id: { $in: orderIds }, storeId }).session(session);
};

const bulkUpdate = async (orderIds, updateData, session, storeId) => {
  return Order.updateMany(
    { _id: { $in: orderIds }, storeId },
    { $set: updateData },
    { session }
  );
};

module.exports = {
  fetchOrders,
  createOrder,
  findById,
  findProductById,
  saveOrder,
  findCustomerById,
  saveCustomer,
  updateOrder,
  restoreProductQuantity,
  deductProductQuantity,
  removeOrder,
  restockOrderItems,
  bulkDeleteOrders,
  findOrdersByIds,
  bulkUpdate
};
