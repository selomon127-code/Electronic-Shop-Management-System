const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const auth = require("../middleware/auth");
const axios = require("axios");

const { sendOrderConfirmation } = require("../utils/sendEmail");

const adminAuth = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  res.status(403).json({ message: "Admin access required" });
};

// ✅ 1. CREATE ORDER
router.post("/", auth, async (req, res) => {
  try {
    // Accept both 'products' (frontend update) and 'items' (legacy)
    const { shippingAddress, paymentMethod, products, items } = req.body;
    const orderItems = products || items;
    const userId = req.user ? req.user.id : req.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!orderItems || orderItems.length === 0)
      return res.status(400).json({ message: "Cart is empty" });

    let calculatedTotal = 0;
    const orderProducts = [];

    for (const item of orderItems) {
      const productId = item.product || item._id || item.productId;
      const product = await Product.findById(productId);

      if (!product)
        return res.status(404).json({ message: `Product not found` });
      if (product.stock < item.quantity)
        return res
          .status(400)
          .json({ message: `Not enough stock for ${product.name}` });

      calculatedTotal += product.price * item.quantity;
      orderProducts.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image,
      });

      product.stock -= item.quantity;
      await product.save();
    }

    const isCOD = paymentMethod === "cod";
    const newOrder = new Order({
      user: userId,
      products: orderProducts,
      shippingAddress,
      totalPrice: calculatedTotal,
      paymentMethod: isCOD ? "cod" : "chapa",
      status: isCOD ? "pending" : "pending_payment",
      paymentStatus: "pending",
    });

    const savedOrder = await newOrder.save();

    if (isCOD) {
      const populatedOrder = await Order.findById(savedOrder._id).populate(
        "user",
        "name email preferredLanguage",
      );
      if (populatedOrder?.user) {
        sendOrderConfirmation(
          populatedOrder.user.email,
          populatedOrder,
          populatedOrder.user.preferredLanguage || "en",
        ).catch(console.error);
      }
    }

    if (!isCOD && paymentMethod === "chapa") {
      const txRef = `TXN-${Date.now()}-${userId.slice(-4)}`;
      const chapaResponse = await axios.post(
        "https://api.chapa.co/v1/transaction/initialize",
        {
          amount: calculatedTotal,
          currency: "ETB",
          email: user.email,
          first_name: user.name.split(" ")[0],
          last_name: user.name.split(" ").slice(1).join(" ") || "User",
          tx_ref: txRef,
          callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
          return_url: `${process.env.FRONTEND_URL}/order-confirmation?orderId=${savedOrder._id}`,
          customization: {
            title: "E-Shop Ethiopia",
            description: "Payment for your order",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (chapaResponse.data.status === "success") {
        savedOrder.chapaTxRef = txRef;
        await savedOrder.save();
        return res
          .status(201)
          .json({
            message: "Order created, redirecting to payment...",
            order: savedOrder,
            checkoutUrl: chapaResponse.data.data.checkout_url,
          });
      }
    }

    res
      .status(201)
      .json({
        message: isCOD
          ? "Order placed successfully! Pay on delivery."
          : "Order created",
        order: savedOrder,
      });
  } catch (error) {
    console.error("❌ Create Order Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ 2. GET USER ORDERS
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.userId;
    const orders = await Order.find({ user: userId })
      .populate("products.product", "name image price category")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ 3. CANCEL ORDER & RESTORE STOCK
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.userId;
    const order = await Order.findById(req.params.id).populate(
      "products.product",
    );

    if (!order || order.user.toString() !== userId)
      return res.status(403).json({ message: "Unauthorized" });
    if (order.status !== "pending" && order.status !== "pending_payment")
      return res
        .status(400)
        .json({ message: `Cannot cancel order. Status: ${order.status}` });

    for (const item of order.products) {
      if (item.product)
        await Product.findByIdAndUpdate(item.product._id, {
          $inc: { stock: item.quantity },
        });
    }

    order.status = "cancelled";
    order.paymentStatus = "cancelled";
    await order.save();

    res.json({
      message: "Order cancelled successfully and stock restored",
      order,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
