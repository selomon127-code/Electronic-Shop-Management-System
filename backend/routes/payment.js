const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const axios = require("axios");

const { sendOrderConfirmation } = require("../utils/sendEmail");

// ✅ CHAPA WEBHOOK
router.post(
  "/chapa/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const event = JSON.parse(req.body.toString());

      if (event.event === "charge.success") {
        const txRef = event.data.tx_ref;
        const amount = event.data.amount;

        const verifyResponse = await axios.get(
          `https://api.chapa.co/v1/transaction/verify/${txRef}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
            },
          },
        );

        if (
          verifyResponse.data.status === "success" &&
          verifyResponse.data.data.status === "success"
        ) {
          const order = await Order.findOne({ chapaTxRef: txRef })
            .populate("user", "name email preferredLanguage")
            .populate("products.product", "name price");

          if (!order)
            return res.status(200).json({ message: "Order not found" });
          if (order.paymentStatus === "paid")
            return res.status(200).json({ message: "Already processed" });

          if (parseFloat(amount) !== order.totalPrice) {
            order.status = "cancelled";
            order.paymentStatus = "failed";
            await order.save();
            return res
              .status(200)
              .json({ message: "Amount mismatch, order cancelled" });
          }

          // Note: Stock is already deducted on order creation in orders.js.
          // If you want to deduct it here instead, uncomment the block below and remove it from orders.js.
          /*
        for (const item of order.products) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
        }
        */

          order.paymentStatus = "paid";
          order.status = "processing";
          await order.save();

          if (order.user?.email) {
            sendOrderConfirmation(
              order.user.email,
              order,
              order.user.preferredLanguage || "en",
            )
              .then(() => console.log("✅ Email sent successfully"))
              .catch((err) => console.error("❌ Email failed:", err));
          }
        }
      }
      res.status(200).json({ message: "Webhook received" });
    } catch (error) {
      console.error("❌ Webhook error:", error.message);
      res.status(200).json({ message: "Error logged" });
    }
  },
);

module.exports = router;
