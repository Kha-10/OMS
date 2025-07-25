const express = require("express");
const OrdersController = require("../controllers/OrdersController");
const { body } = require("express-validator");
const handleErrorMessage = require("../middlewares/handleErrorMessage");
const RoleMiddleware = require("../middlewares/roleMiddleware");
const validatePhotoUpload = require ("../middlewares/validatePhotoUpload")
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.get("", OrdersController.index);

// router.post(
//   "",
//   // [
//   //   body("name").notEmpty(),
//   //   body("categories")
//   //     .isArray({ min: 1 })
//   //     .withMessage("Category must be a non-empty array"),
//   // ],
//   // RoleMiddleware(["tenant", "superadmin"]),
//   handleErrorMessage,
//   OrdersController.store
// );

router.post(
  "",
  handleErrorMessage,
  OrdersController.store
);

router.get("/:id", OrdersController.show);

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
