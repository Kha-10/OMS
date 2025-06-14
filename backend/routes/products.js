const express = require("express");
const ProductsController = require("../controllers/ProductsController");
const { body } = require("express-validator");
const handleErrorMessage = require("../middlewares/handleErrorMessage");
const RoleMiddleware = require("../middlewares/roleMiddleware");
const validatePhotoUpload = require("../middlewares/validatePhotoUpload");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.get("", ProductsController.index);

router.post(
  "/duplicate",
  body("ids")
    .isArray({ min: 1 })
    .withMessage("Product IDs must be a non-empty array"),
  // RoleMiddleware(["tenant", "superadmin"]),
  handleErrorMessage,
  ProductsController.duplicate
);

router.post(
  "/visibility",
  [
    body("ids")
      .isArray({ min: 1 })
      .withMessage("Product IDs must be a non-empty array"),
    body("visibility").notEmpty(),
  ],
  // RoleMiddleware(["tenant", "superadmin"]),
  handleErrorMessage,
  ProductsController.updateVisibility
);

router.post(
  "",
  [
    body("name").notEmpty(),
    body("categories")
      .isArray({ min: 1 })
      .withMessage("Category must be a non-empty array"),
  ],
  // RoleMiddleware(["tenant", "superadmin"]),
  handleErrorMessage,
  ProductsController.store
);

router.get("/:id", ProductsController.show);

router.delete(
  "/bulk",
  // RoleMiddleware(["admin", "superadmin"]),
  ProductsController.bulkDestroy
);

router.delete(
  "/:id",
  // RoleMiddleware(["admin", "superadmin"]),
  ProductsController.destroy
);

router.patch(
  "/:id",
  // RoleMiddleware(["admin", "superadmin"]),
  ProductsController.update
);

router.post(
  "/:id/upload",
  [upload.array("photo"), validatePhotoUpload],
  // RoleMiddleware(["admin", "superadmin"]),
  handleErrorMessage,
  ProductsController.upload
);

module.exports = router;
