// backend/models/Review.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number from 1 to 5",
      },
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    images: {
      type: [
        {
          _id: false,
          url: { type: String, required: true },
          publicId: { type: String, required: true },
        },
      ],
      default: [],
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Review", reviewSchema);
