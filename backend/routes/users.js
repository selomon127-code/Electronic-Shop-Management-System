// backend/routes/users.js
const router = require("express").Router();
const User = require("../models/User");
const Order = require("../models/Order");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// ✅ Auth middleware
const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ✅ Admin middleware
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No token provided" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    const user = await User.findById(req.userId).select("role");
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ============================================
// ADMIN ROUTES
// ============================================

// ✅ GET all users (admin only)
router.get("/", adminAuth, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ DELETE user (admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ UPDATE user role (admin only)
router.put("/:id/role", adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true },
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Role updated", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ============================================
// USER PROFILE ROUTES (authenticated users)
// ============================================

// 🔹 GET /users/profile - Get current user's profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("❌ Get profile error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🔹 PUT /users/profile - Update profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    console.log("✅ Profile updated for:", user.email);

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Update profile error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🔹 POST /users/change-password - Change password
router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.userId).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.authProvider === "google") {
      return res.status(400).json({
        message: "Cannot change password for Google accounts",
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    console.log("✅ Password changed for:", user.email);

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("❌ Change password error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🔹 GET /users/orders - Get user's order history
router.get("/orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .populate("products.product", "name image price");

    res.json(orders);
  } catch (err) {
    console.error("❌ Get orders error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🔹 GET /users/addresses - Get all addresses
router.get("/addresses", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("addresses");
    res.json(user.addresses || []);
  } catch (err) {
    console.error("❌ Get addresses error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🔹 POST /users/addresses - Add new address
router.post("/addresses", auth, async (req, res) => {
  try {
    const {
      label,
      street,
      city,
      subcity,
      region,
      country,
      zip,
      phone,
      isDefault,
    } = req.body;

    if (!street || !city) {
      return res.status(400).json({ message: "Street and city are required" });
    }

    const user = await User.findById(req.userId);

    if (isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    user.addresses.push({
      label: label || "Home",
      street,
      city,
      subcity: subcity || "",
      region: region || "",
      country: country || "Ethiopia",
      zip: zip || "",
      phone: phone || user.phone || "",
      isDefault: isDefault || user.addresses.length === 0,
    });

    await user.save();

    console.log("✅ Address added for:", user.email);

    res.status(201).json({
      message: "Address added successfully",
      addresses: user.addresses,
    });
  } catch (err) {
    console.error("❌ Add address error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🔹 PUT /users/addresses/:addressId - Update address
router.put("/addresses/:addressId", auth, async (req, res) => {
  try {
    const {
      label,
      street,
      city,
      subcity,
      region,
      country,
      zip,
      phone,
      isDefault,
    } = req.body;

    const user = await User.findById(req.userId);
    const address = user.addresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    if (isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    address.label = label || address.label;
    address.street = street || address.street;
    address.city = city || address.city;
    address.subcity = subcity !== undefined ? subcity : address.subcity;
    address.region = region !== undefined ? region : address.region;
    address.country = country || address.country;
    address.zip = zip !== undefined ? zip : address.zip;
    address.phone = phone !== undefined ? phone : address.phone;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    await user.save();

    console.log("✅ Address updated for:", user.email);

    res.json({ message: "Address updated", addresses: user.addresses });
  } catch (err) {
    console.error("❌ Update address error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🔹 DELETE /users/addresses/:addressId - Delete address
router.delete("/addresses/:addressId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const address = user.addresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    user.addresses.pull(req.params.addressId);
    await user.save();

    console.log("✅ Address deleted for:", user.email);

    res.json({ message: "Address deleted", addresses: user.addresses });
  } catch (err) {
    console.error("❌ Delete address error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
