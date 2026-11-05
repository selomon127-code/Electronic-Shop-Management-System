const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const StockMovement = require("../models/StockMovement");
const Coupon = require("../models/Coupon");
const auth = require("../middleware/auth");
const axios = require("axios");
const { verifyPayment: verifyChapaPayment } = require("../utils/chapa");
const { getDiscountedPrice } = require("../utils/productPricing");
const {
  claimCoupon,
  getCouponDiscount,
  getCouponStatusMessage,
  getShippingFee,
  releaseCoupon,
} = require("../utils/couponPricing");

// ✅ Import BOTH email functions
const {
  sendOrderConfirmation,
  sendLowStockAlert,
} = require("../utils/sendEmail");

// ✅ 1. CREATE ORDER
router.post("/", auth, async (req, res) => {
  const decrementedStock = [];
  let claimedCoupon = null;
  let claimedCouponUserId = null;
  let claimedOrderId = null;
  let orderPersisted = false;
  let stockMovementOrderId = null;

  try {
    const {
      shippingAddress,
      paymentMethod,
      products,
      items,
      couponCode: requestedCouponCode,
    } = req.body;
    const orderItems = products || items;
    const userId = req.user?.id || req.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!orderItems || orderItems.length === 0)
      return res.status(400).json({ message: "Cart is empty" });

    let subtotal = 0;
    const orderProducts = [];
    const categories = [];
    const productIds = [];
    const quantitiesByProduct = new Map();

    for (const item of orderItems) {
      const productId = item.product || item._id || item.productId;
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: "Invalid product quantity" });
      }
      const product = await Product.findById(productId);

      if (!product)
        return res.status(404).json({ message: `Product not found` });
      if (product.category) categories.push(product.category);
      productIds.push(product._id);
      const totalQuantity =
        (quantitiesByProduct.get(String(product._id)) || 0) + quantity;
      quantitiesByProduct.set(String(product._id), totalQuantity);
      if (product.stock < totalQuantity)
        return res
          .status(400)
          .json({ message: `Not enough stock for ${product.name}` });

      const discountedPrice = getDiscountedPrice(
        product.price,
        product.discount || 0,
      );
      subtotal += discountedPrice * quantity;
      orderProducts.push({
        product: product._id,
        name: product.name,
        price: discountedPrice,
        costPrice: product.costPrice ?? null,
        originalPrice: product.price,
        discountPercent: product.discount || 0,
        quantity,
        image: product.image,
      });
    }

    subtotal = Number(subtotal.toFixed(2));
    const shippingFee = getShippingFee(subtotal);
    const couponCode =
      typeof requestedCouponCode === "string"
        ? requestedCouponCode.trim().toUpperCase()
        : "";
    let coupon = null;
    let couponDiscount = 0;

    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode });
      if (!coupon) {
        return res.status(400).json({ message: "Coupon code not found." });
      }
      const couponError = await getCouponStatusMessage(coupon, userId, subtotal, new Date(), {
        categories,
        productIds,
      });
      if (couponError) return res.status(400).json({ message: couponError });
      couponDiscount = getCouponDiscount(coupon, subtotal);
    }

    const calculatedTotal = Number(
      Math.max(0, subtotal - couponDiscount + shippingFee).toFixed(2),
    );

    const isCOD = paymentMethod === "cod";
    const newOrder = new Order({
      user: userId,
      products: orderProducts,
      subtotal,
      shippingFee,
      coupon: coupon
        ? { couponId: coupon._id, code: coupon.code, discount: couponDiscount }
        : { code: null, discount: 0 },
      shippingAddress,
      totalPrice: calculatedTotal,
      paymentMethod: isCOD ? "cod" : "chapa",
      status: isCOD ? "pending" : "pending_payment",
      paymentStatus: "pending",
    });

    if (coupon) {
      claimedCoupon = await claimCoupon(
        coupon,
        userId,
        newOrder._id,
      );
      if (!claimedCoupon) {
        return res.status(409).json({
          message: "This coupon has just reached its usage limit. Remove it and try again.",
        });
      }
      claimedCouponUserId = userId;
      claimedOrderId = newOrder._id;
    }

    for (const [productId, quantity] of quantitiesByProduct) {
      const product = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true },
      );
      if (!product) {
        await Promise.all(
          decrementedStock.map(({ productId: restoredProductId, quantity: restoredQuantity }) =>
            Product.findByIdAndUpdate(restoredProductId, {
              $inc: { stock: restoredQuantity },
            }),
          ),
        );
        decrementedStock.length = 0;
        if (claimedCoupon && claimedOrderId) {
          await releaseCoupon(claimedCoupon._id, userId, claimedOrderId);
          claimedCoupon = null;
          claimedCouponUserId = null;
          claimedOrderId = null;
        }
        return res.status(400).json({
          message: "Product stock changed during checkout. Please review your cart.",
        });
      }
      decrementedStock.push({
        productId,
        quantity,
        productName: product.name,
        stockAfter: product.stock,
        unitCost: product.costPrice ?? null,
      });

      if (product.stock <= 5) {
        sendLowStockAlert(
          product.name,
          product.stock,
          process.env.ADMIN_EMAIL,
        ).catch((err) => {
          console.error("❌ Low stock alert email failed:", err);
        });
      }
    }

    stockMovementOrderId = newOrder._id;
    await StockMovement.insertMany(
      decrementedStock.map((item) => ({
        product: item.productId,
        productName: item.productName,
        type: "sale",
        quantity: -item.quantity,
        stockAfter: item.stockAfter,
        unitCost: item.unitCost,
        order: stockMovementOrderId,
      })),
    );

    const savedOrder = await newOrder.save();
    orderPersisted = true;

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
          callback_url: `${process.env.BACKEND_URL}/api/payment/chapa/webhook`,
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
        return res.status(201).json({
          message: "Order created, redirecting to payment...",
          order: savedOrder,
          checkoutUrl: chapaResponse.data.data.checkout_url,
        });
      }
    }

    res.status(201).json({
      message: isCOD
        ? "Order placed successfully! Pay on delivery."
        : "Order created",
      order: savedOrder,
    });
  } catch (error) {
    console.error("❌ Create Order Error:", error);
    if (!orderPersisted && stockMovementOrderId) {
      try {
        await StockMovement.deleteMany({ order: stockMovementOrderId });
      } catch (cleanupError) {
        console.error("❌ Failed to remove uncommitted stock movements:", cleanupError);
      }
    }
    if (!orderPersisted) {
      await Promise.all(
        decrementedStock.map(({ productId, quantity }) =>
          Product.findByIdAndUpdate(productId, { $inc: { stock: quantity } }),
        ),
      );
      if (claimedCoupon && claimedOrderId) {
        await releaseCoupon(
          claimedCoupon._id,
          claimedCouponUserId,
          claimedOrderId,
        );
      }
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ 2. GET USER ORDERS
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    const orders = await Order.find({ user: userId })
      .populate("products.product", "name image price category")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (String(order.user) !== String(req.userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (order.paymentStatus === "pending" && order.chapaTxRef) {
      const verification = await verifyChapaPayment(order.chapaTxRef);
      const verifiedAmount = Number(verification.amount);
      if (
        verification.success &&
        verification.status === "success" &&
        verification.currency === "ETB" &&
        Number.isFinite(verifiedAmount) &&
        Math.round(verifiedAmount * 100) === Math.round(order.totalPrice * 100)
      ) {
        order.paymentStatus = "paid";
        order.status = "processing";
        await order.save();
      }
    }

    await order.populate("products.product", "name image price category");
    return res.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    return res.status(500).json({ message: "Failed to fetch order." });
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

    order.status = "cancelled";
    order.paymentStatus = "cancelled";
    await order.save();
    for (const item of order.products) {
      if (item.product) {
        const product = await Product.findByIdAndUpdate(
          item.product._id,
          { $inc: { stock: item.quantity } },
          { new: true },
        );
        if (product) {
          await StockMovement.create({
            product: product._id,
            productName: item.name || product.name,
            type: "return",
            quantity: item.quantity,
            stockAfter: product.stock,
            unitCost: item.costPrice ?? null,
            order: order._id,
            note: "Customer order cancellation",
          });
        }
      }
    }
    if (order.coupon?.couponId || order.coupon?.code) {
      const coupon = order.coupon.couponId
        ? await Coupon.findById(order.coupon.couponId)
        : await Coupon.findOne({ code: order.coupon.code });
      if (coupon) await releaseCoupon(coupon._id, userId, order._id);
    }

    res.json({
      message: "Order cancelled successfully and stock restored",
      order,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
