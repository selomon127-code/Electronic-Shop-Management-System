// backend/middleware/auth.js
const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "super_secret_key_12345_change_in_production",
    );

    console.log("🔍 Auth middleware - Decoded token:", decoded);

    // Attach user info to request (handle both 'id' and '_id' formats)
    req.userId = decoded.id || decoded._id || decoded.userId;
    req.user = decoded;

    console.log("✅ Auth middleware - User ID extracted:", req.userId);

    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Unauthorized: Token has expired" });
    }

    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = auth;
