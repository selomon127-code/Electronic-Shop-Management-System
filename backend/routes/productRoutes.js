// backend/routes/productRoutes.js
const router = require("express").Router();
const Product = require("../models/Product");
const auth = require("../middleware/auth");

// GET all products (public)
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE product (admin only)
router.post("/", auth, async (req, res) => {
  try {
    const { name, price, category, description, image, stock } = req.body;
    const product = new Product({
      name,
      price,
      category,
      description,
      image,
      stock: stock || 0,
    });
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error("❌ Create product error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// UPDATE product (admin only)
router.put("/:id", auth, async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE product (admin only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
