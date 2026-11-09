const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const { releaseCoupon } = require("../utils/couponPricing");
const chapaUtils = require("../utils/chapa");
const { handleVerifiedPaymentTransition } = require("../services/paymentConfirmationService");

/**
 * Verify Chapa Webhook HMAC signature if webhook secret is configured
 */
function verifyWebhookSignature(req) {
  const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // If webhook secret is not configured in environment, proceed with server-side API verification
    return true;
  }

  const signature = req.headers["x-chapa-signature"] || req.headers["chapa-signature"];
  if (!signature) {
    return false;
  }

  try {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body));
    const hmac = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  } catch (err) {
    console.error("❌ Webhook signature verification error:", err.message);
    return false;
  }
}

/**
 * Core handler for Chapa Webhook / Callback events
 */
async function processChapaWebhook(req, res) {
  try {
    // 1. Signature Verification
    if (!verifyWebhookSignature(req)) {
      console.warn("⚠️ [CHAPA-WEBHOOK] Invalid or missing signature header.");
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    // 2. Parse payload safely
    let event;
    try {
      const rawText = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : req.body;
      event = typeof rawText === "string" ? JSON.parse(rawText) : rawText;
    } catch (parseErr) {
      console.error("❌ [CHAPA-WEBHOOK] Failed to parse JSON body:", parseErr.message);
      return res.status(400).json({ message: "Invalid JSON payload" });
    }

    if (!event || event.event !== "charge.success") {
      return res.status(200).json({ message: "Event ignored: not charge.success" });
    }

    const txRef = event.data?.tx_ref;
    const webhookAmount = Number(event.data?.amount);

    if (!txRef) {
      return res.status(200).json({ message: "Missing transaction reference" });
    }

    // 3. Authoritative verification via Chapa API
    const verification = await chapaUtils.verifyPayment(txRef);
    if (!verification.success || verification.status !== "success") {
      console.warn(`⚠️ [CHAPA-WEBHOOK] Unverified transaction: ${txRef}`);
      return res.status(200).json({ message: "Transaction verification unconfirmed" });
    }

    const verifiedAmount = Number(verification.amount);

    // 4. Locate order
    const order = await Order.findOne({
      $or: [{ chapaTxRef: txRef }, { paymentReference: txRef }],
    });

    if (!order) {
      console.warn(`⚠️ [CHAPA-WEBHOOK] Order not found for txRef: ${txRef}`);
      return res.status(200).json({ message: "Order not found" });
    }

    // 5. Idempotency: Prevent duplicate processing if already paid or cancelled
    if (order.paymentStatus === "paid" || order.paymentStatus === "cancelled") {
      console.log(`ℹ️ [CHAPA-WEBHOOK] Order #${order._id} already ${order.paymentStatus}. Duplicate skipped.`);
      return res.status(200).json({ message: "Already processed" });
    }

    // 6. Verify amount matches order total
    const amountToCheck = Number.isFinite(verifiedAmount) ? verifiedAmount : webhookAmount;
    if (Math.round(amountToCheck * 100) !== Math.round(order.totalPrice * 100)) {
      console.error(`❌ [CHAPA-WEBHOOK] Amount mismatch for Order #${order._id}. Expected ${order.totalPrice}, got ${amountToCheck}`);
      order.status = "cancelled";
      order.paymentStatus = "cancelled";
      await order.save();

      // Restore stock
      if (Array.isArray(order.products)) {
        for (const item of order.products) {
          if (item.product) {
            await Product.findByIdAndUpdate(item.product._id || item.product, {
              $inc: { stock: item.quantity },
            });
          }
        }
      }

      // Release coupon if used
      if (order.coupon?.couponId || order.coupon?.code) {
        const coupon = order.coupon.couponId
          ? await Coupon.findById(order.coupon.couponId)
          : await Coupon.findOne({ code: order.coupon.code });
        if (coupon) {
          await releaseCoupon(coupon._id, order.user?._id, order._id);
        }
      }

      return res.status(200).json({ message: "Amount mismatch, order cancelled" });
    }

    // 7. Authoritative transition to PAID and automated post-payment email dispatch
    const transitionResult = await handleVerifiedPaymentTransition(order._id, {
      paymentMethod: "chapa",
      transactionReference: txRef,
      actor: "chapa_webhook",
    });

    console.log(`✅ [CHAPA-WEBHOOK] Order #${order._id} payment successfully processed. Email dispatched: ${transitionResult.emailDispatched}`);
    return res.status(200).json({
      status: "success",
      message: "Payment processed successfully",
      orderId: order._id,
      emailDispatched: transitionResult.emailDispatched,
    });
  } catch (error) {
    console.error("❌ [CHAPA-WEBHOOK] Webhook handling error:", error.message);
    // Never return 500 to Chapa to prevent continuous duplicate delivery loops
    return res.status(200).json({ message: "Error logged safely" });
  }
}

// ✅ CHAPA WEBHOOK (supports both raw buffer or pre-parsed json)
router.post("/chapa/webhook", express.raw({ type: "application/json" }), processChapaWebhook);
// ✅ Alias for /chapa/callback
router.post("/chapa/callback", express.raw({ type: "application/json" }), processChapaWebhook);

module.exports = router;
module.exports.processChapaWebhook = processChapaWebhook;
module.exports.verifyWebhookSignature = verifyWebhookSignature;
