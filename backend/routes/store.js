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

router.get("", StoreController.index);

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
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager"]),
  StoreController.upload
);

router.post(
  "/:storeId/products/onboarding",
  [
    body().custom((value) => {
      if (
        !value.name &&
        !value.categories &&
        !value.price &&
        !value.addSamples
      ) {
        throw new Error(
          "Please add a product manually or select 'Add sample products' to get started."
        );
      }
      return true;
    }),

    body().custom((value) => {
      if (value.addSamples === false) {
        if (!value.name) {
          throw new Error(
            "Product name is required when 'Add sample products'"
          );
        }
        if (!value.categories) {
          throw new Error(
            "Category is required when 'Add sample products' is enabled"
          );
        }
        if (!value.price) {
          throw new Error(
            "Price is required when 'Add sample products' is enabled"
          );
        }
      }
      return true;
    }),
  ],
  handleErrorMessage,
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager"]),
  ProductsController.store
);

router.patch(
  "/:storeId/payment",
  [
    body().custom((value) => {
      if (!value.qr && !value.bank && !value.cash) {
        throw new Error(
          "At least one payment method (qr, bank, or cash) must be true"
        );
      }
      return true;
    }),

    // If bank === true, require account fields
    body().custom((value) => {
      if (value.bank === true) {
        if (!value.accountHolderName) {
          throw new Error(
            "Account holder name is required when bank is enabled"
          );
        }
        if (!value.accountNumber) {
          throw new Error("Account number is required when bank is enabled");
        }
        if (!value.bankName) {
          throw new Error("Bank name is required when bank is enabled");
        }
      }
      return true;
    }),

    // If qr === true, require QR phone fields
    body().custom((value) => {
      if (value.qr === true) {
        if (!value.countryCode) {
          throw new Error("Country code is required when QR is enabled");
        }
        if (!value.phoneLocal) {
          throw new Error("Phone number is required when QR is enabled");
        }
      }
      return true;
    }),
  ],
  handleErrorMessage,
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager"]),
  StoreController.update
);

router.post(
  "/:storeId/products/:id/upload",
  // [upload.array("photo"), validatePhotoUpload],
  [upload.array("photo"), uploadAdapter.uploadImages],
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager"]),
  ProductsController.upload
);

module.exports = router;
