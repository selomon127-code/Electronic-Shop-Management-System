// backend/routes/orders.js
const router = require("express").Router();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const {
  sendOrderConfirmation,
  sendStatusUpdateEmail,
} = require("../utils/sendEmail");

const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    const user = await User.findById(req.userId).select("role email name");
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Simple user routes
// ✅ MUST EXIST: Admin stats endpoint
router.get("/admin/stats", adminAuth, async (req, res) => {
  try {
    const allOrders = await Order.find().populate("user", "name email");
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce(
      (sum, o) => sum + (o.totalPrice || 0),
      0,
    );
    const pendingOrders = allOrders.filter(
      (o) => o.status === "pending",
    ).length;
    const completedOrders = allOrders.filter(
      (o) => o.status === "delivered",
    ).length;
    const uniqueCustomers = new Set(
      allOrders.map((o) => o.user?._id.toString()),
    ).size;
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user", "name email")
      .populate("products.product", "name");

    const salesByStatus = {
      pending: allOrders
        .filter((o) => o.status === "pending")
        .reduce((sum, o) => sum + o.totalPrice, 0),
      processing: allOrders
        .filter((o) => o.status === "processing")
        .reduce((sum, o) => sum + o.totalPrice, 0),
      shipped: allOrders
        .filter((o) => o.status === "shipped")
        .reduce((sum, o) => sum + o.totalPrice, 0),
      delivered: allOrders
        .filter((o) => o.status === "delivered")
        .reduce((sum, o) => sum + o.totalPrice, 0),
      cancelled: allOrders
        .filter((o) => o.status === "cancelled")
        .reduce((sum, o) => sum + o.totalPrice, 0),
    };

    res.json({
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
      uniqueCustomers,
      recentOrders,
      salesByStatus,
    });
  } catch (err) {
    console.error("❌ Admin stats error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ MUST EXIST: Get all orders for admin view
router.get("/admin/all", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("products.product", "name price image")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("❌ Get all orders error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// backend/routes/orders.js - MUST HAVE THIS:
router.get("/my-orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate("products.product", "name price image")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("❌ Get my orders error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// backend/routes/orders.js - UPDATE the router.post("/", auth, async...) handler:

router.post("/", auth, async (req, res) => {
  try {
    const {
      products,
      totalPrice,
      address,
      paymentMethod,
      phone, // ✅ NEW: Phone for delivery
      bankName, // ✅ NEW: Bank name for transfers
      paymentProof, // ✅ NEW: Proof filename
    } = req.body;

    const userId = req.userId; // From auth middleware

    // Validation
    if (
      !products?.length ||
      !totalPrice ||
      !address ||
      !phone ||
      !paymentMethod
    ) {
      return res.status(400).json({
        message:
          "Missing required fields: products, totalPrice, address, phone, paymentMethod",
      });
    }

    // Map product IDs (handle both ObjectId and string id)
    const mappedProducts = await Promise.all(
      products.map(async (p) => {
        const rawId = p.product;
        if (mongoose.Types.ObjectId.isValid(rawId)) {
          return {
            product: rawId,
            name: p.name,
            price: p.price,
            image: p.image,
            quantity: p.quantity || 1,
          };
        }
        // Fallback: try to find by name or string id
        const product = await Product.findOne({
          $or: [{ id: parseInt(rawId) }, { name: p.name }, { _id: rawId }],
        });
        if (!product) {
          console.warn(`⚠️ Product not found for ID: ${rawId}`);
          return {
            product: rawId,
            name: p.name,
            price: p.price,
            image: p.image,
            quantity: p.quantity || 1,
          };
        }
        return {
          product: product._id,
          name: p.name,
          price: p.price,
          image: p.image,
          quantity: p.quantity || 1,
        };
      }),
    );

    // Create order with ALL fields
    const order = new Order({
      user: userId,
      products: mappedProducts,
      totalPrice,
      address: typeof address === "string" ? address : JSON.stringify(address),
      phone, // ✅ NEW: Phone for delivery contact
      paymentMethod, // ✅ NEW: telebirr/chapa/bank_transfer/cod
      bankName:
        paymentMethod === "chapa" || paymentMethod === "bank_transfer"
          ? bankName
          : undefined,
      paymentProof:
        paymentMethod === "bank_transfer" ? paymentProof : undefined,
      paymentStatus: paymentMethod === "cod" ? "paid" : "pending", // COD is paid on delivery
      status: paymentMethod === "cod" ? "processing" : "pending", // Auto-start processing for COD
    });

    await order.save();
    console.log("✅ Order saved:", order._id);

    // Populate order for response
    const populatedOrder = await Order.findById(order._id)
      .populate("products.product", "name price image")
      .populate("user", "name email phone");

    // Send confirmation email (async, don't block response)
    if (populatedOrder.user?.email) {
      const { sendOrderConfirmation } = require("../utils/sendEmail");
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
    });
  } catch (err) {
    console.error("❌❌❌ ORDER CREATION ERROR ❌❌❌", {
      name: err.name,
      message: err.message,
      stack: err.stack,
      body: req.body, // Debug: log what was sent
    });
    res.status(500).json({
      message: "Server error",
      error: err.message,
      hint: "Check backend console for full error details",
    });
  }
});

module.exports = router;
