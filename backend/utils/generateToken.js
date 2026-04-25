// backend/utils/generateToken.js
const jwt = require("jsonwebtoken");

/**
 * Generate JWT token for auth
 */
exports.generateAuthToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d", // Token valid for 7 days
  });
};

/**
 * Generate secure password reset token (not JWT)
 */
exports.generateResetToken = () => {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
};
