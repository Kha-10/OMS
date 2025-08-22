const Order = require("../models/Order");
const Product = require("../models/Product");
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

const findById = async (orderId, storeId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return null;
  }

  return Order.findOne({ _id: orderId, storeId }).populate("customer");
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

module.exports = {
  fetchOrders,
  createOrder,
  findById,
  findProductById,
  saveOrder,
};
