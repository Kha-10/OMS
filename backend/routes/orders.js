const express = require("express");
const OrdersController = require("../controllers/OrdersController");
const { body } = require("express-validator");
const handleErrorMessage = require("../middlewares/handleErrorMessage");
const RoleMiddleware = require("../middlewares/roleMiddleware");
const idempotencyCheck = require("../middlewares/idempotencyCheck");
const lockOrderMiddleware = require("../middlewares/lockOrder");

const router = express.Router();

router.get("", OrdersController.index);
router.post(
  "/:id/edit",
  handleErrorMessage,
  lockOrderMiddleware,
  OrdersController.singleOrderedit
);
router.post(
  "/:id/update",
  // lockOrderMiddleware,
  OrdersController.updateOrder
);
router.post("/bulk-update", OrdersController.bulkUpdate);
router.post("/deduct", OrdersController.deduct);
router.post("/restock", OrdersController.restock);
router.post("/refund", OrdersController.refund);
router.post("/pay", OrdersController.pay);
router.post("", handleErrorMessage, idempotencyCheck, OrdersController.store);

router.get("/:orderId/load-as-cart", OrdersController.loadOrderAsCart);
router.get("/:id", OrdersController.show);

router.delete(
  "/:cartId/discard",
  handleErrorMessage,
  OrdersController.discardCart
);
router.delete(
  "/:id",
  // RoleMiddleware(["admin", "superadmin"]),
  OrdersController.destroy
);

module.exports = router;
