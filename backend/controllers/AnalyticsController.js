const Order = require("../models/Order");
const Product = require("../models/Product");

const AnalyticsController = {
  getAnalytics: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      // Set up start and end dates
      const start = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 6 * 24 * 60 * 60 * 1000); // default: last 7 days
      start.setHours(0, 0, 0, 0);

      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);

      console.log(`Date range: ${start.toISOString()} to ${end.toISOString()}`);

      // MongoDB aggregation pipeline
      const pipeline = [
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
          },
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
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            orders: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$orderStatus",
                      ["Pending", "Confirmed", "Completed"],
                    ],
                  },
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
              $sum: {
                $cond: [{ $eq: ["$orderStatus", "Pending"] }, 1, 0],
              },
            },
            unpaidOrders: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "Unpaid"] }, 1, 0],
              },
            },
            completedOrders: {
              $sum: {
                $cond: [{ $eq: ["$orderStatus", "Completed"] }, 1, 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ];

      const rawData = await Order.aggregate(pipeline);
      console.log("rawData", rawData);

      // Convert rawData into a map for easy lookup
      const dataMap = {};
      rawData.forEach(
        ({
          _id,
          orders,
          revenue,
          pendingOrders,
          unpaidOrders,
          completedOrders,
        }) => {
          dataMap[_id] = {
            orders,
            revenue,
            pendingOrders,
            unpaidOrders,
            completedOrders,
          };
        }
      );

      console.log("dataMap:", dataMap);

      const resultOrdersByDate = [];
      const resultRevenueByDate = [];
      const resultPendingOrdersByDate = [];
      const resultUnpaidOrdersByDate = [];
      const resultCompletedOrdersByDate = [];

      // Create a new date object for iteration to avoid mutating the original
      // Use local dates instead of UTC to match the aggregation format
      const currentDate = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate()
      );
      const atEndDate = new Date(
        end.getFullYear(),
        end.getMonth(),
        end.getDate()
      );

      while (currentDate <= atEndDate) {
        const dateKey = `${currentDate.getFullYear()}-${String(
          currentDate.getMonth() + 1
        ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
        const displayDate = formatDisplayDate(currentDate);

        console.log(`Processing date: ${dateKey}, displayDate: ${displayDate}`);
        console.log(`Found data:`, dataMap[dateKey]);

        resultOrdersByDate.push({
          date: displayDate,
          value: dataMap[dateKey]?.orders || 0,
        });

        resultRevenueByDate.push({
          date: displayDate,
          value: dataMap[dateKey]?.revenue || 0,
        });

        resultPendingOrdersByDate.push({
          date: displayDate,
          value: dataMap[dateKey]?.pendingOrders || 0,
        });

        resultUnpaidOrdersByDate.push({
          date: displayDate,
          value: dataMap[dateKey]?.unpaidOrders || 0,
        });

        resultCompletedOrdersByDate.push({
          date: displayDate,
          value: dataMap[dateKey]?.completedOrders || 0,
        });

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Calculate totals
      const totalOrders = resultOrdersByDate.reduce(
        (sum, d) => sum + d.value,
        0
      );
      const totalRevenue = resultRevenueByDate.reduce(
        (sum, d) => sum + d.value,
        0
      );
      const totalPendingOrders = resultPendingOrdersByDate.reduce(
        (sum, d) => sum + d.value,
        0
      );
      const totalUnpaidOrders = resultUnpaidOrdersByDate.reduce(
        (sum, d) => sum + d.value,
        0
      );
      const totalCompletedOrders = resultCompletedOrdersByDate.reduce(
        (sum, d) => sum + d.value,
        0
      );

      const threshold = parseInt(req.query.threshold) || 5;

      const lowStockCount = await Product.aggregate([
        {
          $match: {
            trackQuantityEnabled: true,
            "inventory.quantity": { $lte: threshold },
          },
        },
        {
          $count: "lowStockCount",
        },
      ]);

      res.json({
        orders: totalOrders,
        revenue: totalRevenue,
        pendingOrders: totalPendingOrders,
        unpaidOrders: totalUnpaidOrders,
        completedOrders: totalCompletedOrders,
        ordersByDate: resultOrdersByDate,
        revenueByDate: resultRevenueByDate,
        pendingOrdersByDate: resultPendingOrdersByDate,
        unpaidOrdersByDate: resultUnpaidOrdersByDate,
        lowStockCount: lowStockCount[0]?.lowStockCount || 0,
      });
    } catch (err) {
      console.error("Analytics error:", err);
      res.status(500).json({ error: "Failed to get analytics" });
    }
  },
};

module.exports = AnalyticsController;

function formatDisplayDate(date) {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
