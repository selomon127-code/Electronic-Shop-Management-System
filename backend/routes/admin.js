// backend/routes/admin.js
const router = require("express").Router();
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const mongoose = require("mongoose");
const SupplierPurchase = require("../models/SupplierPurchase");
const StockMovement = require("../models/StockMovement");
const auth = require("../middleware/auth");
const { restrictTo } = require("../middleware/adminAuth");
const { sendStatusUpdateEmail } = require("../utils/sendEmail");
const { releaseCoupon } = require("../utils/couponPricing");
const aiAnalyticsController = require("../controllers/aiAnalyticsController");
const { BulkCostUpdateError, bulkUpdateProductCosts } = require("../services/bulkProductCostService");

console.log("🔧 Loading admin routes...");

class CouponInputError extends Error {}
const normalizeProductTags = (input) => {
  if (input === undefined) return [];
  const tags = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(",")
      : null;
  if (
    !tags ||
    tags.length > 20 ||
    tags.some((tag) => typeof tag !== "string" || tag.trim().length > 40)
  ) {
    throw new Error("Provide up to 20 search tags, each no longer than 40 characters.");
  }
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
};

const normalizeCouponInput = (input, existing = {}) => {
  const merged = { ...existing, ...input };
  const code = String(merged.code || "").trim().toUpperCase();
  const type = merged.type;
  const value = Number(merged.value);
  const minimumSubtotal = Number(merged.minimumSubtotal ?? 0);
  const optionalNumber = (field) => {
    if (merged[field] === "" || merged[field] === null || merged[field] === undefined) {
      return null;
    }
    return Number(merged[field]);
  };
  const maxDiscount = optionalNumber("maxDiscount");
  const usageLimit = optionalNumber("usageLimit");
  const perUserLimit = optionalNumber("perUserLimit");
  const parseDate = (field) => {
    if (!merged[field]) return null;
    const date = new Date(merged[field]);
    return Number.isNaN(date.getTime()) ? NaN : date;
  };
  const startsAt = parseDate("startsAt");
  const expiresAt = parseDate("expiresAt");

  if (
    merged.isActive !== undefined &&
    typeof merged.isActive !== "boolean"
  ) {
    throw new CouponInputError("Coupon active status must be true or false.");
  }
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
    throw new CouponInputError("Coupon code must be 3–32 letters, numbers, hyphens, or underscores.");
  }
  if (!["percentage", "fixed"].includes(type)) {
    throw new CouponInputError("Choose a percentage or fixed-amount coupon.");
  }
  if (!Number.isFinite(value) || value <= 0 || (type === "percentage" && value > 100)) {
    throw new CouponInputError(type === "percentage"
      ? "Percentage value must be greater than 0 and no more than 100."
      : "Fixed discount must be greater than 0.");
  }
  if (!Number.isFinite(minimumSubtotal) || minimumSubtotal < 0) {
    throw new CouponInputError("Minimum subtotal cannot be negative.");
  }
  if (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount <= 0)) {
    throw new CouponInputError("Maximum discount must be greater than 0.");
  }
  if (type !== "percentage" && maxDiscount !== null) {
    throw new CouponInputError("Maximum discount applies only to percentage coupons.");
  }
  for (const [label, limit] of [["Usage limit", usageLimit], ["Per-customer limit", perUserLimit]]) {
    if (limit !== null && (!Number.isInteger(limit) || limit < 1)) {
      throw new CouponInputError(`${label} must be a positive whole number.`);
    }
  }
  if (Number.isNaN(startsAt) || Number.isNaN(expiresAt)) {
    throw new CouponInputError("Enter valid coupon dates.");
  }
  if (startsAt && expiresAt && startsAt >= expiresAt) {
    throw new CouponInputError("Expiration must be later than the start date.");
  }

  return {
    code,
    type,
    value,
    maxDiscount: type === "percentage" ? maxDiscount : null,
    minimumSubtotal,
    startsAt,
    expiresAt,
    usageLimit,
    perUserLimit,
    isActive: merged.isActive === undefined ? true : Boolean(merged.isActive),
  };
};

// Verify the current database role for every management request.
router.use(auth);
router.use("/coupons", restrictTo("business_owner"));
router.use("/analytics", restrictTo("business_owner"));
router.use("/dashboard", restrictTo("business_owner"));
router.use("/orders", restrictTo("business_owner"));
router.use("/products", restrictTo("business_owner"));
router.use("/reports", restrictTo("business_owner"));
router.use("/ai-analytics", restrictTo("business_owner"));
router.use("/users", restrictTo("system_admin"));
router.use("/system", restrictTo("system_admin"));

router.get("/ai-analytics/sales-forecast", aiAnalyticsController.getSalesForecast);
router.get("/ai-analytics/stock-predictions", aiAnalyticsController.getStockPredictions);
router.get("/ai-analytics/customer-insights", aiAnalyticsController.getCustomerInsights);

router.get("/coupons", async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.json(coupons);
  } catch (error) {
    console.error("Get coupons error:", error);
    return res.status(500).json({ message: "Failed to fetch coupons." });
  }
});

router.post("/coupons", async (req, res) => {
  try {
    const coupon = await Coupon.create(normalizeCouponInput(req.body));
    return res.status(201).json(coupon);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "That coupon code already exists." });
    }
    if (error instanceof CouponInputError || error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Create coupon error:", error);
    return res.status(500).json({ message: "Failed to create coupon." });
  }
});

router.put("/coupons/:id", async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found." });

    const normalized = normalizeCouponInput(req.body, coupon.toObject());
    Object.assign(coupon, normalized);
    await coupon.save();
    return res.json(coupon);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "That coupon code already exists." });
    }
    if (error instanceof CouponInputError || error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Update coupon error:", error);
    return res.status(500).json({ message: "Failed to update coupon." });
  }
});

router.delete("/coupons/:id", async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );
    if (!coupon) return res.status(404).json({ message: "Coupon not found." });
    return res.json({ message: "Coupon deactivated.", coupon });
  } catch (error) {
    console.error("Deactivate coupon error:", error);
    return res.status(500).json({ message: "Failed to deactivate coupon." });
  }
});

router.get("/system/health", async (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  return res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "unavailable",
    database: databaseConnected ? "connected" : "disconnected",
    uptime: process.uptime(),
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  });
});

const getReportRange = (query) => {
  const end = query.endDate ? new Date(`${query.endDate}T23:59:59.999Z`) : new Date();
  const start = query.startDate
    ? new Date(`${query.startDate}T00:00:00.000Z`)
    : new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start > end
  ) {
    return null;
  }
  return { start, end };
};

router.get("/reports", async (req, res) => {
  const range = getReportRange(req.query);
  const interval = req.query.interval || "day";
  const dateFormats = { day: "%Y-%m-%d", week: "%G-W%V", month: "%Y-%m", year: "%Y" };
  if (!range) return res.status(400).json({ message: "Provide a valid date range." });
  if (!Object.hasOwn(dateFormats, interval)) {
    return res.status(400).json({ message: "Interval must be day, week, month, or year." });
  }

  try {
  const orderRange = { createdAt: { $gte: range.start, $lte: range.end } };
  const paidOrders = { ...orderRange, paymentStatus: "paid" };
  const [sales, bestSelling, payments, profitLoss, customers, products, purchases, adjustments] =
    await Promise.all([
      Order.aggregate([
        { $match: paidOrders },
        { $group: {
          _id: { $dateToString: { format: dateFormats[interval], date: "$createdAt", timezone: "UTC" } },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
          discounts: { $sum: { $ifNull: ["$coupon.discount", 0] } },
        } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: paidOrders },
        { $unwind: "$products" },
        { $group: {
          _id: "$products.product",
          name: { $last: "$products.name" },
          quantity: { $sum: "$products.quantity" },
          revenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } },
        } },
        { $sort: { quantity: -1 } },
        { $limit: 100 },
      ]),
      Order.aggregate([
        { $match: orderRange },
        { $group: {
          _id: { method: { $ifNull: ["$paymentMethod", "unknown"] }, status: "$paymentStatus" },
          orders: { $sum: 1 },
          amount: { $sum: "$totalPrice" },
        } },
        { $sort: { "_id.method": 1, "_id.status": 1 } },
      ]),
      Order.aggregate([
        { $match: paidOrders },
        { $unwind: "$products" },
        { $group: {
          _id: "$_id",
          revenue: {
            $first: {
              $subtract: [
                { $ifNull: ["$subtotal", "$totalPrice"] },
                { $ifNull: ["$coupon.discount", 0] },
              ],
            },
          },
          costOfGoodsSold: {
            $sum: {
              $cond: [
                { $ne: [{ $ifNull: ["$products.costPrice", null] }, null] },
                { $multiply: ["$products.costPrice", "$products.quantity"] },
                0,
              ],
            },
          },
          linesWithMissingCost: {
            $sum: {
              $cond: [{ $eq: [{ $ifNull: ["$products.costPrice", null] }, null] }, 1, 0],
            },
          },
          lines: { $sum: 1 },
        } },
        { $group: {
          _id: null,
          revenue: { $sum: "$revenue" },
          costOfGoodsSold: { $sum: "$costOfGoodsSold" },
          linesWithMissingCost: { $sum: "$linesWithMissingCost" },
          lines: { $sum: "$lines" },
        } },
        { $project: {
          _id: 0,
          revenue: 1,
          costOfGoodsSold: 1,
          grossProfit: { $subtract: ["$revenue", "$costOfGoodsSold"] },
          linesWithMissingCost: 1,
          lines: 1,
        } },
      ]),
      Order.aggregate([
        { $match: paidOrders },
        { $group: {
          _id: "$user",
          orders: { $sum: 1 },
          spent: { $sum: "$totalPrice" },
          lastPurchase: { $max: "$createdAt" },
        } },
        { $sort: { spent: -1 } },
        { $limit: 500 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "customer" } },
        { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
        { $project: {
          _id: 0,
          customerId: "$_id",
          name: { $ifNull: ["$customer.name", "Deleted customer"] },
          email: { $ifNull: ["$customer.email", ""] },
          orders: 1,
          spent: 1,
          lastPurchase: 1,
        } },
      ]),
      Product.find().select("name category stock costPrice price").sort({ name: 1 }).lean(),
      SupplierPurchase.find({ purchaseDate: { $gte: range.start, $lte: range.end } })
        .select("supplierName productName quantity unitCost totalCost purchaseDate reference notes")
        .sort({ purchaseDate: -1 }).lean(),
      StockMovement.find({ createdAt: { $gte: range.start, $lte: range.end } })
        .select("productName type quantity stockAfter unitCost note createdAt").sort({ createdAt: -1 }).lean(),
    ]);

  const stockMovements = [
    ...adjustments,
    ...purchases.map((purchase) => ({
      productName: purchase.productName,
      type: "supplier_purchase",
      quantity: purchase.quantity,
      stockAfter: null,
      unitCost: purchase.unitCost,
      note: `${purchase.supplierName}${purchase.reference ? ` · ${purchase.reference}` : ""}`,
      createdAt: purchase.purchaseDate,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const salesQuantities = new Map(bestSelling.map((item) => [String(item._id), item.quantity]));


  const inventory = products.map((product) => ({
    productId: product._id,
    name: product.name,
    category: product.category,
    stock: product.stock,
    price: product.price,
    unitCost: product.costPrice,
    valuation: product.costPrice == null ? null : Number((product.stock * product.costPrice).toFixed(2)),
    unitsSold: salesQuantities.get(String(product._id)) || 0,
  }));
  const financials = profitLoss[0] || {
    revenue: 0, costOfGoodsSold: 0, grossProfit: 0, linesWithMissingCost: 0, lines: 0,
  };
  financials.incompleteCostLines = financials.linesWithMissingCost;
  financials.isComplete = financials.linesWithMissingCost === 0;
  if (!financials.isComplete) financials.grossProfit = null;
  const averageUnitsSold = inventory.length
    ? inventory.reduce((sum, item) => sum + item.unitsSold, 0) / inventory.length
    : 0;

  return res.json({
    range,
    interval,
    sales,
    profitLoss: financials,
    inventory: {
      items: inventory,
      valuation: Number(inventory.reduce((sum, item) => sum + (item.valuation || 0), 0).toFixed(2)),
      itemsWithoutCost: inventory.filter((item) => item.unitCost == null).length,
    },
    stockMovements,
    bestSelling,
    slowMoving: inventory
      .filter((item) => item.unitsSold <= averageUnitsSold)
      .sort((a, b) => a.unitsSold - b.unitsSold || b.stock - a.stock),
    customers,
    payments: payments.map((item) => ({
      method: item._id.method,
      status: item._id.status,
      orders: item.orders,
      amount: item.amount,
    })),
    supplierPurchases: purchases,
    notes: {
      revenue: "Sales reports include paid orders only and group by order creation date.",
      profitLoss: "Gross profit excludes operating expenses. Orders created before product cost snapshots were introduced may have missing cost values.",
      inventory: "Inventory valuation uses the current product cost price; products without a recorded cost are excluded from the total.",
      stockMovements: "Order sales and manual adjustments are tracked from this release onward. Supplier purchases are derived from supplier purchase records.",
    },
  });
  } catch (error) {
    console.error("Reports analytics error:", error);
    return res.status(500).json({ message: "Failed to load reports." });
  }
});

router.post("/reports/supplier-purchases", async (req, res) => {
  const { supplierName, productId, quantity, unitCost, purchaseDate, reference = "", notes = "" } = req.body;
  const parsedQuantity = Number(quantity);
  const parsedUnitCost = Number(unitCost);
  const parsedDate = purchaseDate ? new Date(purchaseDate) : new Date();
  if (
    typeof supplierName !== "string" ||
    !supplierName.trim() ||
    supplierName.trim().length > 120 ||
    !mongoose.isValidObjectId(productId) ||
    !Number.isSafeInteger(parsedQuantity) ||
    parsedQuantity < 1 ||
    !Number.isFinite(parsedUnitCost) ||
    parsedUnitCost < 0 ||
    !Number.isFinite(parsedQuantity * parsedUnitCost) ||
    Number.isNaN(parsedDate.getTime()) ||
    typeof reference !== "string" ||
    reference.length > 120 ||
    typeof notes !== "string" ||
    notes.length > 1000
  ) {
    return res.status(400).json({ message: "Enter a supplier, valid product, positive whole quantity, unit cost, and valid purchase date." });
  }

  let purchase;
  try {
    const product = await Product.findById(productId).select("name");
    if (!product) return res.status(404).json({ message: "Product not found." });

    purchase = await SupplierPurchase.create({
      supplierName: supplierName.trim(),
      product: product._id,
      productName: product.name,
      quantity: parsedQuantity,
      unitCost: parsedUnitCost,
      totalCost: Number((parsedQuantity * parsedUnitCost).toFixed(2)),
      purchaseDate: parsedDate,
      reference: reference.trim(),
      notes: notes.trim(),
    });

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      [{
        $set: {
          costPrice: {
            $cond: [
              { $lte: [{ $ifNull: ["$stock", 0] }, 0] },
              parsedUnitCost,
              {
                $cond: [
                  { $eq: [{ $ifNull: ["$costPrice", null] }, null] },
                  null,
                  {
                    $divide: [
                      {
                        $add: [
                          { $multiply: ["$stock", "$costPrice"] },
                          parsedQuantity * parsedUnitCost,
                        ],
                      },
                      { $add: ["$stock", parsedQuantity] },
                    ],
                  },
                ],
              },
            ],
          },
          stock: { $add: [{ $ifNull: ["$stock", 0] }, parsedQuantity] },
        },
      }],
      { new: true },
    );
    if (!updatedProduct) {
      await SupplierPurchase.findByIdAndDelete(purchase._id);
      return res.status(404).json({ message: "Product not found." });
    }

    return res.status(201).json({ message: "Supplier purchase recorded and stock updated.", purchase, product: updatedProduct });
  } catch (error) {
    if (purchase) await SupplierPurchase.findByIdAndDelete(purchase._id);
    console.error("Record supplier purchase error:", error);
    return res.status(500).json({ message: "Could not record supplier purchase." });
  }
});

router.get("/analytics/revenue", async (req, res) => {
  try {
    const range = req.query.range || "30d";
    if (!["7d", "30d", "12m"].includes(range)) {
      return res.status(400).json({ message: "Range must be 7d, 30d, or 12m." });
    }

    const now = new Date();
    const isMonthly = range === "12m";
    const start = isMonthly
      ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1))
      : new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() - (range === "7d" ? 6 : 29),
          ),
        );
    const end = isMonthly
      ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
      : new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
        );
    const dateFormat = isMonthly ? "%Y-%m" : "%Y-%m-%d";
    const match = {
      paymentStatus: "paid",
      createdAt: { $gte: start, $lt: end },
    };

    const [series, paymentBreakdown] = await Promise.all([
      Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: {
                format: dateFormat,
                date: "$createdAt",
                timezone: "UTC",
              },
            },
            revenue: { $sum: "$totalPrice" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $ifNull: ["$paymentMethod", "unknown"] },
            revenue: { $sum: "$totalPrice" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
    ]);

    const valuesByPeriod = new Map(
      series.map((item) => [
        item._id,
        { revenue: Number(item.revenue) || 0, orders: item.orders || 0 },
      ]),
    );
    const revenueSeries = [];
    const cursor = new Date(start);
    while (cursor < end) {
      const period = isMonthly
        ? cursor.toISOString().slice(0, 7)
        : cursor.toISOString().slice(0, 10);
      revenueSeries.push({
        period,
        revenue: valuesByPeriod.get(period)?.revenue || 0,
        orders: valuesByPeriod.get(period)?.orders || 0,
      });
      if (isMonthly) cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      else cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const totalRevenue = revenueSeries.reduce(
      (total, item) => total + item.revenue,
      0,
    );
    const totalOrders = revenueSeries.reduce(
      (total, item) => total + item.orders,
      0,
    );

    return res.json({
      range,
      currency: "ETB",
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders
        ? Number((totalRevenue / totalOrders).toFixed(2))
        : 0,
      revenueSeries,
      paymentBreakdown: paymentBreakdown.map((item) => ({
        method: item._id,
        revenue: Number(item.revenue) || 0,
        orders: item.orders || 0,
      })),
    });
  } catch (error) {
    console.error("Revenue analytics error:", error);
    return res.status(500).json({ message: "Failed to load revenue analytics." });
  }
});

// ============================================
// DASHBOARD
// ============================================

// GET /admin/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    console.log("📊 Admin dashboard request from:", req.user?.email);

    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ role: "customer" });
    const totalProducts = await Product.countDocuments();

    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const pendingRevenueResult = await Order.aggregate([
      { $match: { paymentStatus: "pending" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const pendingRevenue = pendingRevenueResult[0]?.total || 0;

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user", "name email")
      .populate("products.product", "name image");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today },
    });

    const todayRevenueResult = await Order.aggregate([
      { $match: { createdAt: { $gte: today }, paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const todayRevenue = todayRevenueResult[0]?.total || 0;

    res.json({
      stats: {
        totalOrders,
        totalUsers,
        totalProducts,
        totalRevenue,
        pendingRevenue,
        todayOrders,
        todayRevenue,
      },
      ordersByStatus: ordersByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentOrders,
    });
  } catch (err) {
    console.error("❌ Dashboard error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ============================================
// ORDERS
// ============================================

// GET /admin/orders
router.get("/orders", async (req, res) => {
  try {
    const { status, paymentStatus, page = 1, limit = 20, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
      filter.$or = [
        { "address.city": { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("user", "name email phone")
      .populate("products.product", "name image price");

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("❌ Get orders error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /admin/orders/:id
router.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone address")
      .populate("products.product", "name image price stock");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.error("❌ Get order error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});
// 🔹 DELETE /admin/orders/:id - Delete order (admin only)
router.delete("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await Order.findByIdAndDelete(req.params.id);
    if (
      order.paymentStatus !== "paid" &&
      (order.coupon?.couponId || order.coupon?.code)
    ) {
      const coupon = order.coupon.couponId
        ? await Coupon.findById(order.coupon.couponId)
        : await Coupon.findOne({ code: order.coupon.code });
      if (coupon) await releaseCoupon(coupon._id, order.user, order._id);
    }

    console.log(`✅ Order deleted: #${req.params.id.slice(-6).toUpperCase()}`);

    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("❌ Delete order error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// PUT /admin/orders/:id/status
router.put("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email",
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const oldStatus = order.status;
    const shouldRestoreStock =
      status === "cancelled" &&
      oldStatus !== "cancelled" &&
      ["pending", "pending_payment"].includes(oldStatus) &&
      order.paymentStatus !== "paid";
    order.status = status;
    if (
      status === "delivered" &&
      order.paymentMethod === "cod" &&
      order.paymentStatus === "pending"
    ) {
      order.paymentStatus = "paid";
    }
    await order.save();
    if (shouldRestoreStock) {
      for (const item of order.products) {
        if (!item.product) continue;
        const product = await Product.findByIdAndUpdate(
          item.product,
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
            note: "Business-owner cancellation",
          });
        }
      }
    }

    if (
      status === "cancelled" &&
      oldStatus !== "cancelled" &&
      order.paymentStatus !== "paid" &&
      (order.coupon?.couponId || order.coupon?.code)
    ) {
      const coupon = order.coupon.couponId
        ? await Coupon.findById(order.coupon.couponId)
        : await Coupon.findOne({ code: order.coupon.code });
      if (coupon) await releaseCoupon(coupon._id, order.user?._id, order._id);
    }

    if (order.user?.email && oldStatus !== status) {
      sendStatusUpdateEmail(order.user.email, order, status).catch((err) =>
        console.error("❌ Status email error:", err.message),
      );
    }

    res.json({ message: "Order status updated", order });
  } catch (err) {
    console.error("❌ Update status error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================
// USERS
// ============================================

// GET /admin/users
router.get("/users", async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("❌ Get users error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /admin/users/:id
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const orderStats = await Order.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$totalPrice" },
          lastOrder: { $max: "$createdAt" },
        },
      },
    ]);

    res.json({
      user,
      stats: orderStats[0] || {
        totalOrders: 0,
        totalSpent: 0,
        lastOrder: null,
      },
    });
  } catch (err) {
    console.error("❌ Get user error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT /admin/users/:id/role
router.put("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;

    if (!["customer", "business_owner", "system_admin"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Role must be customer, business_owner, or system_admin." });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._id.toString() === req.userId.toString()) {
      return res.status(400).json({ message: "Cannot change your own role" });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    console.log(
      `✅ User role changed: ${user.email} from ${oldRole} to ${role}`,
    );

    res.json({
      message: `User role updated to ${role}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Update role error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE /admin/users/:id
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._id.toString() === req.userId.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    const orderCount = await Order.countDocuments({ user: user._id });

    if (orderCount > 0) {
      return res.status(400).json({
        message: `Cannot delete user with ${orderCount} orders. Consider deactivating instead.`,
      });
    }

    await User.findByIdAndDelete(req.params.id);

    console.log(`✅ User deleted: ${user.email}`);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Delete user error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ============================================
// PRODUCTS (ORDER MATTERS!)
// ============================================

// ✅ GET /admin/products - MUST BE BEFORE /products/:id!
router.get("/products", async (req, res) => {
  try {
    console.log("📦 Admin products request from:", req.user?.email);

    const { search, category, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);
    const categories = await Product.distinct("category");

    console.log("✅ Found", products.length, "products");

    res.json({
      products,
      categories,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("❌ Get products error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.put("/products/bulk-cost", async (req, res) => {
  try {
    const result = await bulkUpdateProductCosts(Product, req.body);
    return res.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof BulkCostUpdateError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error("Bulk product cost update error:", error);
    return res.status(500).json({ message: "Failed to update product costs." });
  }
});

// ✅ GET /admin/products/:id - MUST BE AFTER /products!
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    console.error("❌ Get product error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /admin/products
router.post("/products", async (req, res) => {
  try {
    const {
      name,
      description,
      descriptionAm,
      descriptionOm,
      descriptionTi,
      price,
      discount,
      category,
      stock,
      image,
      costPrice,
      brand,
      tags,
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" });
    }
    if (
      costPrice !== undefined &&
      costPrice !== "" &&
      (!Number.isFinite(Number(costPrice)) || Number(costPrice) < 0)
    ) {
      return res.status(400).json({ message: "Cost price must be zero or greater." });
    }
    if (brand !== undefined && (typeof brand !== "string" || brand.length > 80)) {
      return res.status(400).json({ message: "Brand must be a string of 80 characters or fewer." });
    }
    let normalizedTags;
    try {
      normalizedTags = normalizeProductTags(tags);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    let imageUrl =
      "https://via.placeholder.com/300x300/667eea/ffffff?text=No+Image";

    // ✅ If a Base64 image is provided, upload it to Cloudinary
    if (image && image.startsWith("data:image")) {
      try {
        const cloudinary = require("cloudinary").v2;
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: "eshop-ethiopia",
        });
        imageUrl = uploadResponse.secure_url;
        console.log("✅ Image uploaded to Cloudinary:", imageUrl);
      } catch (uploadError) {
        console.error("❌ Cloudinary upload error:", uploadError.message);
        return res
          .status(500)
          .json({ message: "Failed to upload image to Cloudinary" });
      }
    } else if (image) {
      // If it's already a URL (e.g., from a previous edit or placeholder)
      imageUrl = image;
    }

    const product = new Product({
      name,
      description: description || "",
      descriptionAm: descriptionAm || "",
      descriptionOm: descriptionOm || "",
      descriptionTi: descriptionTi || "",
      price: parseFloat(price),
      discount: discount === undefined ? 0 : Number(discount),
      category: category || "Uncategorized",
      stock: parseInt(stock) || 0,
      costPrice: costPrice === "" || costPrice == null ? null : Number(costPrice),
      brand: brand?.trim() || "",
      tags: normalizedTags,
      image: imageUrl,
    });

    await product.save();
    if (product.stock > 0) {
      await StockMovement.create({
        product: product._id,
        productName: product.name,
        type: "opening",
        quantity: product.stock,
        stockAfter: product.stock,
        unitCost: product.costPrice,
      });
    }

    console.log("✅ Product created:", product.name);

    res.status(201).json({ message: "Product created successfully", product });
  } catch (err) {
    console.error("❌ Create product error:", err.message);

    // ✅ Return specific Mongoose validation errors instead of a generic 500
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: "Validation failed", errors });
    }

    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// PUT /admin/products/:id
router.put("/products/:id", async (req, res) => {
  try {
    const {
      name,
      description,
      descriptionAm,
      descriptionOm,
      descriptionTi,
      price,
      discount,
      category,
      stock,
      image,
      costPrice,
      brand,
      tags,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const discountValue =
      discount === undefined ? undefined : Number(discount);
    if (
      discountValue !== undefined &&
      (!Number.isInteger(discountValue) ||
        discountValue < 0 ||
        discountValue > 100)
    ) {
      return res
        .status(400)
        .json({ message: "Discount must be a whole percentage from 0 to 100" });
    }
    if (
      costPrice !== undefined &&
      costPrice !== null &&
      costPrice !== "" &&
      (!Number.isFinite(Number(costPrice)) || Number(costPrice) < 0)
    ) {
      return res.status(400).json({ message: "Cost price must be zero or greater." });
    }
    if (brand !== undefined && (typeof brand !== "string" || brand.length > 80)) {
      return res.status(400).json({ message: "Brand must be a string of 80 characters or fewer." });
    }
    let normalizedTags;
    if (tags !== undefined) {
      try {
        normalizedTags = normalizeProductTags(tags);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }

    let imageUrl = product.image;

    // ✅ Handle new Base64 image upload on edit
    if (image && image.startsWith("data:image") && image !== product.image) {
      try {
        const cloudinary = require("cloudinary").v2;
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: "eshop-ethiopia",
        });
        imageUrl = uploadResponse.secure_url;
        console.log("✅ New image uploaded to Cloudinary:", imageUrl);
      } catch (uploadError) {
        console.error("❌ Cloudinary upload error:", uploadError.message);
        return res.status(500).json({ message: "Failed to upload new image" });
      }
    } else if (image) {
      imageUrl = image;
    }

    const previousStock = product.stock;
    product.name = name || product.name;
    product.description =
      description !== undefined ? description : product.description;
    product.descriptionAm =
      descriptionAm !== undefined ? descriptionAm : product.descriptionAm;
    product.descriptionOm =
      descriptionOm !== undefined ? descriptionOm : product.descriptionOm;
    product.descriptionTi =
      descriptionTi !== undefined ? descriptionTi : product.descriptionTi;
    product.price = price ? parseFloat(price) : product.price;
    if (discountValue !== undefined) product.discount = discountValue;
    product.category = category || product.category;
    product.stock = stock !== undefined ? parseInt(stock) : product.stock;
    if (costPrice !== undefined) {
      product.costPrice = costPrice === "" || costPrice === null ? null : Number(costPrice);
    }
    if (brand !== undefined) product.brand = String(brand).trim();
    if (normalizedTags !== undefined) product.tags = normalizedTags;
    product.image = imageUrl;

    await product.save();
    const stockDelta = product.stock - previousStock;
    if (stockDelta !== 0) {
      await StockMovement.create({
        product: product._id,
        productName: product.name,
        type: "adjustment",
        quantity: stockDelta,
        stockAfter: product.stock,
        unitCost: product.costPrice,
        note: "Manual product stock edit",
      });
    }

    console.log(
      "✅ Product updated:",
      product.name,
      `(${product.discount}% discount)`,
    );

    res.json({ message: "Product updated successfully", product });
  } catch (err) {
    console.error("❌ Update product error:", err.message);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: "Validation failed", errors });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE /admin/products/:id
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await Product.findByIdAndDelete(req.params.id);

    console.log("✅ Product deleted:", product.name);

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("❌ Delete product error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// 🔹 POST /admin/users - Create new user (admin only)
router.post("/users", async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    if (!["customer", "business_owner", "system_admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Create new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      phone: phone || "",
      authProvider: "local",
    });

    await newUser.save();

    console.log(`✅ Admin created new user: ${newUser.email} (${role})`);

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error("❌ Create user error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

console.log("✅ Admin routes loaded successfully");
// Add to backend/routes/admin.js (before module.exports)

const Wishlist = require("../models/Wishlist");

// ============================================
// WISHLIST (User-facing routes)
// ============================================

// 🔹 GET /wishlist - Get user's wishlist
router.get("/wishlist", async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.userId }).populate(
      "products.product",
      "name price image stock category",
    );

    if (!wishlist) {
      wishlist = { user: req.userId, products: [] };
    }

    res.json(wishlist);
  } catch (err) {
    console.error("❌ Get wishlist error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🔹 POST /wishlist - Add product to wishlist
router.post("/wishlist", async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    let wishlist = await Wishlist.findOne({ user: req.userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.userId,
        products: [{ product: productId }],
      });
    } else {
      // Check if product already in wishlist
      const exists = wishlist.products.some(
        (p) => p.product.toString() === productId,
      );

      if (exists) {
        return res.status(400).json({ message: "Product already in wishlist" });
      }

      wishlist.products.push({ product: productId });
    }

    await wishlist.save();
    await wishlist.populate(
      "products.product",
      "name price image stock category",
    );

    console.log("✅ Product added to wishlist");

    res.status(201).json({
      message: "Product added to wishlist",
      wishlist,
    });
  } catch (err) {
    console.error("❌ Add to wishlist error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🔹 DELETE /wishlist/:productId - Remove product from wishlist
router.delete("/wishlist/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.userId });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    wishlist.products = wishlist.products.filter(
      (p) => p.product.toString() !== productId,
    );

    await wishlist.save();
    await wishlist.populate(
      "products.product",
      "name price image stock category",
    );

    console.log("✅ Product removed from wishlist");

    res.json({
      message: "Product removed from wishlist",
      wishlist,
    });
  } catch (err) {
    console.error("❌ Remove from wishlist error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🔹 DELETE /wishlist - Clear entire wishlist
router.delete("/wishlist", async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({ user: req.userId });

    console.log("✅ Wishlist cleared");

    res.json({ message: "Wishlist cleared", wishlist: { products: [] } });
  } catch (err) {
    console.error("❌ Clear wishlist error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ ONLY ONE module.exports!
module.exports = router;
