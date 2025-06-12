const mongoose = require("mongoose");

const schema = mongoose.Schema;

const CategorySchema = new schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    visibility: {
      type: String,
      default: "visible",
      enum: ["visible", "hidden"],
    },
    description: {
      type: String,
    },
    orderIndex: { type: Number, default: 0 },
    products: [
      {
        type: schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", CategorySchema);
