// backend/middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

// 🔹 Login Rate Limit: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per window
  message: {
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔹 Password Reset Rate Limit: 3 requests per hour
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 reset requests per hour
  message: {
    message: "Too many password reset requests. Please try again in an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔹 Registration Rate Limit: 3 accounts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    message:
      "Too many registration attempts from this network. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  resetPasswordLimiter,
  registerLimiter,
};
