const Store = require("../models/Store");
const User = require("../models/User");
const StoreMember = require("../models/StoreMember");
const storeService = require("../services/storeService");
const mongoose = require("mongoose");

const StoreController = {
  index: async (req, res) => {
    try {
      const userId = req.user?._id;
      const stores = await storeService.getStoreByUserId(userId);
      return res.json(stores);
    } catch (err) {
      if (err.message === "Invalid store ID") {
        return res.status(400).json({ msg: err.message });
      }
      if (err.message === "Store not found") {
        return res.status(404).json({ msg: err.message });
      }
      console.error(err);
      res.status(500).json({ msg: "Internal server error" });
    }
  },
  store: async (req, res) => {
    try {
      const storeData = req.body;
      const ownerUserId = req.user._id;

      const existingStore = await Store.findOne({ phone: storeData.phone });

      if (existingStore) {
        return res.status(409).json({ msg: "Store already exists" });
      }

      const store = await Store.create(storeData);
      console.log("store", store);

      await StoreMember.create({
        store: store._id,
        user: ownerUserId,
        role: "owner",
        joinedAt: new Date(),
        isActive: true,
      });

      await User.findByIdAndUpdate(ownerUserId, { onboarding_step: 4 });

      return res.json(store);
    } catch (error) {
      console.error("Error creating Store:", error);
      return res.status(500).json({ msg: "internet server error" });
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

      const store = await Store.findByIdAndUpdate(id, update, {
        new: true,
      });

      console.log("store", store);
      if (!store) {
        return res.status(404).json({ msg: "Store not found" });
      }

      return res.json(store);
    } catch (error) {
      return res.status(500).json({ msg: "internet server error" });
    }
  },
  update: async (req, res) => {
    try {
      const storeId = req.storeId;
      const userId = req.userId;
      const storeData = req.body;

      const store = await storeService.updatePaymentSettings(
        storeId,
        userId,
        storeData
      );

      return res.json(store);
    } catch (err) {
      if (err.message === "Invalid store ID") {
        return res.status(400).json({ msg: err.message });
      }
      if (err.message === "Store not found") {
        return res.status(404).json({ msg: err.message });
      }
      console.error(err);
      res.status(500).json({ msg: "Internal server error" });
    }
  },
  show: async (req, res) => {
    try {
      const storeSlug = req.params.storeSlug;
      const store = await Store.findOne({ slug: storeSlug });
      if (!store)
        return res.status(404).json({ message: "store doesn't exist" });
      return res.json(store);
    } catch (err) {
      console.error("Error getting Product:", err);

      const status = err.statusCode || 500;
      const message = err.message || "Internal server error";

      return res.status(status).json({ msg: message });
    }
  },
};

module.exports = StoreController;
