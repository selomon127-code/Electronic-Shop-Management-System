const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
      match: /^[A-Z0-9_-]+$/,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0.01,
      validate: {
        validator(value) {
          return this.type !== "percentage" || value <= 100;
        },
        message: "Percentage coupons cannot exceed 100%",
      },
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    maxDiscount: {
      type: Number,
      min: 0.01,
      default: null,
    },
    minimumSubtotal: {
      type: Number,
      min: 0,
      default: 0,
    },
    startsAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    usageLimit: {
      type: Number,
      min: 1,
      default: null,
    },
    perUserLimit: {
      type: Number,
      min: 1,
      default: null,
    },
    usageCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    allowedUsers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    applicableCategories: {
      type: [String],
      default: [],
    },
    applicableProducts: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Product",
      default: [],
    },
  },
  { timestamps: true },
);

couponSchema.pre("save", function () {
  if (this.isModified("status")) {
    this.isActive = this.status === "Active";
  } else if (this.isModified("isActive")) {
    this.status = this.isActive ? "Active" : "Inactive";
  }
});

module.exports = mongoose.model("Coupon", couponSchema);
