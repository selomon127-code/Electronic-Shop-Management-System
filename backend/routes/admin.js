// backend/routes/admin.js
const router = require("express").Router();
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const { protectAdmin } = require("../middleware/adminAuth");
const { sendStatusUpdateEmail } = require("../utils/sendEmail");

console.log("🔧 Loading admin routes...");

// ✅ All admin routes require auth + admin role
router.use(auth);
router.use(protectAdmin);

// ============================================
// DASHBOARD
// ============================================

// GET /admin/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    console.log("📊 Admin dashboard request from:", req.user?.email);

    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalProducts = await Product.countDocuments();
    const totalAdmins = await User.countDocuments({ role: "admin" });

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
        totalAdmins,
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
    order.status = status;
    await order.save();

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

    if (!["user", "admin"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Invalid role. Must be 'user' or 'admin'" });
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
      category,
      stock,
      image,
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" });
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
      category: category || "Uncategorized",
      stock: parseInt(stock) || 0,
      image: imageUrl,
    });

    await product.save();

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
      category,
      stock,
      image,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
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
    product.category = category || product.category;
    product.stock = stock !== undefined ? parseInt(stock) : product.stock;
    product.image = imageUrl;

    await product.save();

    console.log("✅ Product updated:", product.name);

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

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
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
