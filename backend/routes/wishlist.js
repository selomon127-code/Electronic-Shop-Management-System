// backend/routes/wishlist.js
const router = require("express").Router();
const Wishlist = require("../models/Wishlist");
const auth = require("../middleware/auth");

// ✅ All wishlist routes require authentication
router.use(auth);

// 🔹 GET /wishlist - Get user's wishlist
router.get("/", async (req, res) => {
  try {
    console.log("📥 GET /wishlist - User ID:", req.userId);

    let wishlist = await Wishlist.findOne({ user: req.userId });

    if (!wishlist) {
      console.log("⚠️ No wishlist found, returning empty");
      return res.json({ user: req.userId, products: [] });
    }

    console.log("✅ Found wishlist with", wishlist.products.length, "items");
    res.json(wishlist);
  } catch (err) {
    console.error("❌ Get wishlist error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🔹 POST /wishlist - Add product to wishlist
router.post("/", async (req, res) => {
  try {
    console.log("📥 POST /wishlist - Request body:", req.body);

    const { productId, name, price, image, category, description, stock } =
      req.body;

    if (!productId || !name || !price) {
      console.log("❌ Missing required fields");
      return res.status(400).json({
        message: "Product ID, name, and price are required",
      });
    }

    let wishlist = await Wishlist.findOne({ user: req.userId });

    if (!wishlist) {
      console.log("📝 Creating new wishlist for user:", req.userId);
      wishlist = new Wishlist({
        user: req.userId,
        products: [
          {
            productId,
            name,
            price,
            image:
              image ||
              "https://via.placeholder.com/300x300/667eea/ffffff?text=No+Image",
            category: category || "",
            description: description || "",
            stock: stock || 0,
          },
        ],
      });
    } else {
      // Check if product already in wishlist
      const exists = wishlist.products.some((p) => p.productId === productId);

      if (exists) {
        console.log("⚠️ Product already in wishlist");
        return res.status(400).json({ message: "Product already in wishlist" });
      }

      wishlist.products.push({
        productId,
        name,
        price,
        image:
          image ||
          "https://via.placeholder.com/300x300/667eea/ffffff?text=No+Image",
        category: category || "",
        description: description || "",
        stock: stock || 0,
      });
    }

    await wishlist.save();
    console.log("✅ Product added to wishlist successfully");

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
router.delete("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    console.log("🗑️ Removing product from wishlist:", productId);

    const wishlist = await Wishlist.findOne({ user: req.userId });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    wishlist.products = wishlist.products.filter(
      (p) => p.productId !== productId,
    );
    await wishlist.save();

    console.log("✅ Product removed from wishlist");
    res.json({ message: "Product removed from wishlist", wishlist });
  } catch (err) {
    console.error("❌ Remove from wishlist error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🔹 DELETE /wishlist - Clear entire wishlist
router.delete("/", async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({ user: req.userId });
    console.log("✅ Wishlist cleared");
    res.json({ message: "Wishlist cleared", wishlist: { products: [] } });
  } catch (err) {
    console.error("❌ Clear wishlist error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
