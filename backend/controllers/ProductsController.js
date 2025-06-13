const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const mongoose = require("mongoose");
const productService = require("../services/productService");
const clearProductCache = require("../helpers/clearProductCache");
const { bulkDestroy } = require("./OrdersController");

const ProductsController = {
  index: async (req, res) => {
    try {
      const queryParams = req.query;
      let { products, totalProducts, allProductsCount, page, limit } =
        await productService.findProducts(queryParams);

      if (!Array.isArray(products)) {
        products = [];
      }
      const enhancedProducts = productService.enhanceProductImages(products);

      const response = {
        data: enhancedProducts,
        pagination: {
          totalProducts,
          allProductsCount,
          totalPages: Math.ceil(totalProducts / limit),
          currentPage: page,
          pageSize: limit,
          hasNextPage: page < Math.ceil(totalProducts / limit),
          hasPreviousPage: page > 1,
        },
      };

      return res.json(response);
    } catch (error) {
      console.error("Error creating Product:", error);
      return res.status(500).json({ msg: "internet server error" });
    }
  },

  store: async (req, res) => {
    try {
      const productData = req.body;
      console.log("productData",productData);

      const existingProduct = await productService.findByName(productData.name);
      if (existingProduct) {
        return res.status(409).json({ msg: "Product already exists" });
      }

      const categoryIds = productService.validateCategoryIds(
        productData.categories
      );

      const product = await productService.createProduct({
        ...productData,
        categories: categoryIds,
      });

      // Update category references
      await Category.updateMany(
        { _id: { $in: categoryIds } },
        { $push: { products: product._id } }
      );

      // Clear cache
      await clearProductCache();

      return res.json(product);
    } catch (error) {
      console.error("Error creating Product:", error);
      return res.status(500).json({ msg: "internet server error" });
    }
  },
  show: async (req, res) => {
    try {
      let id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "Invalid ID" });
      }
      let product = await productService.findProductById(id);
      if (!product) {
        return res.status(404).json({ msg: "Product not found" });
      }

      const formattedProducts = productService.enhanceProductImages(product);

      return res.json(formattedProducts);
    } catch (error) {
      console.error("Error fetching product:", error);
      return res.status(500).json({ msg: "internet server error" });
    }
  },
  destroy: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await productService.deleteProducts([id]);

      if (result.invalidIds.length > 0) {
        return res.status(400).json({ msg: "Invalid product ID" });
      }

      if (result.deletedCount === 0) {
        return res.status(404).json({ msg: "Product not found" });
      }

      return res.json({ msg: "Product deleted successfully" });
    } catch (error) {
      console.error("Error in destroy:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
  bulkDestroy: async (req, res) => {
    try {
      const { ids } = req.body;

      const result = await productService.deleteProducts(ids);

      if (result.invalidIds.length > 0) {
        return res.status(400).json({
          msg: "Some IDs are invalid",
          invalidIds: result.invalidIds,
        });
      }

      if (result.deletedCount === 0) {
        return res.status(404).json({ msg: "No products found" });
      }

      return res.json({
        msg: "Products deleted successfully",
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("Error in bulkDestroy:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
  update: async (req, res) => {
    const id = req.params.id;

    try {
      const newCategoryIds = req.body.categories || [];
      if (!Array.isArray(newCategoryIds)) {
        return res.status(400).json({ msg: "Invalid categories format" });
      }

      // Get existing product with categories
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return res.status(404).json({ msg: "Product not found" });
      }

      await productService.updateCategories(
        existingProduct,
        newCategoryIds,
        id
      );
      const updatedProduct = await productService.updateProduct(id, req.body);
      await clearProductCache();
      return res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      return res.status(500).json({ msg: "internet server error" });
    }
  },
  upload: async (req, res) => {
    try {
      console.log("REQ", req.randomImageNames);
      let id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "Invalid id" });
      }
      let product = await Product.findByIdAndUpdate(id, {
        $push: { photo: req.randomImageNames },
      });

      if (!product) {
        return res.status(404).json({ msg: "Product not found" });
      }
      await clearProductCache();
      return res.json(product);
    } catch (error) {
      return res.status(500).json({ msg: "internet server error" });
    }
  },
  duplicate: async (req, res) => {
    const productId = req.params.id;

    try {
      const duplicatedProduct = await productService.duplicateProduct(
        productId
      );
      await clearProductCache();
      return res.json(duplicatedProduct);
    } catch (error) {
      console.error("Transaction failed:", error);
      return res.status(500).json({ msg: "internet server error" });
    }
  },
};

module.exports = ProductsController;
