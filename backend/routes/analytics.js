const express = require("express");
const AnalyticsController = require("../controllers/AnalyticsController");
const RoleMiddleware = require("../middlewares/roleMiddleware");
const checkMemberMiddleware = require("../middlewares/checkMemberMiddleware");

const router = express.Router();

router.get(
  "",
  checkMemberMiddleware,
  RoleMiddleware(["owner"]),
  AnalyticsController.getAnalytics
);

module.exports = router;
