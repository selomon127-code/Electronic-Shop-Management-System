// backend/controllers/authController.js
const User = require("../models/User");
const { generateAuthToken } = require("../utils/generateToken");
const { sendPasswordResetEmail } = require("../utils/sendEmail");
const crypto = require("crypto");

/**
 * POST /api/auth/register - Register new user
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide name, email, and password" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: "user",
    });

    // Generate auth token
    const token = generateAuthToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
      token,
    });
  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * POST /api/auth/login - Login user
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // Find user with password
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate auth token
    const token = generateAuthToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: "Login successful",
      user: userResponse,
      token,
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * POST /api/auth/forgot-password - Request password reset
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res
        .status(400)
        .json({ message: "Please provide an email address" });
    }

    // Find user (don't reveal if email exists - security best practice)
    const user = await User.findOne({ email });

    // If user exists, generate reset token and send email
    if (user) {
      // Generate reset token (unhashed, for email)
      const resetToken = user.generateResetToken();
      await user.save(); // Save hashed token + expiry to DB

      // Create reset link
      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

      // Send email (async - don't block response)
      sendPasswordResetEmail(user.email, user.name, resetLink).catch((err) =>
        console.error("❌ Failed to send reset email:", err.message),
      );
    }

    // Always return same response (prevent user enumeration)
    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (err) {
    console.error("❌ Forgot password error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * POST /api/auth/reset-password/:token - Reset password with token
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    // Validate input
    if (!newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "Please provide new password and confirmation" });
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

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate new auth token for auto-login
    const authToken = generateAuthToken(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: "Password reset successfully",
      user: userResponse,
      token: authToken,
    });
  } catch (err) {
    console.error("❌ Reset password error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * GET /api/auth/me - Get current user (protected)
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("❌ Get me error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
