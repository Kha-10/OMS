const express = require("express");
const StoreController = require("../controllers/StoreController");
const { body } = require("express-validator");
const handleErrorMessage = require("../middlewares/handleErrorMessage");
const RoleMiddleware = require("../middlewares/roleMiddleware");
const validatePhotoUpload = require("../middlewares/validatePhotoUpload");
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

module.exports = router;
