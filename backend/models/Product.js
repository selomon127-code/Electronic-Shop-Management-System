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
    costPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    brand: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    tags: {
      type: [{ type: String, trim: true, maxlength: 40 }],
      default: [],
      validate: {
        validator: (tags) => tags.length <= 20,
        message: "A product can have up to 20 search tags.",
      },
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      validate: {
        validator: Number.isInteger,
        message: "Discount must be a whole percentage",
      },
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
