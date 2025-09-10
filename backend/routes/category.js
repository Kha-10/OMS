const express = require("express");
const CategoriesController = require("../controllers/CategoriesController");
const { body } = require("express-validator");
const handleErrorMessage = require("../middlewares/handleErrorMessage");
const checkMemberMiddleware = require("../middlewares/checkMemberMiddleware");
const RoleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router({ mergeParams: true });

router.get("/", CategoriesController.index);

router.post(
  "/visibility",
  [
    body("ids")
      .isArray({ min: 1 })
      .withMessage("Category IDs must be a non-empty array"),
    body("visibility").notEmpty(),
  ],
  handleErrorMessage,
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager"]),
  CategoriesController.updateVisibility
);

router.post(
  "",
  [body("name").notEmpty()],
  handleErrorMessage,
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager"]),
  CategoriesController.store
);

router.get("/:id", CategoriesController.show);

router.post(
  "/bulk",
  [
    body("ids")
      .isArray({ min: 1 })
      .withMessage("Category IDs must be a non-empty array"),
  ],
  handleErrorMessage,
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager"]),
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
    body("categories")
      .isArray({ min: 1 })
      .withMessage("Category must be a non-empty array"),
  ],
  handleErrorMessage,
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager"]),
  CategoriesController.updateSequence
);

router.patch(
  "/:id",
  checkMemberMiddleware,
  RoleMiddleware(["owner", "manager"]),
  CategoriesController.updateCategory
);

module.exports = router;
