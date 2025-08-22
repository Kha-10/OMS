const mongoose = require("mongoose");

// Counter Schema to handle sequential IDs
const counterSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  }, // The name/identifier of the counter (e.g., 'orderNumber', 'invoiceNumber')
  seq: {
    type: Number,
    default: 0,
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    index: true,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Counter = mongoose.model("Counter", counterSchema);

module.exports = Counter;
