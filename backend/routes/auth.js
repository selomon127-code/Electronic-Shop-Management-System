const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require("../utils/sendEmail");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

const auth = require("../middleware/auth");
const passport = require("passport");
require("passport-google-oauth20").Strategy;

const toUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// ... inside your POST /register route ...
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

    // ✅ Read preferred language from headers (default to 'am')
    const preferredLang = req.headers["accept-language"]?.split("-")[0] || "am";

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone: phone || "",

      role: "user",
      authProvider: "local",
      preferredLanguage: preferredLang, // ✅ Save user's language preference
    });

    // ✅ SEND WELCOME EMAIL (Non-blocking, so it doesn't delay the response)
    sendWelcomeEmail(newUser.email, newUser.name, preferredLang).catch(
      (err) => {
        console.error("❌ Welcome email failed in background:", err);
      },
    );

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      token: jwt.sign(
        { id: newUser._id, role: newUser.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      ),
    });
  } catch (error) {
    console.error("❌ Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// ✅ 2. LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(
      "🔍 Login attempt - Email:",
      email,
      "| Password length:",
      password?.length,
    );

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

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

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      user: toUserResponse(user),
      token: signToken(user),
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error" });
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

// ✅ 5. GOOGLE OAUTH
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  }),
);

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
