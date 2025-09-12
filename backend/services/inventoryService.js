const mongoose = require("mongoose");
const Product = require("../models/Product");

const updateInventoryQuantities = async (
  oldItems = [],
  newItems = [],
  session = null
) => {
  const oldMap = new Map(
    oldItems.map((item) => [item.productId.toString(), item.quantity])
  );
  const newMap = new Map(
    newItems.map((item) => [item.productId.toString(), item.quantity])
  );

  const allProductIds = new Set([
    ...oldItems.map((item) => item.productId.toString()),
    ...newItems.map((item) => item.productId.toString()),
  ]);

  const operations = [];

  for (const productIdStr of allProductIds) {
    const productId = new mongoose.Types.ObjectId(productIdStr);
    const oldQty = oldMap.get(productIdStr) || 0;
    const newQty = newMap.get(productIdStr) || 0;
    const diff = newQty - oldQty;

    if (diff !== 0) {
      operations.push({
        updateOne: {
          filter: { _id: productId },
          update: { $inc: { "inventory.quantity": -diff } },
        },
      });
    }
  }

  if (operations.length > 0) {
    await Product.bulkWrite(operations, { ordered: false, session });
  }
};

module.exports = updateInventoryQuantities;
