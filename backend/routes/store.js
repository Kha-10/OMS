const express = require("express");
const StoreController = require("../controllers/StoreController");
const { body } = require("express-validator");
const handleErrorMessage = require("../middlewares/handleErrorMessage");
const RoleMiddleware = require("../middlewares/roleMiddleware");
const checkMemberMiddleware = require("../middlewares/checkMemberMiddleware");
const ProductsController = require("../controllers/ProductsController");
const multer = require("multer");
const uploadAdapter = require("../services/adapters/index");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.post(
  "",
  [body("name").notEmpty(), body("phone").notEmpty()],
  handleErrorMessage,
  StoreController.store
);

router.post(
  "/:id/upload",
  // [upload.array("photo"), validatePhotoUpload],
  [upload.array("photo"), uploadAdapter.uploadImages],
  // RoleMiddleware(["admin", "superadmin"]),
  handleErrorMessage,
  StoreController.upload
);

router.post(
  "/:id/products",
  [
    body("name").notEmpty(),
    body("categories")
      .isArray({ min: 1 })
      .withMessage("Category must be a non-empty array"),
  ],
  handleErrorMessage,
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager"]),
  ProductsController.store
);

module.exports = router;
