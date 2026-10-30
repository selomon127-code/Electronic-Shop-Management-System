// backend/middleware/adminAuth.js
const User = require("../models/User");

exports.protectAdmin = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ message: "Not authorized. No token provided." });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin privileges required." });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Admin auth error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
