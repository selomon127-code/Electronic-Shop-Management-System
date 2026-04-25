// backend/models/Order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // User reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Products array
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        image: String,
        quantity: { type: Number, default: 1 },
      },
    ],

    // Pricing
    totalPrice: { type: Number, required: true },
    shippingFee: { type: Number, default: 50 },
    tax: { type: Number, default: 0 },

    // ✅ NEW: Delivery Address & Contact
    address: { type: String, required: true }, // JSON string of address object
    phone: { type: String, required: true }, // Ethiopian phone for delivery

    // ✅ NEW: Payment Fields
    paymentMethod: {
      type: String,
      enum: [
        "telebirr",
        "chapa",
        "bank_transfer",
        "cod",
        "card",
        "paypal",
        "cash",
      ],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentReference: String, // Chapa tx_ref or Telebirr transaction_id
    bankName: String, // For bank_transfer: "CBE", "Awash", etc.
    paymentProof: String, // Screenshot filename for bank transfers

    // Order status
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
