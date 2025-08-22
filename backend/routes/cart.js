const express = require("express");
const CartController = require("../controllers/CartController");
const RoleMiddleware = require("../middlewares/roleMiddleware");
const checkMemberMiddleware = require("../middlewares/checkMemberMiddleware");

const router = express.Router({ mergeParams: true });

// router.get("", AnalyticsController.index);
router.get("/:cartId", CartController.show);

router.post(
  "",
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager"]),
  CartController.store
);

router.patch(
  "/:cartId",
  // RoleMiddleware(["admin", "superadmin"]),
  CartController.update
);

router.delete(
  "/:cartId/item/:productId/:variantId?",
  CartController.removeItem
);

module.exports = router;
