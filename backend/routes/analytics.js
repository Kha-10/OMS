const express = require("express");
const AnalyticsController = require("../controllers/AnalyticsController");
const { body } = require("express-validator");
const handleErrorMessage = require("../middlewares/handleErrorMessage");
const RoleMiddleware = require("../middlewares/roleMiddleware");
const validatePhotoUpload = require ("../middlewares/validatePhotoUpload")
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.get("", AnalyticsController.index);

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
  AnalyticsController.store
);

router.get("/:id", AnalyticsController.show);

router.delete(
  "/:id",
  // RoleMiddleware(["admin", "superadmin"]),
  AnalyticsController.destroy
);

router.patch(
  "/:id",
  // RoleMiddleware(["admin", "superadmin"]),
  AnalyticsController.update
);

module.exports = router;