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
// router.post("/restock",OrdersController.syncProducts);
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

router.patch(
  "/:id",
  // RoleMiddleware(["admin", "superadmin"]),
  OrdersController.update
);

// router.post(
//   "/:id/upload",
//   [
//     upload.array("photo"),
//     validatePhotoUpload
//   ],
//   // RoleMiddleware(["admin", "superadmin"]),
//   handleErrorMessage,
//   OrdersController.upload
// );

module.exports = router;
