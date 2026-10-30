// backend/models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "https://picsum.photos/seed/product/300/300",
    },
    stock: {
      type: Number,
      default: 0,
    },
    // ✅ MUST BE INSIDE THE FIRST OBJECT
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }, // ✅ OPTIONS STAY AT THE END
);

module.exports = mongoose.model("Product", productSchema);
