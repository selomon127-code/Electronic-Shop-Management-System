const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const axios = require("axios");
const passport = require("passport");
const { sendLoginAlertEmail } = require("../utils/sendEmail");
require("passport-google-oauth20").Strategy;

const {
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require("../utils/sendEmail");
const notificationService = require("../services/notificationService");
const auth = require("../middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET;

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

const toUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// ✅ 1. REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const preferredLang = req.headers["accept-language"]?.split("-")[0] || "am";

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone: phone || "",
      role: "customer",
      authProvider: "local",
      preferredLanguage: preferredLang,
    });

    // ✅ Send welcome email (non-blocking)
    sendWelcomeEmail(newUser.email, newUser.name, preferredLang).catch(
      (err) => {
        console.error("❌ Welcome email failed in background:", err);
      },
    );

    // ✅ Send notification to admin
    await notificationService.userRegistered(newUser).catch((err) => {
      console.error("❌ User registration notification failed:", err);
    });

    res.status(201).json({
      message: "Registration successful",
      user: toUserResponse(newUser),
      token: signToken(newUser),
    });
  } catch (error) {
    console.error("❌ Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ 2. LOGIN ROUTE
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if email and password are provided
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide both email and password" });
    }

    // 2. Find user by email
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 3. Handle Google Auth accounts without password
    if (!user.password) {
      if (user.authProvider === "google" || user.googleId) {
        return res.status(400).json({
          useGoogle: true,
          message:
            "This account was created with Google. Please log in using the Google button.",
        });
      }
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 4. Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // ✅ 5. Capture Real IP & User Agent
    const ip =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "Unknown IP";
    const userAgent = req.headers["user-agent"] || "Unknown Device";

    // ✅ 6. Send login security alert in background (non-blocking)
    // pass user object, ip, and userAgent
    sendLoginAlertEmail(user, ip, userAgent).catch((err) => {
      console.error("❌ Login alert email failed:", err);
    });

    // 7. Send success response with token
    return res.json({
      message: "Login successful",
      user: toUserResponse(user),
      token: signToken(user),
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ message: "Server error during login" });
  }
});
// ✅ 3. FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.json({
        message: "If an account exists, a reset link has been sent.",
      });
    }

    const resetToken = user.generateResetToken();
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    console.log(`\n🔑 PASSWORD RESET LINK: ${resetUrl}\n`);

    const userLang =
      req.headers["accept-language"]?.split("-")[0] ||
      user.preferredLanguage ||
      "am";

    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl, userLang);
      console.log("✅ Email sent successfully");
    } catch (emailError) {
      console.log("⚠️ Email sending skipped/failed:", emailError.message);
    }

    res.json({
      message:
        "Password reset link generated. Check backend console for the link.",
      testResetUrl: resetUrl,
    });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ 4. RESET PASSWORD
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired password reset token." });
    }

    user.password = password;
    user.authProvider = "local";
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password updated successfully! You can now log in." });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ 5. GOOGLE OAUTH (CAPTCHA VERIFY)
router.post("/google/verify-captcha", async (req, res) => {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const captchaToken = req.body?.token;

  if (!secret) {
    return res.status(503).json({
      code: "recaptcha_secret_missing",
      message: "Google sign-in verification is not configured",
    });
  }
  if (typeof captchaToken !== "string" || !captchaToken) {
    return res.status(400).json({
      code: "recaptcha_token_invalid",
      message: "Complete the reCAPTCHA verification",
    });
  }

  try {
    const verification = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      new URLSearchParams({ secret, response: captchaToken }),
      {
        timeout: 10000,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    if (verification.data?.success !== true) {
      const errorCodes = Array.isArray(verification.data?.["error-codes"])
        ? verification.data["error-codes"].filter(
            (code) => typeof code === "string",
          )
        : [];
      console.warn("Google reCAPTCHA rejected verification:", errorCodes);

      if (
        errorCodes.includes("missing-input-secret") ||
        errorCodes.includes("invalid-input-secret")
      ) {
        return res.status(503).json({
          code: "recaptcha_secret_invalid",
          message: "The reCAPTCHA secret key is missing or invalid",
        });
      }
      if (errorCodes.includes("timeout-or-duplicate")) {
        return res.status(400).json({
          code: "recaptcha_token_expired",
          message: "The reCAPTCHA response expired or was already used",
        });
      }
      return res.status(400).json({
        code: "recaptcha_verify_failed",
        message: "reCAPTCHA verification failed",
      });
    }

    req.session.googleCaptchaVerified = true;
    req.session.save((error) => {
      if (error) {
        console.error("Google CAPTCHA session save failed:", error);
        return res
          .status(500)
          .json({ message: "Could not start Google sign-in" });
      }
      return res.json({ verified: true });
    });
  } catch (error) {
    console.error(
      "Google reCAPTCHA verification request failed:",
      error.message,
    );
    return res.status(502).json({
      code: "recaptcha_provider_error",
      message: "Could not verify reCAPTCHA with Google",
    });
  }
});

router.get("/google", (req, res, next) => {
  if (req.session?.googleCaptchaVerified !== true) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/login?error=recaptcha_required`,
    );
  }

  req.session.googleCaptchaVerified = false;
  req.session.save((error) => {
    if (error) {
      console.error("Google sign-in session save failed:", error);
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=server_error`,
      );
    }
    return passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
    })(req, res, next);
  });
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
  }),
  async (req, res) => {
    try {
      const token = jwt.sign(
        { id: req.user._id, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/google/success?token=${token}`,
      );
    } catch (error) {
      console.error("❌ Error during Google callback:", error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  },
);

// ✅ 6. GET CURRENT USER PROFILE
router.get("/me", auth, async (req, res) => {
  try {
    const userId = req.user ? req.user._id || req.user.id : req.userId;
    if (!userId)
      return res
        .status(401)
        .json({ message: "Unauthorized: No user ID found" });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("❌ Get user profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
