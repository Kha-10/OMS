const Category = require("../models/Category");
const mongoose = require("mongoose");
const categoryService = require("../services/categoryService");
const handler = require("../helpers/handler");
const clearCache = require("../helpers/clearCache");
const clearProductCache = require("../helpers/clearProductCache");

const CategoriesController = {
  index: async (req, res) => {
    try {
      const storeId = req.params.storeId || req.storeId;
      const queryParams = req.query;
      
      req.logger.info("Fetching categories");

      let { categories, totalCategories, page, limit } =
        await categoryService.findCategories(storeId, queryParams);

      if (!Array.isArray(categories)) categories = [];

      const response = {
        data: categories,
        pagination: {
          totalCategories,
          totalPages: Math.ceil(totalCategories / limit),
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < Math.ceil(totalCategories / limit),
          hasPreviousPage: page > 1,
        },
      };
      
      return res.json(response);
    } catch (error) {
      req.logger.error("Error fetching categories", {
        message: error.message,
        stack: error.stack,
        storeId: req.params.storeId || req.storeId,
        queryParams: req.query,
      });
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
  store: async (req, res) => {
    try {
      const storeId = req.storeId;
      const userId = req.userId;

      const { name, visibility, description, products } = req.body;

      req.logger.info("Creating new category", {
        name,
        visibility,
        description,
        products,
      });
      const category = await categoryService.createCategory({
        storeId,
        userId,
        name,
        visibility,
        description,
        products,
      });

      await clearCache(storeId, "categories");
      await clearCache(storeId, "products");
      return res.json(category);
    } catch (err) {
      req.logger.error("Error fetching categories", {
        message: err.message,
        stack: err.stack,
        storeId: req.storeId,
        userId: req.userId,
      });

      const status = err.statusCode || 500;
      const message = err.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  show: async (req, res) => {
    try {
      const storeId = req.params.storeId || req.storeId;
      let id = req.params.id;

      req.logger.info("Getting category", {
        id,
      });

      let category = await categoryService.findCategoryById(storeId, id);

      return res.json(category);
    } catch (err) {
      req.logger.error("Error getting Category", {
        message: err.message,
        stack: err.stack,
        storeId: req.params.storeId || req.storeId,
        id: req.params.id,
      });

      const status = err.statusCode || 500;
      const message = err.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  destroy: async (req, res) => {
    try {
      const { id } = req.params;

      req.logger.info("Deleting category", {
        id,
      });

      const result = await categoryService.deleteCategories([id]);

      if (result.invalidIds.length > 0) {
        return res.status(400).json({ msg: "Invalid category ID" });
      }

      if (result.deletedCount === 0) {
        return res.status(404).json({ msg: "Category not found" });
      }

      req.logger.info("Category deleted successfully", {
        id,
      });

      return res.json({ msg: "Category deleted successfully" });
    } catch (error) {
      req.logger.error("Error destroying Category", {
        message: error.message,
        stack: error.stack,
        id: req.params.id,
      });
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
  bulkDestroy: async (req, res) => {
    try {
      const { ids } = req.body;
      const storeId = req.params.storeId;

      req.logger.info("Deleting categories", {
        ids,
      });

      const result = await categoryService.deleteCategories(storeId, ids);

      if (result.invalidIds.length > 0) {
        req.logger.warn("Some category IDs are invalid", {
          storeId,
          invalidIds: result.invalidIds,
        });
        return res.status(400).json({
          msg: "Some IDs are invalid",
          invalidIds: result.invalidIds,
        });
      }

      if (result.deletedCount === 0) {
        req.logger.warn("No categories found to delete", { storeId, ids });
        return res.status(404).json({ msg: "No categories found" });
      }

      req.logger.info("Categories deleted successfully", {
        storeId,
        deletedCount: result.deletedCount,
      });

      return res.json({
        msg: "Categories deleted successfully",
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      req.logger.error("Error in bulkDestroy", {
        message: error.message,
        stack: error.stack,
        storeId: req.params.storeId,
        ids: req.body.ids,
      });
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
  updateCategory: async (req, res) => {
    try {
      const storeId = req.params.storeId;
      const categoryId = req.params.id;
      if (!categoryId) {
        req.logger.warn("Invalid category ID", {
          storeId,
          categoryId,
        });
        return res.status(400).json({ msg: "Invalid category ID" });
      }

      let newProductIds = req.body.products || [];
      if (!Array.isArray(newProductIds)) {
        req.logger.warn("Invalid product IDs", {
          storeId,
          newProductIds,
        });
        return res.status(400).json({ msg: "Invalid product IDs" });
      }

      newProductIds = newProductIds.map((p) => p._id || p);

      req.logger.info("Categories updating ", {
        storeId,
        categoryId,
        newProductIds,
      });

      const updatedCategory = await categoryService.updateCategoryProducts(
        storeId,
        categoryId,
        newProductIds
      );

      req.logger.info("Categories updated successfully", {
        storeId,
        categoryId,
        updatedCategory,
      });
      return res.json(updatedCategory);
    } catch (error) {
      req.logger.error("Error updating category", {
        message: error.message,
        stack: error.stack,
        storeId: req.params.storeId,
        categoryId: req.params.id,
      });
      const status = error.statusCode || 500;
      const message = error.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  updateVisibility: async (req, res) => {
    try {
      const { ids, visibility } = req.body;
      const storeId = req.params.storeId;

      req.logger.info("updating categories visibility", {
        storeId,
        ids,
        visibility,
      });

      const result = await categoryService.updateVisibility(
        storeId,
        ids,
        visibility
      );

      req.logger.info("Categories visibility updated successfully", {
        storeId,
        ids,
        visibility,
      });

      return res.json({
        modifiedCount: result.modifiedCount,
        message: "Cateogry visibility updated successfully",
      });
    } catch (error) {
      req.logger.error("Error updating category visibility", {
        message: error.message,
        stack: error.stack,
        storeId: req.params.storeId,
        ids: req.body.ids,
        visibility: req.body.visibility,
      });
      const status = error.statusCode || 500;
      const message = error.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  updateSequence: async (req, res) => {
    try {
      const storeId = req.params.storeId;
      const categories = req.body.categories;

      req.logger.info("Categories Sequence updating", {
        storeId,
        categories,
      });
      const result = await categoryService.updateCategorySequence(
        storeId,
        categories
      );

      req.logger.info("Categories Sequence updated successfully", {
        storeId,
        categories,
      });
      return res.json(result);
    } catch (error) {
      req.logger.error("Error updating category Sequence", {
        message: error.message,
        stack: error.stack,
        storeId: req.params.storeId,
        categories: req.body.categories,
      });
      const status = error.statusCode || 500;
      const message = error.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
};

module.exports = CategoriesController;
