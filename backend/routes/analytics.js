const express = require("express");
const AnalyticsController = require("../controllers/AnalyticsController");


const router = express.Router();

router.get("", AnalyticsController.getAnalytics);

module.exports = router;