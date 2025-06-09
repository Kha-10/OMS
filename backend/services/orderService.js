const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { getSignedUrl } = require("@aws-sdk/cloudfront-signer");
const clearProductCache = require("../helpers/clearProductCache");

// GET
const buildQuery = (queryParams) => {
  let query = {};

  if (queryParams.status) {
    query.status = { $in: queryParams.status.split(",") };
  }
  if (queryParams.paymentStatus) {
    query.paymentStatus = queryParams.paymentStatus;
  }
  if (queryParams.fulfillmentStatus) {
    query.fulfillmentStatus = queryParams.fulfillmentStatus;
  }

  if (queryParams.search) {
    query.$or = [
      { orderNumber: { $regex: queryParams.search, $options: "i" } },
      { customerName: { $regex: queryParams.search, $options: "i" } },
      { "items.name": { $regex: queryParams.search, $options: "i" } },
    ];
  }

  return query;
};

const buildSort = (sortBy, sortDirection) => {
  const direction = sortDirection === "asc" ? 1 : -1;
  return sortBy === "amount"
    ? { totalAmount: direction }
    : { createdAt: direction };
};

const fetchOrdersFromDB = async (queryParams) => {
  const query = buildQuery(queryParams);
  const sort = buildSort(queryParams.sortBy, queryParams.sortDirection);
  const page = Number(queryParams.page) || 1;
  const limit = Number(queryParams.limit) || 10;
  const skip = (page - 1) * limit;

  const [orders, totalOrders] = await Promise.all([
    Order.find(query).populate("customer").sort(sort).skip(skip).limit(limit),
    Order.countDocuments(query),
  ]);
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

const restockOrderItems = async (order, session) => {
  const bulkOps = [];

  for (const item of order.items) {
    if (!item.productId) {
      console.warn(
        `Skipping restock: item with no productId in order ${order._id}`
      );
      continue;
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: item.productId, trackQuantityEnabled: true },
        update: { $inc: { "inventory.quantity": item.quantity } },
      },
    });
  }

  if (bulkOps.length > 0) {
    await Product.bulkWrite(bulkOps, { session });
  }
};

const restockBulkOrderItems = async (orders, session) => {
  const bulkOps = [];

  for (const order of orders) {
    for (const item of order.items) {
      if (!item.productId) {
        console.warn(
          `Skipping restock: item with no productId in order ${order._id}`
        );
        continue;
      }
      bulkOps.push({
        updateOne: {
          filter: { _id: item.productId, trackQuantityEnabled: true },
          update: { $inc: { "inventory.quantity": item.quantity } },
        },
      });
    }
  }

  if (bulkOps.length > 0) {
    await Product.bulkWrite(bulkOps, { session });
  }
};

// UPDATE
const getOrderById = async (id, session) => {
  return await Order.findById(id).session(session);
};

const getOrdersByIds = async (orderIds, session) => {
  return await Order.find({ _id: { $in: orderIds } }).session(session);
};

const updateOrder = async (id, updateData, session) => {
  return await Order.findByIdAndUpdate(id, updateData, {
    new: true,
    session,
  });
};

const updateBulkOrders = async (orderIds, updateData, session) => {
  // Build bulk operations
  const bulkOps = orderIds.map((orderId) => ({
    updateOne: {
      filter: { _id: orderId },
      update: updateData,
    },
  }));

  // Perform all updates in one call
  const result = await Order.bulkWrite(bulkOps, { session });

  // Fetch updated orders to return them
  const orders = await Order.find({ _id: { $in: orderIds } }).session(session);

  // Prepare results
  const foundIds = orders.map((o) => o._id.toString());
  const success = foundIds;
  const failed = orderIds
    .filter((id) => !foundIds.includes(id.toString()))
    .map((id) => ({ id, reason: "Order not found" }));

  return { success, failed, orders };
};

const deductOrderItems = async (order, session) => {
  const bulkOps = [];
  for (const item of order.items) {
    if (!item.productId) {
      console.warn(
        `Skipping deduction: item with no productId in order ${order._id}`
      );
      continue;
    }
    bulkOps.push({
      updateOne: {
        filter: { _id: item.productId, trackQuantityEnabled: true },
        update: { $inc: { "inventory.quantity": -item.quantity } },
      },
    });
  }
  if (bulkOps.length > 0) {
    await Product.bulkWrite(bulkOps, { session });
  }
};

// Bulk order deduct function
const deductBulkOrderItems = async (orders, session) => {
  const bulkOps = [];
  for (const order of orders) {
    // await deductOrderItems(order, session);
    for (const item of order.items) {
      if (!item.productId) {
        console.warn(
          `Skipping deduction: item with no productId in order ${order._id}`
        );
        continue;
      }
      bulkOps.push({
        updateOne: {
          filter: { _id: item.productId, trackQuantityEnabled: true },
          update: { $inc: { "inventory.quantity": -item.quantity } },
        },
      });
    }
  }
  if (bulkOps.length > 0) {
    await Product.bulkWrite(bulkOps, { session });
  }
};

module.exports = {
  findOrders,
  enhanceProductImages,
  removeOrder,
  removeBulkOrders,
  restockOrderItems,
  restockBulkOrderItems,
  getOrderById,
  getOrdersByIds,
  updateOrder,
  updateBulkOrders,
  deductOrderItems,
  deductBulkOrderItems,
};
