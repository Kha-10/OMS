const mongoose = require("mongoose");

const schema = mongoose.Schema;

const CustomerSchema = new schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
    },
    condoName: {
      type: String,
      required: true,
      trim: true,
    },
    condoUnit: {
      type: String,
      trim: true,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", CustomerSchema);
