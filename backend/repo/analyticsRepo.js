const Order = require("../models/Order");
const Product = require("../models/Product");
const mongoose = require("mongoose");

const getOrdersAggregation = async (storeId, start, end) => {
  const storeObjectId = new mongoose.Types.ObjectId(storeId);
  const pipeline = [
    {
      $match: { storeId: storeObjectId, createdAt: { $gte: start, $lte: end } },
    },
    {
      $project: {
        createdAt: 1,
        orderStatus: 1,
        paymentStatus: 1,
        totalAmount: "$pricing.finalTotal",
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        orders: {
          $sum: {
            $cond: [
              { $in: ["$orderStatus", ["Pending", "Confirmed", "Completed"]] },
              1,
              0,
            ],
          },
        },
        revenue: {
          $sum: {
            $cond: [{ $eq: ["$paymentStatus", "Paid"] }, "$totalAmount", 0],
          },
        },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "Pending"] }, 1, 0] },
        },
        unpaidOrders: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "Unpaid"] }, 1, 0] },
        },
        completedOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "Completed"] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ];

  return Order.aggregate(pipeline);
};

const getLowStockCount = async (storeId, threshold = 5) => {
  const storeObjectId = new mongoose.Types.ObjectId(storeId);
  const result = await Product.aggregate([
    {
      $match: {
        storeId: storeObjectId,
        trackQuantityEnabled: true,
        "inventory.quantity": { $lte: threshold },
      },
    },
    { $count: "lowStockCount" },
  ]);
  return result[0]?.lowStockCount || 0;
};

module.exports = { getOrdersAggregation, getLowStockCount };
