const express = require("express");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { findProductsForQuery } = require("../utils/aiProductSearch");

const router = express.Router();
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
const recommendationsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

function getOptionalUserId(req) {
  const token = req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id || decoded._id || decoded.userId || null;
  } catch {
    return null;
  }
}

function validIds(values, limit = 12) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((id) => mongoose.isValidObjectId(id)).map(String))].slice(0, limit);
}

router.post("/search", searchLimiter, async (req, res) => {
  const query = typeof req.body?.query === "string" ? req.body.query.trim() : "";
  if (!query || query.length > 300) {
    return res.status(400).json({ message: "Enter a search query of up to 300 characters." });
  }

  try {
    const { parsed, products, fallbackUsed } = await findProductsForQuery(query);
    return res.json({
      success: true,
      query,
      filters: parsed.filters,
      products,
      fallbackUsed,
    });
  } catch (error) {
    console.error("AI product search error:", error);
    return res.status(500).json({ message: "Product search failed. Please try again." });
  }
});

router.get("/recommendations", recommendationsLimiter, async (req, res) => {
  const productIds = validIds(String(req.query.productIds || "").split(","));
  const recentlyViewedIds = validIds(String(req.query.recentlyViewed || "").split(","));
  const productId = mongoose.isValidObjectId(req.query.productId) ? String(req.query.productId) : null;
  const seedIds = validIds([productId, ...productIds, ...recentlyViewedIds], 20);
  const userId = getOptionalUserId(req);

  try {
    const orderProductIdsPromise = userId && mongoose.isValidObjectId(userId)
      ? Order.find({ user: userId, paymentStatus: "paid" }).select("products.product").sort({ createdAt: -1 }).limit(20).lean()
      : Promise.resolve([]);
    const [seeds, recentProducts, orders] = await Promise.all([
      seedIds.length ? Product.find({ _id: { $in: seedIds } }).select("category").lean() : [],
      recentlyViewedIds.length ? Product.find({ _id: { $in: recentlyViewedIds } }).select("category").lean() : [],
      orderProductIdsPromise,
    ]);

    const purchasedIds = validIds(
      orders.flatMap((order) => order.products.map((item) => String(item.product || ""))),
      40,
    );
    const allSeedIds = validIds([...seedIds, ...purchasedIds], 40);
    const purchasedProducts = purchasedIds.length
      ? await Product.find({ _id: { $in: purchasedIds } }).select("category").lean()
      : [];
    const categories = [...new Set([...seeds, ...recentProducts].map((item) => item.category).filter(Boolean))];
    const purchasedCategories = [...new Set(purchasedProducts.map((item) => item.category).filter(Boolean))];
    const excludedIds = allSeedIds.map((id) => new mongoose.Types.ObjectId(id));

    const [similarProducts, frequentlyBoughtTogether, personalized] = await Promise.all([
      categories.length
        ? Product.find({ category: { $in: categories }, _id: { $nin: excludedIds }, stock: { $gt: 0 } })
          .select("-costPrice").sort({ averageRating: -1, stock: -1 }).limit(8).lean()
        : [],
      seedIds.length
        ? Order.aggregate([
          { $match: { paymentStatus: "paid", "products.product": { $in: seedIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
          { $unwind: "$products" },
          { $match: { "products.product": { $nin: seedIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
          { $group: { _id: "$products.product", frequency: { $sum: "$products.quantity" } } },
          { $sort: { frequency: -1 } },
          { $limit: 8 },
          { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
          { $unwind: "$product" },
          { $match: { "product.stock": { $gt: 0 } } },
          { $replaceRoot: { newRoot: "$product" } },
          { $project: { costPrice: 0 } },
        ])
        : [],
      purchasedCategories.length
        ? Product.find({ category: { $in: purchasedCategories }, _id: { $nin: excludedIds }, stock: { $gt: 0 } })
          .select("-costPrice").sort({ averageRating: -1, createdAt: -1 }).limit(8).lean()
        : [],
    ]);

    return res.json({ similarProducts, frequentlyBoughtTogether, personalized });
  } catch (error) {
    console.error("AI recommendations error:", error);
    return res.status(500).json({ message: "Recommendations are temporarily unavailable." });
  }
});

module.exports = router;
