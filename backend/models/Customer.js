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
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
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
  },
  { timestamps: true }
);
CustomerSchema.index({ name: 1 });
module.exports = mongoose.model("Customer", CustomerSchema);
