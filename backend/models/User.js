const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Address sub-schema
const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home" },
    street: { type: String, required: true },
    city: { type: String, required: true },
    subcity: { type: String, default: "" },
    region: { type: String, default: "" },
    country: { type: String, default: "Ethiopia" },
    zip: { type: String, default: "" },
    phone: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      minlength: 6,
      select: false, // must use .select("+password") when you need it
    },
    phone: { type: String, trim: true, default: "" },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    addresses: [addressSchema],

    // Google OAuth fields
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String, default: "" },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // Password reset fields
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // ✅ Multi-language support: User's preferred language (default: Amharic 'am')
    preferredLanguage: {
      type: String,
      default: "am",
      enum: ["en", "am", "om", "ti"],
    },
  },
  { timestamps: true },
);

// Hash password only when it was set/changed
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password (requires password to be selected on the document)
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token (returns the raw token; stores the hash)
userSchema.methods.generateResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
