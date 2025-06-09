const mongoose = require("mongoose");

const schema = mongoose.Schema;

const validationSchema = new schema({
  type: {
    type: String,
    enum: ["not_applicable", "at_most", "at_least", "between"],
  },
  atLeastMin: {
    type: Number,
    default: undefined,
  },
  atLeastMax: {
    type: Number,
    default: undefined,
  },
  betweenMax: {
    type: Number,
    default: undefined,
  },
  betweenMin: {
    type: Number,
    default: undefined,
  },
});

const optionSchema = new schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["Checkbox", "Selection", "Number", "Text"],
    required: true,
  },
  required: {
    type: Boolean,
    default: false,
  },
  value: {
    type: String,
    default: "",
  },
  choices: [
    {
      name: { type: String },
      amount: { type: Number },
    },
  ],
  validation: {
    type: validationSchema,
    default: () => ({}),
  },
});

const variantSchema = new schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  originalPrice: {
    type: Number,
    default: 0,
  },
});

const productSchema = new schema(
  {
    name: { type: String, required: true },
    visibility: { type: String, default: "visible" },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    type: {
      type: String,
      enum: ["physical", "digital", "service"],
      required: true,
    },
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: 0 },
    description: { type: String },
    photo: {
      type: [String],
    },
    imgUrls: {
      type: [String],
    },
    variants: [variantSchema],
    options: [optionSchema],
    trackQuantityEnabled: { type: Boolean, default: false },
    inventory: {
      type: {
        quantity: { type: Number, default: 0 },
      },
      default: {},
    },
    dailyCapacity: { type: Boolean, default: false },
    dailyCapacityInventory: {
      type: {
        quantity: { type: Number, default: 0 },
      },
      default: {},
    },
    cartMaximumEnabled: { type: Boolean, default: false },
    cartMaximum: { type: Number, default: 0 },
    cartMinimumEnabled: { type: Boolean, default: false },
    cartMinimum: { type: Number, default: 0 },
    sku: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
