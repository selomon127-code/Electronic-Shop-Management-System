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

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");
      return res.status(500).json({ message: "Authentication is not configured." });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id || decoded._id || decoded.userId;
    req.user = decoded;

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
