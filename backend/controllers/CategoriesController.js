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
      console.error("Error fetching categories:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
  store: async (req, res) => {
    try {
      const storeId = req.storeId;
      const userId = req.userId;

      const { name, visibility, description, products } = req.body;

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
      console.error("Error storing Category:", err);

      const status = err.statusCode || 500;
      const message = err.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  show: async (req, res) => {
    try {
      const storeId = req.params.storeId;
      let id = req.params.id;
      let category = await categoryService.findCategoryById(storeId, id);

      return res.json(category);
    } catch (err) {
      console.error("Error getting Category:", err);

      const status = err.statusCode || 500;
      const message = err.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  destroy: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await categoryService.deleteCategories([id]);

      if (result.invalidIds.length > 0) {
        return res.status(400).json({ msg: "Invalid category ID" });
      }

      if (result.deletedCount === 0) {
        return res.status(404).json({ msg: "Category not found" });
      }

      return res.json({ msg: "Category deleted successfully" });
    } catch (error) {
      console.error("Error in destroy:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
  bulkDestroy: async (req, res) => {
    try {
      const { ids } = req.body;
      const storeId = req.params.storeId;
      console.log("bulkDestroy", ids);
      const result = await categoryService.deleteCategories(storeId, ids);

      if (result.invalidIds.length > 0) {
        return res.status(400).json({
          msg: "Some IDs are invalid",
          invalidIds: result.invalidIds,
        });
      }

      if (result.deletedCount === 0) {
        return res.status(404).json({ msg: "No categories found" });
      }

      return res.json({
        msg: "Categories deleted successfully",
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("Error in bulkDestroy:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
  updateCategory: async (req, res) => {
    try {
      const storeId = req.params.storeId;
      const categoryId = req.params.id;
      if (!categoryId)
        return res.status(400).json({ msg: "Invalid category ID" });

      let newProductIds = req.body.products || [];
      if (!Array.isArray(newProductIds)) {
        return res.status(400).json({ msg: "Invalid product IDs" });
      }

      newProductIds = newProductIds.map((p) => p._id || p);

      const updatedCategory = await categoryService.updateCategoryProducts(
        storeId,
        categoryId,
        newProductIds
      );

      return res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating category visibility:", error);

      const status = error.statusCode || 500;
      const message = error.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  updateVisibility: async (req, res) => {
    try {
      const { ids, visibility } = req.body;
      const storeId = req.params.storeId;

      const result = await categoryService.updateVisibility(
        storeId,
        ids,
        visibility
      );

      return res.json({
        modifiedCount: result.modifiedCount,
        message: "Cateogry visibility updated successfully",
      });
    } catch (error) {
      console.error("Error updating category visibility:", error);

      const status = error.statusCode || 500;
      const message = error.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  updateSequence: async (req, res) => {
    try {
      const storeId = req.params.storeId;
      const categories = req.body.categories;

      const result = await categoryService.updateCategorySequence(
        storeId,
        categories
      );

      return res.json(result);
    } catch (error) {
      console.error("Error updating Category:", error);

      const status = error.statusCode || 500;
      const message = error.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
};

module.exports = CategoriesController;
