require("dotenv").config();
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be configured before starting the backend.");
}
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");

// ✅ Initialize passport config
require("./config/passport");

// Import routes
const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orders");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/users");
const paymentRoutes = require("./routes/payment");
const adminRoutes = require("./routes/admin");
const wishlistRoutes = require("./routes/wishlist");
const reviewRoutes = require("./routes/reviews");
const aiRoutes = require("./routes/ai");
const aiCustomerRoutes = require("./routes/aiCustomer");
const aiChatRoutes = require("./routes/aiChat");
const healthRoutes = require("./routes/health");
const couponRoutes = require("./routes/coupons");
const notificationRoutes = require("./routes/notifications");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ 1. Production-Ready CORS
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL, "https://yourdomain.com"]
    : [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://10.139.191.60:5173",
        "http://10.139.191.60:5174",
      ];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error("CORS not allowed"), false);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);

// ✅ 2. Session (Required for Passport Google OAuth)
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

// ✅ 3. Passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ 4. BODY PARSERS (MUST BE BEFORE ALL ROUTES!)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check
app.get("/", (req, res) => res.json({ message: "API running 🚀" }));

// ✅ 5. ROUTES (Fixed AI routing order!)
app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);

// ✅ AI Routes (Both mounted at /api/ai)
app.use("/api/ai", aiCustomerRoutes);
app.use("/api/ai", aiChatRoutes);
app.use("/api/ai", aiRoutes); // Handles POST /api/ai/generate-product-description
app.use("/api/notifications", notificationRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

module.exports = app;
