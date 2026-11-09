// backend/controllers/paymentController.js
const Order = require("../models/Order");
const {
  initializePayment: chapaInit,
  verifyPayment: chapaVerify,
} = require("../utils/chapa");

let telebirrInit = async () => ({ success: false, message: "Telebirr integration not configured" });
let telebirrVerify = async () => ({ success: false, message: "Telebirr integration not configured" });
try {
  const telebirr = require("../utils/telebirr");
  telebirrInit = telebirr.initializePayment;
  telebirrVerify = telebirr.verifyPayment;
} catch (e) {
  // Telebirr is optional
}

const { sendOrderConfirmation } = require("../utils/sendEmail");
const { handleVerifiedPaymentTransition } = require("../services/paymentConfirmationService");

/**
 * Create order with payment method
 */
exports.createOrderWithPayment = async (req, res) => {
  try {
    const {
      products,
      totalPrice,
      address,
      phone,
      paymentMethod,
      bankName,
      paymentProof,
    } = req.body;
    const userId = req.userId; // From auth middleware

    if (
      !products?.length ||
      !totalPrice ||
      !address ||
      !phone ||
      !paymentMethod
    ) {
      return res.status(400).json({ message: "Missing required order fields" });
    }

    // Create order with payment info
    const order = new Order({
      user: userId,
      products,
      totalPrice,
      address,
      phone,
      paymentMethod,
      bankName: paymentMethod === "bank_transfer" ? bankName : undefined,
      paymentProof:
        paymentMethod === "bank_transfer" ? paymentProof : undefined,
      paymentStatus: paymentMethod === "cod" ? "paid" : "pending", // COD is paid on delivery
    });

    await order.save();
    console.log("✅ Order created:", order._id);

    // Handle payment method
    let paymentResult = { success: true };

    if (paymentMethod === "chapa") {
      const user = await require("../models/User").findById(userId);
      paymentResult = await chapaInit({
        orderId: order._id.toString(),
        totalPrice,
        customerEmail: user?.email,
        customerName: user?.name,
        customerPhone: phone,
        orderTitle: `Order #${order._id.toString().slice(-6)}`,
        orderDescription: `${products.length} item(s) from E-Shop`,
      });

      if (paymentResult.success) {
        order.paymentReference = paymentResult.txRef;
        order.chapaTxRef = paymentResult.txRef;
        await order.save();
      }
    }

    if (paymentMethod === "telebirr") {
      const user = await require("../models/User").findById(userId);
      paymentResult = await telebirrInit({
        orderId: order._id.toString(),
        totalPrice,
        customerEmail: user?.email,
        customerName: user?.name,
        customerPhone: phone,
        orderTitle: `Order #${order._id.toString().slice(-6)}`,
        orderDescription: `${products.length} item(s) from E-Shop`,
      });

      if (paymentResult.success) {
        order.paymentReference = paymentResult.txRef;
        await order.save();
      }
    }

    // Populate order for response
    const populatedOrder = await Order.findById(order._id)
      .populate("products.product", "name price image")
      .populate("user", "name email");

    // Send confirmation email (async)
    if (populatedOrder.user?.email) {
      sendOrderConfirmation(populatedOrder.user.email, populatedOrder).catch(
        (err) => console.error("❌ Email error:", err.message),
      );
    }

    res.status(201).json({
      message:
        paymentMethod === "cod"
          ? "Order placed successfully"
          : "Payment initiated",
      order: populatedOrder,
      payment: paymentMethod === "cod" ? null : paymentResult,
    });
  } catch (err) {
    console.error("❌ Create order error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Chapa webhook callback
 */
exports.chapaCallback = async (req, res) => {
  try {
    const { tx_ref, status } = req.body;

    console.log("🔔 Chapa webhook received:", { tx_ref, status });

    // Verify payment with Chapa
    const verification = await chapaVerify(tx_ref);

    if (verification.success && verification.status === "success") {
      // Locate order and transition atomically
      const order = await Order.findOne({
        $or: [{ paymentReference: tx_ref }, { chapaTxRef: tx_ref }],
      });
      if (order) {
        await handleVerifiedPaymentTransition(order._id, {
          paymentMethod: "chapa",
          transactionReference: tx_ref,
          actor: "chapa_callback",
        });
      }
    }

    res.json({ status: "success" }); // Chapa expects this response
  } catch (err) {
    console.error("❌ Chapa callback error:", err);
    res.status(500).json({ status: "error" });
  }
};

/**
 * Telebirr webhook callback
 */
exports.telebirrCallback = async (req, res) => {
  try {
    const { merchantOrderNo, orderStatus } = req.body;

    console.log("🔔 Telebirr webhook received:", {
      merchantOrderNo,
      orderStatus,
    });

    if (orderStatus === "1") {
      // "1" = success in Telebirr
      const order = await Order.findOne({ paymentReference: merchantOrderNo });
      if (order) {
        await handleVerifiedPaymentTransition(order._id, {
          paymentMethod: "telebirr",
          transactionReference: merchantOrderNo,
          actor: "telebirr_callback",
        });
      }
    }

    res.json({ respCode: "0000" }); // Telebirr expects this response
  } catch (err) {
    console.error("❌ Telebirr callback error:", err);
    res.status(500).json({ respCode: "9999", respMsg: "Error" });
  }
};

/**
 * Check payment status (for frontend polling)
 */
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // For pending payments, verify with gateway
    const txRef = order.paymentReference || order.chapaTxRef;
    if (order.paymentStatus === "pending" && txRef) {
      let verification;

      if (order.paymentMethod === "chapa") {
        verification = await chapaVerify(txRef);
      } else if (order.paymentMethod === "telebirr") {
        verification = await telebirrVerify(txRef);
      }

      if (
        verification?.success &&
        (verification.status === "success" || verification.status === "1")
      ) {
        await handleVerifiedPaymentTransition(order._id, {
          paymentMethod: order.paymentMethod,
          transactionReference: txRef,
          actor: "check_payment_status",
        });
        const updated = await Order.findById(order._id);
        if (updated) {
          order.paymentStatus = updated.paymentStatus;
          order.status = updated.status;
        }
      }
    }

    res.json({
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      status: order.status,
    });
  } catch (err) {
    console.error("❌ Check payment status error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
