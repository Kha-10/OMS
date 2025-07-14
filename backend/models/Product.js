const mongoose = require("mongoose");

const schema = mongoose.Schema;

// const validationSchema = new schema({
//   type: {
//     type: String,
//     enum: ["not_applicable", "at_most", "at_least", "between"],
//   },
//   atLeastMin: {
//     type: Number,
//     default: undefined,
//   },
//   atLeastMax: {
//     type: Number,
//     default: undefined,
//   },
//   betweenMax: {
//     type: Number,
//     default: undefined,
//   },
//   betweenMin: {
//     type: Number,
//     default: undefined,
//   },
// });
const InventorySchema = new mongoose.Schema(
  {
    quantity: { type: Number, required: true },
  },
  { _id: true }
);

const FlexibleOptionItemSchema = new schema(
  {
    name: String,
    amount: { type: Number, default: 0 },
  },
  { _id: false }
);

const optionSchema = new schema(
  {
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
    // choices: [
    //   {
    //     name: { type: String },
    //     amount: { type: Number },
    //   },
    // ],
    // validation: {
    //   type: validationSchema,
    //   default: () => ({}),
    // },
    settings: {
      min: Number,
      max: Number,
      inputType: String,
      enableQuantity: Boolean,
      choices: [FlexibleOptionItemSchema],
    },
  },
  { _id: false }
);

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
    inventory: InventorySchema,
    dailyCapacity: { type: Boolean, default: false },
    cartMaximumEnabled: { type: Boolean, default: false },
    cartMaximum: { type: Number, default: 0 },
    cartMinimumEnabled: { type: Boolean, default: false },
    cartMinimum: { type: Number, default: 0 },
    sku: { type: String },
  },
  { timestamps: true }
);
// For filter + sort
productSchema.index({ visibility: 1, categories: 1, updatedAt: -1 });
productSchema.index({ visibility: 1, categories: 1, name: 1 });
productSchema.index({ visibility: 1, categories: 1, createdAt: 1 });

// For regex (collation-aware)
productSchema.index({ name: 1 }, { collation: { locale: "en", strength: 2 } });
productSchema.index({ sku: 1 }, { collation: { locale: "en", strength: 2 } });
productSchema.index(
  { "variants.name": 1 },
  { collation: { locale: "en", strength: 2 } }
);

module.exports = mongoose.model("Product", productSchema);
