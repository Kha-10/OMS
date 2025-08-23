const AnalyticsRepo = require("../repo/analyticsRepo");

const formatDisplayDate = (date) => date.toISOString().split("T")[0]; // simple example

const getAnalytics = async (storeId, startDate, endDate, threshold = 5) => {
  const start = startDate
    ? new Date(startDate)
    : new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  console.log("=== AGGREGATION DEBUG ===");
  console.log("storeId:", storeId, "type:", typeof storeId);
  console.log("start:", start);
  console.log("end:", end);
  const rawData = await AnalyticsRepo.getOrdersAggregation(storeId, start, end);
  console.log("rawData", rawData);
  const dataMap = {};
  rawData.forEach((item) => {
    dataMap[item._id] = item;
  });

  const resultOrdersByDate = [];
  const resultRevenueByDate = [];
  const resultPendingOrdersByDate = [];
  const resultUnpaidOrdersByDate = [];
  const resultCompletedOrdersByDate = [];

  const currentDate = new Date(start);
  const atEndDate = new Date(end);

  while (currentDate <= atEndDate) {
    const dateKey = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
    const displayDate = formatDisplayDate(currentDate);
    const data = dataMap[dateKey] || {};

    resultOrdersByDate.push({ date: displayDate, value: data.orders || 0 });
    resultRevenueByDate.push({ date: displayDate, value: data.revenue || 0 });
    resultPendingOrdersByDate.push({
      date: displayDate,
      value: data.pendingOrders || 0,
    });
    resultUnpaidOrdersByDate.push({
      date: displayDate,
      value: data.unpaidOrders || 0,
    });
    resultCompletedOrdersByDate.push({
      date: displayDate,
      value: data.completedOrders || 0,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  const totalOrders = resultOrdersByDate.reduce((sum, d) => sum + d.value, 0);
  const totalRevenue = resultRevenueByDate.reduce((sum, d) => sum + d.value, 0);
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

  const lowStockCount = await AnalyticsRepo.getLowStockCount(
    storeId,
    threshold
  );

  return {
    orders: totalOrders,
    revenue: totalRevenue,
    pendingOrders: totalPendingOrders,
    unpaidOrders: totalUnpaidOrders,
    completedOrders: totalCompletedOrders,
    ordersByDate: resultOrdersByDate,
    revenueByDate: resultRevenueByDate,
    pendingOrdersByDate: resultPendingOrdersByDate,
    unpaidOrdersByDate: resultUnpaidOrdersByDate,
    lowStockCount,
  };
};

module.exports = { getAnalytics };
