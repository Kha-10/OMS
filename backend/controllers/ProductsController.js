const Product = require("../models/Product");
const mongoose = require("mongoose");
const productService = require("../services/productService");
const clearProductCache = require("../helpers/clearProductCache");
const clearCartCache = require("../helpers/clearCartCache");
const clearCache = require("../helpers/clearCache");
const clearOrderCache = require("../helpers/clearOrderCache");

const ProductsController = {
  index: async (req, res) => {
    try {
      const storeId = req.params.storeId || req.storeId;
      const queryParams = req.query;
      let { products, totalProducts, allProductsCount, page, limit } =
        await productService.findProducts(storeId, queryParams);

      if (!Array.isArray(products)) products = [];

      const enhancedProducts = productService.enhanceProductImages(products);
      return res.json({
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
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
  store: async (req, res) => {
    try {
      const storeId = req.storeId;
      const userId = req.userId;
      const product = await productService.createProduct(
        storeId,
        userId,
        req.body
      );

      await clearCache(storeId, "products");
      // await clearProductCache(storeId);
      await clearCache(storeId, "categories");
      return res.json(product);
    } catch (err) {
      console.error("Error storing Product:", err);

      const status = err.statusCode || 500;
      const message = err.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  show: async (req, res) => {
    try {
      const storeId = req.params.storeId || req.storeId;
      let id = req.params.id;
      let product = await productService.findProductById(storeId, id);

      const formattedProducts = productService.enhanceProductImages(product);

      return res.json(formattedProducts);
    } catch (err) {
      console.error("Error getting Product:", err);

      const status = err.statusCode || 500;
      const message = err.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  bulkDestroy: async (req, res) => {
    try {
      const { ids } = req.body;
      const storeId = req.params.storeId;
      console.log("ids", ids);
      console.log("storeId", storeId);
      const result = await productService.deleteProducts(storeId, ids);

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
    const storeId = req.params.storeId;
    const productId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ msg: "Invalid product ID" });
    }

    const newCategoryIds = req.body.categories || [];
    if (!Array.isArray(newCategoryIds)) {
      return res.status(400).json({ msg: "Invalid categories format" });
    }

    try {
      const updatedProduct = await productService.updateProductWithCategories(
        storeId,
        productId,
        req.body,
        newCategoryIds
      );

      // clear caches
      await clearCache(storeId, "products");
      // await clearProductCache(storeId)
      await clearCache(storeId, "categories");
      await clearCartCache("cart:*");
      await clearOrderCache();

      return res.json(updatedProduct);
    } catch (err) {
      console.error("Error Updating Product:", err);

      const status = err.statusCode || 500;
      const message = err.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  updateVisibility: async (req, res) => {
    try {
      const { ids, visibility } = req.body;
      const storeId = req.params.storeId;

      const result = await productService.updateVisibility(
        storeId,
        ids,
        visibility
      );

      return res.json({
        modifiedCount: result.modifiedCount,
        message: "Product visibility updated successfully",
      });
    } catch (error) {
      console.error("Error updating product visibility:", error);

      const status = error.statusCode || 500;
      const message = error.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
  upload: async (req, res) => {
    try {
      console.log("REQ", req.randomImageNames);
      let id = req.params.id;
      console.log("req.params.id", req.params.id);
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "Invalid id" });
      }
      const isCloudinary = process.env.UPLOAD_PROVIDER === "cloudinary";

      // Build update object depending on provider
      let update = {};
      if (isCloudinary) {
        update = {
          $push: {
            photo: req.randomImageNames.map((img) => img.public_id),
            // imgUrls: req.randomImageNames.map((img) => img.url),
          },
        };
      } else {
        update = {
          $push: {
            photo: req.randomImageNames,
          },
        };
      }

      const product = await Product.findByIdAndUpdate(id, update, {
        new: true,
      });

      console.log("product", product);
      if (!product) {
        return res.status(404).json({ msg: "Product not found" });
      }
      await clearProductCache(storeId);
      return res.json(product);
    } catch (error) {
      return res.status(500).json({ msg: "internet server error" });
    }
  },
  duplicate: async (req, res) => {
    const { ids } = req.body;
    const storeId = req.params.storeId;
    console.log("duplicate", ids);
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ msg: "ids must be an array" });
    }

    try {
      const duplicatedResult = await productService.duplicateProducts(
        ids,
        storeId
      );
      return res.json(duplicatedResult);
    } catch (error) {
      console.error("Transaction failed:", error);
      return res.status(500).json({ msg: "Internal server error" });
    }
  },
};

module.exports = ProductsController;
