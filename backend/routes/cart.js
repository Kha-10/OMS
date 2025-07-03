const express = require("express");
const CartController = require("../controllers/CartController");
const RoleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

// router.get("", AnalyticsController.index);

router.post(
  "",
  CartController.store
);


module.exports = router;