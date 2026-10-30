// backend/routes/productRoutes.js
const router = require("express").Router();
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");

// ✅ GET all products (public)
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET single product by ID (public) - THIS IS THE MISSING ROUTE!
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("❌ Error fetching product:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ✅ CREATE product (admin only)
router.post("/", auth, upload.single("imageFile"), async (req, res) => {
  try {
    const { name, price, category, description, stock } = req.body;
    let imageUrl = "https://placehold.co/300x300/e2e8f0/64748b?text=No+Image";

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "ecommerce_products", resource_type: "image" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        stream.end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }

    const product = new Product({
      name,
      price,
      category,
      description,
      image: imageUrl,
      stock: stock || 0,
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error("❌ Create product error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ UPDATE product (admin only)
router.put("/:id", auth, upload.single("imageFile"), async (req, res) => {
  try {
    const { name, price, category, description, stock } = req.body;
    const updateData = {
      name,
      price,
      category,
      description,
      stock: stock || 0,
    };

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "ecommerce_products" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        stream.end(req.file.buffer);
      });
      updateData.image = result.secure_url;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json(updated);
  } catch (err) {
    console.error("❌ Update product error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ DELETE product (admin only)
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
