const mongoose = require("mongoose");

const schema = mongoose.Schema;

const CustomerSchema = new schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      // required: true,
    },
    email: {
      type: String,
      // required: true,
      // unique: true,
    },
    deliveryAddress: {
      type: {
        street: { type: String },
        apartment: { type: String, required: true },
        city: { type: String },
        zipCode: { type: String },
      },
      required: true,
    },
    totalSpent: {
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
  },
  { timestamps: true }
);
CustomerSchema.index({ storeId: 1, phone: 1 }, { unique: true });
CustomerSchema.index({ storeId: 1, name: 1 });
module.exports = mongoose.model("Customer", CustomerSchema);
