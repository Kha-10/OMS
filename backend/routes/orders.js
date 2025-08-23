const express = require("express");
const OrdersController = require("../controllers/OrdersController");
const { body } = require("express-validator");
const handleErrorMessage = require("../middlewares/handleErrorMessage");
const RoleMiddleware = require("../middlewares/roleMiddleware");
const idempotencyCheck = require("../middlewares/idempotencyCheck");
const lockOrderMiddleware = require("../middlewares/lockOrder");
const checkMemberMiddleware = require("../middlewares/checkMemberMiddleware");
const Customercontroller = require("../controllers/CustomerController");

const router = express.Router({ mergeParams: true });

router.get(
  "/",
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager", "staff"]),
  OrdersController.index
);
router.post(
  "/:id/edit",
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager", "staff"]),
  lockOrderMiddleware,
  OrdersController.singleOrderEdit
);
router.post(
  "/:id/update",
  // lockOrderMiddleware,
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager", "staff"]),
  OrdersController.updateOrder
);
router.post(
  "/bulk-update",
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager", "staff"]),
  OrdersController.bulkUpdate
);
router.post(
  "/bulk-delete",
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager", "staff"]),
  OrdersController.bulkDestroy
);
router.post(
  "/deduct",
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager", "staff"]),
  OrdersController.deduct
);
router.post(
  "/restock",
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager", "staff"]),
  OrdersController.restock
);
router.post(
  "/refund",
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager", "staff"]),
  Customercontroller.refund
);
router.post(
  "/pay",
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager", "staff"]),
  Customercontroller.pay
);
router.post(
  "/",
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager", "staff"]),
  idempotencyCheck,
  OrdersController.store
);

router.get(
  "/:id/load-as-cart",
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager", "staff"]),
  OrdersController.loadOrderAsCart
);
router.get(
  "/:id",
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager", "staff"]),
  OrdersController.show
);

router.delete(
  "/:cartId/discard",
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager", "staff"]),
  OrdersController.discardCart
);
router.delete(
  "/:id",
  // RoleMiddleware(["admin", "superadmin"]),
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager", "staff"]),
  OrdersController.destroy
);

module.exports = router;
