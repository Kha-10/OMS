const mongoose = require("mongoose");

const schema = mongoose.Schema;

const StoreSchema = new schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: String,
    logo: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    membershipType: {
      type: String,
      enum: ["free", "premium", "enterprise"],
      default: "free",
    },
    membershipExpiresAt: {
      type: Date,
      default: null,
    },
    settings: {
      currency: { type: String, default: "USD" },
      timezone: { type: String, default: "UTC" },
      language: { type: String, default: "en" },
      payments: {
        cash: { type: Boolean, default: true },
        bank: {
          enabled: { type: Boolean, default: false },
          bankName: { type: String, default: "" },
          accountNumber: { type: String, default: "" },
          accountHolderName: { type: String, default: "" },
        },
        promptPay: {
          enabled: { type: Boolean, default: false },
          countryCode: { type: String, default: "+66" },
          phoneNumber: { type: String, default: "" },
        },
      },
      shipping: {
        freeShipping: { type: Boolean, default: false },
        defaultDeliveryDays: { type: Number, default: 3 },
      },
      theme: {
        color: { type: String, default: "#1D4ED8" },
        font: { type: String, default: "Roboto" },
      },
      notifications: {
        orderEmail: { type: Boolean, default: true },
        stockSMS: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Store", StoreSchema);
