const express = require("express");
const CategoriesController = require("../controllers/CategoriesController");
const { body } = require("express-validator");
const handleErrorMessage = require("../middlewares/handleErrorMessage");
const RoleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.get("", CategoriesController.index);

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
  CategoriesController.updateVisibility
);

router.post(
  "",
  [
    body("name").notEmpty(),
  ],
  // RoleMiddleware(["tenant", "superadmin"]),
  handleErrorMessage,
  CategoriesController.store
);

router.get("/:id", CategoriesController.show);

router.delete(
  "/bulk",
  // RoleMiddleware(["admin", "superadmin"]),
  CategoriesController.bulkDestroy
);

router.delete(
  "/:id",
  // RoleMiddleware(["admin", "superadmin"]),
  CategoriesController.destroy
);

router.patch(
  "/",
  [
    body("name").notEmpty(),
    body("categories")
      .isArray({ min: 1 })
      .withMessage("Category must be a non-empty array"),
  ],
  // RoleMiddleware(["admin", "superadmin"]),
  CategoriesController.updateSequence
);

router.patch(
  "/:id",
  // RoleMiddleware(["admin", "superadmin"]),
  CategoriesController.update
);

module.exports = router;
