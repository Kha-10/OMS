const mongoose = require("mongoose");

const schema = mongoose.Schema;

// const OrderSchema = new schema(
//   {
//     customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
//     items: [
//       {
//         productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
//         quantity: Number,
//         cartMaximum: Number,
//         cartMinimum: Number,
//         inventory: Number,
//         name: String,
//         price: Number,
//         trackQuantityEnabled: Boolean,
//         selectedOptions: [
//           {
//             amount: { type: Number },
//             name: { type: String },
//             selectedOptionName: { type: String },
//           },
//         ],
//         selectedVariant: [
//           {
//             name: { type: String },
//             originalPrice: { type: Number },
//             price: { type: Number },
//           },
//         ],
//         selectedNumberOption: [
//           {
//             name: { type: String },
//             amount: { type: Number },
//           },
//         ],
//         photo: {
//           type: [String],
//         },
//         imgUrls: {
//           type: [String],
//         },
//       },
//     ],
//     remark: {
//       type: String,
//     },
//     servicePrice: {
//       type: Number,
//       default: 0,
//     },
//     adjustment: {
//       type: Number,
//       default: 0,
//     },
//     totalAmount: {
//       type: Number,
//       required: true,
//       min: 0,
//     },
//     status: {
//       type: String,
//       enum: ["Pending", "Completed", "Cancelled", "Confirmed"],
//       default: "Pending",
//     },
//     paymentStatus: {
//       type: String,
//       enum: [
//         "Paid",
//         "Unpaid",
//         "Refunded",
//         "Confirming Payment",
//         "Partially Paid",
//       ],
//       default: "Unpaid",
//     },
//     fulfillmentStatus: {
//       type: String,
//       enum: ["Fulfilled", "Unfulfilled", "Ready", "Out For Delivery"],
//       default: "Unfulfilled",
//     },
//     orderNumber: { type: String, required: true },
//     invoiceNumber: { type: String, required: true },
//     date: {
//       type: Date,
//       default: Date.now,
//     },
//   },
//   { timestamps: true }
// );

const NoteSchema = new mongoose.Schema({
  id: String,
  author: String,
  content: String,
  createdAt: Date,
});

const OptionSchema = new mongoose.Schema({
  name: String,
  answers: [String],
  prices: [Number],
  quantities: [Number],
});

const ItemSchema = new mongoose.Schema({
  id: String,
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: String,
  variantId: { type: String, default: "" },
  basePrice: Number,
  quantity: Number,
  totalPrice: Number,
  productinventory: Number,
  cartMinimum: Number,
  cartMaximum: Number,
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  imgUrls: [String],
  photo: [String],
  options: [OptionSchema],
});

const PricingAdjustmentSchema = new mongoose.Schema({
  id: String,
  name: String,
  type: { type: String, enum: ["fee", "discount", "tax"] },
  isPercentage: Boolean,
  value: Number,
});

const OrderSchema = new mongoose.Schema(
  {
    // customer: {
    //   customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    //   name: String,
    //   email: String,
    //   phone: String,
    // },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    items: [ItemSchema],
    notes: [NoteSchema],
    pricing: {
      subtotal: Number,
      finalTotal: Number,
      adjustments: [PricingAdjustmentSchema],
    },
    orderStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled", "Completed"],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      enum: [
        "Paid",
        "Unpaid",
        "Refunded",
        "Confirming Payment",
        "Partially Paid",
      ],
      default: "Unpaid",
    },
    fulfillmentStatus: {
      type: String,
      enum: ["Fulfilled", "Unfulfilled", "Ready", "Out For Delivery"],
      default: "Unfulfilled",
    },
    orderNumber: { type: String, required: true },
    invoiceNumber: { type: String, required: true },
  },
  { timestamps: true }
);

OrderSchema.index({ createdAt: 1, status: 1, paymentStatus: 1 });

module.exports = mongoose.model("Order", OrderSchema);
