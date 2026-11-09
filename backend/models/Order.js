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
        costPrice: { type: Number, default: null },
        originalPrice: Number,
        discountPercent: Number,
        quantity: Number,
        image: String,
      },
    ],
    subtotal: { type: Number, required: true, default: 0 },
    shippingFee: { type: Number, required: true, default: 0 },
    coupon: {
      couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
        default: null,
      },
      code: { type: String, default: null },
      discount: { type: Number, default: 0 },
    },
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
    paymentReference: { type: String },
    paidAt: { type: Date },
    paymentReceiptSent: { type: Boolean, default: false },
    paymentReceiptSentAt: { type: Date },
    tax: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
