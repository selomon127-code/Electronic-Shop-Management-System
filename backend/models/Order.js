// backend/models/Order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        quantity: Number,
        image: String,
      },
    ],
    shippingAddress: {
      fullName: String,
      phone: String,
      city: String,
      subcity: String,
      street: String,
    },
    totalPrice: { type: Number, required: true },
    paymentMethod: { type: String, default: "chapa" },

    // ✅ UPDATED: Added "pending_payment" to the allowed statuses
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "cancelled", "refunded"],
      default: "pending",
    },
    status: {
      type: String,
      index: true,
      enum: [
        "pending_payment",
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending_payment", // ✅ Starts here now
    },

    chapaTxRef: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
