// backend/routes/productRoutes.js
const router = require("express").Router();
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary"); // ✅ Import cloudinary
const Review = require("../models/Review");

// ... (keep your GET routes exactly as they are) ...
// ✅ GET reviews for a specific product
router.get("/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error("❌ Get reviews error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ CREATE product (admin only) - UPLOADS TO CLOUDINARY
router.post("/", auth, upload.single("imageFile"), async (req, res) => {
  try {
    const { name, price, category, description, stock } = req.body;

    let imageUrl = "https://placehold.co/300x300/e2e8f0/64748b?text=No+Image";

    // ✅ If a file was uploaded, send it to Cloudinary
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

      // Cloudinary returns a secure URL we can save to the database
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

// ... (keep your PUT and DELETE routes exactly as they are) ...

module.exports = router;
