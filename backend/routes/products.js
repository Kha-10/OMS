const express = require("express");
const ProductsController = require("../controllers/ProductsController");
const { body } = require("express-validator");
const handleErrorMessage = require("../middlewares/handleErrorMessage");
const RoleMiddleware = require("../middlewares/roleMiddleware");
const checkMemberMiddleware = require("../middlewares/checkMemberMiddleware");
const multer = require("multer");
const uploadAdapter = require("../services/adapters/index");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router({ mergeParams: true });

router.get("/", ProductsController.index);

router.post(
  "/duplicate",
  body("ids")
    .isArray({ min: 1 })
    .withMessage("Product IDs must be a non-empty array"),
  handleErrorMessage,
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager"]),
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
  handleErrorMessage,
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager"]),
  ProductsController.updateVisibility
);

router.post(
  "/",
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

router.post(
  "/:id/upload",
  // [upload.array("photo"), validatePhotoUpload],
  [upload.array("photo"), uploadAdapter.uploadImages],
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager"]),
  ProductsController.upload
);

router.get("/:id", ProductsController.show);

router.post(
  "/bulk",
  [
    body("ids")
      .isArray({ min: 1 })
      .withMessage("Product IDs must be a non-empty array"),
  ],
  handleErrorMessage,
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager"]),
  ProductsController.bulkDestroy
);

router.patch(
  "/:id",
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager"]),
  ProductsController.update
);

module.exports = router;
