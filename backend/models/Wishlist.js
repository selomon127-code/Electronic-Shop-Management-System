// backend/models/Wishlist.js
const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        // ✅ Store product details directly (not just reference)
        productId: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        image: {
          type: String,
          default:
            "https://via.placeholder.com/300x300/667eea/ffffff?text=No+Image",
        },
        category: {
          type: String,
          default: "",
        },
        description: {
          type: String,
          default: "",
        },
        stock: {
          type: Number,
          default: 0,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

// Ensure one wishlist per user
wishlistSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);
