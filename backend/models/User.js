// backend/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Don't return password in queries by default
    },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    address: {
      street: String,
      city: String,
      subcity: String,
      region: String,
      country: { type: String, default: "Ethiopia" },
      zip: String,
    },

    // 🔐 PASSWORD RESET FIELDS (NEW)
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// 🔐 Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// 🔐 Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 🔐 Generate password reset token
userSchema.methods.generateResetToken = function () {
  const crypto = require("crypto");

  // Generate random token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token before storing in DB
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expiration (1 hour from now)
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

  return resetToken; // Return unhashed token for email
};

module.exports = mongoose.model("User", userSchema);
