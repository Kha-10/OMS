const Order = require("../models/Order");

const AnalyticsController = {
  getAnalytics: async (req, res) => {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);

    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $project: {
          createdAt: 1,
          totalAmount: 1,
          status: 1,
          paymentStatus: 1,
        },
      },
      {
        $group: {
          _id: {
            $dateTrunc: { date: "$createdAt", unit: "day" },
          },
          orders: {
            $sum: {
              $cond: [
                { $in: ["$status", ["Pending", "Confirmed", "Completed"]] },
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
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];

    const rawData = await Order.aggregate(pipeline);

    // Normalize results into fixed date range
    const dateMap = {};
    rawData.forEach((entry) => {
      const dateStr = entry._id.toISOString().split("T")[0]; // "YYYY-MM-DD"
      dateMap[dateStr] = {
        orders: entry.orders,
        revenue: entry.revenue,
      };
    });

    const resultOrdersByDate = [];
    const resultRevenueByDate = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];

      resultOrdersByDate.push({
        date: formatDisplayDate(d),
        value: dateMap[dateStr]?.orders || 0,
      });

      resultRevenueByDate.push({
        date: formatDisplayDate(d),
        value: dateMap[dateStr]?.revenue || 0,
      });
    }

    // Final response
    const totalOrders = resultOrdersByDate.reduce((acc, d) => acc + d.value, 0);
    const totalRevenue = resultRevenueByDate.reduce(
      (acc, d) => acc + d.value,
      0
    );

    res.json({
      orders: totalOrders,
      revenue: totalRevenue,
      ordersByDate: resultOrdersByDate,
      revenueByDate: resultRevenueByDate,
      // optional: pageViews if you add that later
    });
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
