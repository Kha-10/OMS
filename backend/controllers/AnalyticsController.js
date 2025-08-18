const AnalyticsService = require("../services/analyticsService");

const AnalyticsController = {
  getAnalytics: async (req, res) => {
    try {
      const storeId = req.storeId;
      const { startDate, endDate, threshold } = req.query;

      const analytics = await AnalyticsService.getAnalytics(
        storeId,
        startDate,
        endDate,
        parseInt(threshold) || 5
      );

      res.json(analytics);
    } catch (err) {
      console.error("Analytics error:", err);
      res.status(500).json({ error: "Failed to get analytics" });
    }
  },
};

module.exports = AnalyticsController;