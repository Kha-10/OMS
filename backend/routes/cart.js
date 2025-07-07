const express = require("express");
const CartController = require("../controllers/CartController");
const RoleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

// router.get("", AnalyticsController.index);
router.get("/:cartId", CartController.show);

router.post("", CartController.store);

router.patch(
    "/:cartId",
    // RoleMiddleware(["admin", "superadmin"]),
    CartController.upate
  );

module.exports = router;
