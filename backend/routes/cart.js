const express = require("express");
const CartController = require("../controllers/CartController");
const RoleMiddleware = require("../middlewares/roleMiddleware");
const checkMemberMiddleware = require("../middlewares/checkMemberMiddleware");

const router = express.Router({ mergeParams: true });

router.get("/:cartId", CartController.show);

router.post(
  "",
  CartController.store
);

router.patch(
  "/:cartId",
  CartController.update
);

router.delete(
  "/:cartId/item/:id/:productId/:variantId?",
  CartController.removeItem
);

module.exports = router;
