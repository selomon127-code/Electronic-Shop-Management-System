// backend/routes/auth.js
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendPasswordResetEmail } = require("../utils/sendEmail");

// 🔹 POST /register - Register new user (YOUR EXISTING CODE)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, password required" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role === "admin" ? "admin" : "user",
    });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(201).json({
      message: "User registered",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Register error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🔹 POST /login - Login user (YOUR EXISTING CODE)
// backend/routes/auth.js - UPDATE THE LOGIN ROUTE:

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    const normalizedEmail = email.trim().toLowerCase();

    // ✅ FIX: Use .select("+password") to include the password field
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Now user.password is defined ✅
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// 🔹 POST /forgot-password - Request password reset (NEW)
// backend/routes/auth.js - UPDATE THE /forgot-password ROUTE:

router.post("/forgot-password", async (req, res) => {
  try {
    console.log("🔍 Forgot password request received:", req.body);

    const { email } = req.body;

    if (!email) {
      console.log("❌ Email missing in request");
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log("🔍 Looking for user with email:", normalizedEmail);

    const user = await User.findOne({ email: normalizedEmail });
    console.log("🔍 User found:", !!user);

    if (user) {
      console.log("🔍 Generating reset token for user:", user._id);

      const crypto = require("crypto");

      const resetToken = crypto.randomBytes(32).toString("hex");
      console.log(
        "🔍 Generated reset token (first 10 chars):",
        resetToken.slice(0, 10),
      );

      user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
      console.log(
        "🔍 Token expiry set to:",
        new Date(user.resetPasswordExpire),
      );

      await user.save();
      console.log("✅ User saved with reset token");

      const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5174"}/reset-password/${resetToken}`;
      console.log("🔍 Reset link generated:", resetLink);

      // ✅ FIX: Use the TOP-LEVEL import (remove the inner require)
      console.log(
        "🔍 sendPasswordResetEmail function:",
        typeof sendPasswordResetEmail,
      );

      // ✅ Call the function from top-level import
      sendPasswordResetEmail(user.email, user.name, resetLink)
        .then((result) => console.log("✅ Email send result:", result))
        .catch((err) =>
          console.error("❌ Failed to send reset email:", err.message),
        );
    }

    console.log(
      "✅ Sending success response (security: same message for all emails)",
    );
    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (err) {
    console.error("❌❌❌ FORGOT PASSWORD ERROR ❌❌❌", {
      name: err.name,
      message: err.message,
      stack: err.stack,
      body: req.body,
    });
    res.status(500).json({
      message: "Server error",
      error: err.message,
      hint: "Check backend terminal for full error details",
    });
  }
});
// 🔹 POST /reset-password/:token - Reset password with token (NEW)
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    // Validate input
    if (!newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "New password and confirmation are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid, unexpired token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() }, // Token not expired
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Update password (User model pre-save hook will hash it)
    user.password = newPassword;

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // Generate new auth token for auto-login after reset
    const authToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Password reset successfully",
      token: authToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Reset password error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
