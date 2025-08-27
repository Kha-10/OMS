const express = require("express");
const CustomerController = require("../controllers/CustomerController");
const { body } = require("express-validator");
const handleErrorMessage = require("../middlewares/handleErrorMessage");
const RoleMiddleware = require("../middlewares/roleMiddleware");
const checkMemberMiddleware = require("../middlewares/checkMemberMiddleware");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router({ mergeParams: true });

router.get(
  "",
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager", "staff"]),
  CustomerController.index
);

router.post(
  "",
  [
    body("name").notEmpty(),
    body("phone").notEmpty(),
    body("deliveryAddress").notEmpty(),
  ],
  handleErrorMessage,
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager", "staff"]),
  CustomerController.store
);

router.get(
  "/:id",
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager", "staff"]),
  CustomerController.show
);

router.post(
  "/bulk-delete",
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager"]),
  CustomerController.bulkDestroy
);

router.delete(
  "/:id",
  // RoleMiddleware(["admin", "superadmin"]),
  CustomerController.destroy
);

router.patch(
  "/:id",
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager", "staff"]),
  CustomerController.update
);

module.exports = router;
