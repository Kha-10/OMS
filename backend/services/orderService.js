const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");
const clearProductCache = require("../helpers/clearProductCache");

// GET
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

const fetchOrdersFromDB = async (queryParams) => {
  const sort = buildSort(queryParams.sortBy, queryParams.sortDirection);
  const page = Number(queryParams.page) || 1;
  const limit = Number(queryParams.limit) || 10;
  const skip = (page - 1) * limit;
  const matchStage = buildMatchStage(queryParams);

  // const [orders, totalOrders] = await Promise.all([
  //   Order.find(query).populate("customer").sort(sort).skip(skip).limit(limit),
  //   Order.countDocuments(query),
  // ]);
  // return { orders, totalOrders, page, limit };

  const [orders, totalOrdersData] = await Promise.all([
    Order.aggregate([
      {
        $lookup: {
          from: "customers", // collection name
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

  return { orders, totalOrders, page, limit };
};

const enhanceProductImages = (input) => {
  if (!input) return input;

  const processProduct = (product) => {
    if (Array.isArray(product.items)) {
      product.items.forEach((item) => {
        if (Array.isArray(item.photo) && item.photo.length > 0) {
          item.imgUrls = item.photo.map((image) =>
            getSignedUrl({
              url: `https://d1pgjvyfhid4er.cloudfront.net/${image}`,
              dateLessThan: new Date(Date.now() + 1000 * 60 * 60),
              privateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
              keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
            })
          );
        }
      });
    }
    return product;
  };

  return Array.isArray(input)
    ? input.map(processProduct)
    : processProduct(input);
};

const findOrders = async (queryParams) => {
  const orderData = await fetchOrdersFromDB(queryParams);
  return orderData;
};

// Delete
const removeOrder = async (orderId, session) => {
  const order = await Order.findById(orderId).session(session);
  if (!order) {
    return null;
  }

  // await Order.findByIdAndDelete(orderId).session(session);
  await Order.deleteOne({ _id: orderId }).session(session);
  return order;
};

// Remove multiple orders
const removeBulkOrders = async (orderIds, session) => {
  const orders = await Order.find({ _id: { $in: orderIds } }).session(session);
  const result = await Order.deleteMany({ _id: { $in: orderIds } }).session(
    session
  );
  const foundIds = orders.map((o) => o._id.toString());
  const success = foundIds;
  const failed = orderIds
    .filter((id) => !foundIds.includes(id.toString()))
    .map((id) => ({ id, reason: "Order not found" }));
  return { success, failed, orders };
};

module.exports = {
  findOrders,
  enhanceProductImages,
  removeOrder,
  removeBulkOrders,
};
