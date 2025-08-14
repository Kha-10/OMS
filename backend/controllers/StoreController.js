const Store = require("../models/Store");
const User = require("../models/User");
const mongoose = require("mongoose");

const StoreController = {
  store: async (req, res) => {
    try {
      const storeData = req.body;
      const userId = req.user._id;
      console.log("storetData", storeData);
      console.log("user", req.user);
      const existingStore = await Store.findOne({ phone: storeData.phone });

      if (existingStore) {
        return res.status(409).json({ msg: "Store already exists" });
      }

      const store = await Store.create(storeData);

      await User.findByIdAndUpdate(userId, { onboarding_step: 4 });

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
};

module.exports = StoreController;
