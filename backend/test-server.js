// backend/test-server.js - SUPER MINIMAL TEST SERVER
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(express.json());

// ✅ Minimal User model inline (no separate file needed for test)
const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: "user" },
  },
  { timestamps: true },
);
const User = mongoose.model("User", UserSchema);

// ✅ Test route
app.get("/", (req, res) => res.json({ message: "✅ Minimal API running 🚀" }));

// ✅ Minimal REGISTER route (can't fail with "next is not a function")
app.post("/api/auth/register", async (req, res) => {
  console.log("🚀 POST /api/auth/register - Body:", req.body);

  try {
    const { name, email, password, role } = req.body;

    // Simple validation
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password required" });
    }

    // Check if user exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "user",
    });

    await user.save();
    console.log("✅ User saved:", user._id);

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "test_secret",
      { expiresIn: "1h" },
    );

    // ✅ Return response WITH role field
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role, // ✅ CRITICAL: Return role!
      },
    });
  } catch (err) {
    // ✅ Log FULL error so you can see what's wrong
    console.error("❌❌❌ REGISTER ERROR ❌❌❌", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Minimal LOGIN route
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "test_secret",
      { expiresIn: "1h" },
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role, // ✅ Return role!
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Connect to MongoDB THEN start server
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/first_react_test",
  )
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`🚀 Minimal test server running on port ${PORT}`);
      console.log(`🔗 Test: curl http://localhost:${PORT}/`);
      console.log(
        `🔗 Register: POST http://localhost:${PORT}/api/auth/register`,
      );
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });
