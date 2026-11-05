const mongoose = require("mongoose");

const couponUserUsageSchema = new mongoose.Schema(
  {
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uses: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true },
);

couponUserUsageSchema.index({ coupon: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("CouponUserUsage", couponUserUsageSchema);
