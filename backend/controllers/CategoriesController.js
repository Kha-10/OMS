const Category = require("../models/Category");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const categoryService = require("../services/categoryService");
const handler = require("../helpers/handler");
const clearProductCache = require("../helpers/clearProductCache");

const CategoriesController = {
  index: async (req, res) => {
    try {
      const queryParams = req.query;
      let { categories, totalCategories, page, limit } =
        await categoryService.findCategories(queryParams);

      if (!Array.isArray(categories)) {
        categories = [];
      }
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

      return res.json(response)
    } catch (error) {
      return handler.handleError(res, error);
    }
  },
  store: async (req, res) => {
    const { name, visibility, description, products } = req.body;

    try {
      const existingCategory = await Category.findOne({ name });

      if (existingCategory) {
        return handler.handleError(res, {
          status: 409,
          message: "Category name already exists",
        });
      }

      const lastCategory = await Category.findOne().sort({ orderIndex: -1 });

      const newOrderIndex = lastCategory ? lastCategory.orderIndex + 1 : 0;

      const extractedProductIds = products?.map((product) => product._id);
      const category = await Category.create({
        name,
        visibility,
        orderIndex: newOrderIndex,
        description,
        products: extractedProductIds?.length > 0 ? extractedProductIds : [],
      });

      // Update category references
      await Product.updateMany(
        { _id: { $in: extractedProductIds } },
        { $push: { categories: category._id } }
      );

      await clearProductCache();

      return res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      return handler.handleError(res, {
        status: 500,
        message: "Internet Server error",
      });
    }
  },
  show: async (req, res) => {
    try {
      let id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return handler.handleResponse(res, {
          status: 400,
          message: "Invalid id",
        });
      }
      let category = await Category.findById(id).populate("products");
      if (!category) {
        return handler.handleResponse(res, {
          status: 404,
          message: "category not found",
        });
      }
      return res.json(category);
    } catch (error) {
      return handler.handleError(res, {
        status: 500,
        message: "Internet Server Error",
      });
    }
  },
  destroy: async (req, res) => {
    try {
      let id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "Invalid id" });
      }
      let category = await Category.findByIdAndDelete(id);
      if (!category) {
        return handler.handleError(res, {
          status: 404,
          message: "category not found",
        });
      }

      await Product.updateMany(
        { categories: id },
        { $pull: { categories: id } }
      );

      await clearProductCache();
      // await redisClient.del("products:*");

      return res.json(category);
    } catch (error) {
      return handler.handleError(res, {
        status: 500,
        message: "Internrt Server Error",
      });
    }
  },
  update: async (req, res) => {
    try {
      let id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return handler.handleError(res, {
          status: 404,
          message: "Invalid id",
        });
      }

      let newProductIds = req.body.products || [];
      if (!Array.isArray(newProductIds)) {
        return handler.handleError(res, {
          status: 400,
          message: "Invalid products format",
        });
      }

      newProductIds = newProductIds.map((p) => p._id);

      // Get existing product with categories
      const existingCategory = await Category.findById(id);
      if (!existingCategory) {
        return handler.handleError(res, {
          status: 404,
          message: "Category not found",
        });
      }

      await categoryService.updateProducts(existingCategory, newProductIds, id);

      let category = await Category.findByIdAndUpdate(id, {
        ...req.body,
      });
      if (!category) {
        return handler.handleError(res, {
          status: 404,
          message: "category not found",
        });
      }

      await clearProductCache();
      // await redisClient.del("products:*");

      return res.json(category);
    } catch (error) {
      return handler.handleError(res, {
        status: 500,
        message: "Internet Server Error",
      });
    }
  },
  updateSequence: async (req, res) => {
    try {
      const categories = req.body;
      const validCategories = categories.filter((c) => c._id);

      const category = await Promise.all(
        validCategories.map((c, index) =>
          Category.findByIdAndUpdate(
            c._id,
            { orderIndex: index },
            { new: true }
          )
        )
      );

      if (!category) {
        return handler.handleError(res, {
          status: 404,
          message: "category not found",
        });
      }

      await clearProductCache();

      return res.json(category);
    } catch (error) {
      return handler.handleError(res, {
        status: 500,
        message: "Internet Server Error",
      });
    }
  },
};

module.exports = CategoriesController;
