const express = require("express");
const CustomerController = require("../controllers/CustomerController");
const { body } = require("express-validator");
const handleErrorMessage = require("../middlewares/handleErrorMessage");
const RoleMiddleware = require("../middlewares/roleMiddleware");
const validatePhotoUpload = require("../middlewares/validatePhotoUpload");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.get("", CustomerController.index);

router.post(
  "",
  [
    body("name").notEmpty(),
    body("phone").notEmpty(),
    body("deliveryAddress").notEmpty(),
  ],
  // RoleMiddleware(["tenant", "superadmin"]),
  handleErrorMessage,
  CustomerController.store
);

router.get("/:id", CustomerController.show);

router.delete(
  "/bulk",
  // RoleMiddleware(["admin", "superadmin"]),
  CustomerController.bulkDestroy
);

router.delete(
  "/:id",
  // RoleMiddleware(["admin", "superadmin"]),
  CustomerController.destroy
);

router.patch(
  "/:id",
  // RoleMiddleware(["admin", "superadmin"]),
  CustomerController.update
);

module.exports = router;
