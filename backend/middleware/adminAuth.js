// backend/middleware/adminAuth.js
const User = require("../models/User");

const restrictTo = (...allowedRoles) => {
  if (
    allowedRoles.length === 0 ||
    allowedRoles.some((role) =>
      !["customer", "business_owner", "system_admin"].includes(role),
    )
  ) {
    throw new Error("restrictTo requires one or more valid user roles.");
  }

  return async (req, res, next) => {
    if (!req.userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    try {
      const user = await User.findById(req.userId).select("role");
      if (!user) {
        return res.status(401).json({ message: "Account is no longer available." });
      }

      req.user = user;
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "You do not have permission to access this resource." });
      }

      return next();
    } catch (error) {
      console.error("Role authorization error:", error);
      return res.status(500).json({ message: "Unable to verify account permissions." });
    }
  };
};

exports.restrictTo = restrictTo;
