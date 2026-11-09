const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Coupon = require("../models/Coupon");
const CouponUserUsage = require("../models/CouponUserUsage");
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const { getDiscountedPrice } = require("../utils/productPricing");
const { sendDealBroadcastEmail } = require("../utils/sendEmail");
const User = require("../models/User");

const {
  getCouponDiscount,
  getCouponStatusMessage,
  getShippingFee,
} = require("../utils/couponPricing");

const router = express.Router();

router.get("/available", async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
      ],
    })
      .select(
        "code type value description maxDiscount minimumSubtotal startsAt expiresAt usageLimit usageCount perUserLimit status allowedUsers applicableCategories applicableProducts",
      )
      .sort({ createdAt: -1 })
      .lean();

    const globallyAvailable = coupons.filter(
      (coupon) =>
        (coupon.status === undefined || coupon.status === "Active") &&
        (coupon.usageLimit == null ||
          (coupon.usageCount ?? 0) < coupon.usageLimit),
    );

    const authorization = req.header("Authorization");
    let userId = null;
    if (authorization) {
      if (!authorization.startsWith("Bearer ") || !process.env.JWT_SECRET) {
        return res.status(401).json({ message: "Unauthorized." });
      }
      try {
        const decoded = jwt.verify(
          authorization.slice(7),
          process.env.JWT_SECRET,
        );
        userId = decoded.id || decoded._id || decoded.userId;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(401).json({ message: "Unauthorized." });
        }
      } catch {
        return res.status(401).json({ message: "Unauthorized." });
      }
    }

    let usages = [];
    if (userId) {
      const userLimitedIds = globallyAvailable
        .filter((coupon) => coupon.perUserLimit != null)
        .map((coupon) => coupon._id);
      if (userLimitedIds.length) {
        usages = await CouponUserUsage.find({
          user: userId,
          coupon: { $in: userLimitedIds },
        })
          .select("coupon uses")
          .lean();
      }
    }

    const usageByCoupon = new Map(
      usages.map((usage) => [String(usage.coupon), usage.uses]),
    );

    let availableCoupons = globallyAvailable.filter((coupon) => {
      if (coupon.perUserLimit != null && userId) {
        if (
          (usageByCoupon.get(String(coupon._id)) || 0) >= coupon.perUserLimit
        ) {
          return false;
        }
      }
      // Customer-specific restriction
      if (
        Array.isArray(coupon.allowedUsers) &&
        coupon.allowedUsers.length > 0
      ) {
        if (
          !userId ||
          !coupon.allowedUsers.some((u) => String(u) === String(userId))
        ) {
          return false;
        }
      }
      return true;
    });

    if (req.query.subtotal !== undefined) {
      const subtotalNum = Number(req.query.subtotal);
      if (!Number.isNaN(subtotalNum) && subtotalNum >= 0) {
        availableCoupons = availableCoupons.filter(
          (coupon) => (coupon.minimumSubtotal ?? 0) <= subtotalNum,
        );
      }
    }

    const customerVisibleCoupons = availableCoupons.map((coupon) => ({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      description: coupon.description || undefined,
      maxDiscount: coupon.maxDiscount,
      minimumSubtotal: coupon.minimumSubtotal,
      startsAt: coupon.startsAt,
      expiresAt: coupon.expiresAt,
    }));

    return res.json({ coupons: customerVisibleCoupons });
  } catch (error) {
    console.error("Get available coupons error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch available coupons." });
  }
});

router.post("/validate", auth, async (req, res) => {
  try {
    const code =
      typeof req.body.code === "string"
        ? req.body.code.trim().toUpperCase()
        : "";
    const items = req.body.items;
    if (!code) {
      return res.status(400).json({ message: "Enter a coupon code." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty." });
    }

    let subtotal = 0;
    const categories = [];
    const productIds = [];
    for (const item of items) {
      const productId = item.product || item._id || item.productId;
      const quantity = Number(item.quantity);
      if (
        !mongoose.Types.ObjectId.isValid(productId) ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return res
          .status(400)
          .json({ message: "Cart contains an invalid item." });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res
          .status(404)
          .json({ message: "A cart product no longer exists." });
      }
      if (product.stock < quantity) {
        return res
          .status(400)
          .json({ message: `Not enough stock for ${product.name}.` });
      }
      if (product.category) categories.push(product.category);
      productIds.push(product._id);
      subtotal +=
        getDiscountedPrice(product.price, product.discount || 0) * quantity;
    }
    subtotal = Number(subtotal.toFixed(2));

    const coupon = await Coupon.findOne({ code });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon code not found." });
    }

    const message = await getCouponStatusMessage(
      coupon,
      req.userId,
      subtotal,
      new Date(),
      {
        categories,
        productIds,
      },
    );
    if (message) {
      return res.status(400).json({ message });
    }

    const couponDiscount = getCouponDiscount(coupon, subtotal);
    const shippingFee = getShippingFee(subtotal);
    return res.json({
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description || undefined,
        maxDiscount: coupon.maxDiscount,
        minimumSubtotal: coupon.minimumSubtotal,
      },
      subtotal,
      couponDiscount,
      shippingFee,
      total: Number((subtotal - couponDiscount + shippingFee).toFixed(2)),
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    return res.status(500).json({ message: "Failed to validate coupon." });
  }
});

// Inside your POST / route, after saving the coupon:
router.post("/", auth, async (req, res) => {
  try {
    // ... existing validation and coupon creation logic ...
    const newCoupon = new Coupon(req.body);
    await newCoupon.save();

    // ✅ NEW: Send broadcast to all customers
    if (req.user.role === "business_owner" || req.user.role === "admin") {
      const customers = await User.find({ role: "customer" }).select(
        "email name",
      );
      if (customers.length > 0) {
        // Run in background so it doesn't delay the API response
        sendDealBroadcastEmail(customers, newCoupon).catch((err) => {
          console.error("❌ Deal broadcast failed:", err);
        });
      }
    }

    res
      .status(201)
      .json({ message: "Coupon created successfully", coupon: newCoupon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
