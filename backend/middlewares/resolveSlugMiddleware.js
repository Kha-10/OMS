const Store = require("../models/Store"); // Your store model

const resolveStoreSlug = async (req, res, next) => {
  try {
    const { storeSlug } = req.params;
    // Find store by slug in database
    const store = await Store.findOne({
      slug: storeSlug,
    });

    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }

    req.storeId = store._id;
    next();
  } catch (error) {
    console.error("Error resolving store slug:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = resolveStoreSlug;
