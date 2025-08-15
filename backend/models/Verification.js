const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Verificationchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  code: { type: String, required: true },
  type: { type: String, enum: ["email", "phone"], default: "email" },
  expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model("Verification", Verificationchema);
