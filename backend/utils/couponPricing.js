const Coupon = require("../models/Coupon");
const CouponRedemption = require("../models/CouponRedemption");
const CouponUserUsage = require("../models/CouponUserUsage");
const mongoose = require("mongoose");

const getCouponDiscount = (coupon, subtotal) => {
  if (coupon.type === "percentage") {
    const discount = (subtotal * coupon.value) / 100;
    return Number(
      Math.min(discount, coupon.maxDiscount ?? discount, subtotal).toFixed(2),
    );
  }

  return Number(Math.min(coupon.value, subtotal).toFixed(2));
};

const getShippingFee = (subtotal) => (subtotal > 5000 ? 0 : 150);

const decrementCouponUsage = async (couponId, userId) => {
  await Promise.all([
    Coupon.updateOne(
      { _id: couponId, usageCount: { $gt: 0 } },
      { $inc: { usageCount: -1 } },
    ),
    CouponUserUsage.updateOne(
      { coupon: couponId, user: userId, uses: { $gt: 0 } },
      { $inc: { uses: -1 } },
    ),
  ]);
};

const claimCoupon = async (coupon, userId, orderId, now = new Date()) => {
  const couponId = coupon._id;
  const globalUsageFilter = {
    _id: couponId,
    isActive: true,
    $or: [{ startsAt: null }, { startsAt: { $lte: now } }],
    $and: [
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
      {
        $expr: {
          $or: [
            { $eq: [{ $ifNull: ["$usageLimit", null] }, null] },
            { $lt: ["$usageCount", "$usageLimit"] },
          ],
        },
      },
    ],
  };
  const globalClaim = await Coupon.findOneAndUpdate(
    globalUsageFilter,
    { $inc: { usageCount: 1 } },
    { new: true },
  );
  if (!globalClaim) return null;

  const userFilter = { coupon: couponId, user: userId };
  if (coupon.perUserLimit) userFilter.uses = { $lt: coupon.perUserLimit };
  let userUsage = null;
  try {
    userUsage = await CouponUserUsage.findOneAndUpdate(
      userFilter,
      { $inc: { uses: 1 } },
      { new: true },
    );

    if (!userUsage) {
      try {
        userUsage = await CouponUserUsage.create({
          coupon: couponId,
          user: userId,
          uses: 1,
        });
      } catch (error) {
        if (error.code !== 11000) throw error;

        userUsage = await CouponUserUsage.findOneAndUpdate(
          userFilter,
          { $inc: { uses: 1 } },
          { new: true },
        );
      }
    }

    if (!userUsage) {
      await Coupon.updateOne(
        { _id: couponId, usageCount: { $gt: 0 } },
        { $inc: { usageCount: -1 } },
      );
      return null;
    }

    await CouponRedemption.create({
      coupon: couponId,
      user: userId,
      order: orderId,
    });
    return globalClaim;
  } catch (error) {
    if (userUsage) {
      await decrementCouponUsage(couponId, userId);
    } else {
      await Coupon.updateOne(
        { _id: couponId, usageCount: { $gt: 0 } },
        { $inc: { usageCount: -1 } },
      );
    }
    throw error;
  }
};

const releaseCoupon = async (couponId, userId, orderId) => {
  const redemption = await CouponRedemption.findOneAndDelete({
    coupon: couponId,
    user: userId,
    order: orderId,
  });
  if (!redemption) return null;

  await decrementCouponUsage(couponId, userId);
  return redemption;
};

const getCouponStatusMessage = async (coupon, userId, subtotal, now = new Date(), options = {}) => {
  const isActive = coupon.status ? coupon.status === "Active" : coupon.isActive;
  if (!isActive || coupon.isActive === false) return "This coupon is inactive.";
  if (coupon.startsAt && coupon.startsAt > now) {
    return "This coupon is not active yet.";
  }
  if (coupon.expiresAt && coupon.expiresAt <= now) {
    return "This coupon has expired.";
  }
  if (subtotal < coupon.minimumSubtotal) {
    return `Add ${(coupon.minimumSubtotal - subtotal).toFixed(2)} ETB to use this coupon.`;
  }
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return "This coupon has reached its usage limit.";
  }
  if (coupon.perUserLimit && userId) {
    const userUsage = await CouponUserUsage.findOne({
      coupon: coupon._id,
      user: new mongoose.Types.ObjectId(userId),
    });
    if (userUsage?.uses >= coupon.perUserLimit) {
      return "You have reached this coupon's usage limit.";
    }
  }
  if (Array.isArray(coupon.allowedUsers) && coupon.allowedUsers.length > 0) {
    if (!userId || !coupon.allowedUsers.some((u) => String(u) === String(userId))) {
      return "This coupon is not available for your account.";
    }
  }
  if (Array.isArray(coupon.applicableCategories) && coupon.applicableCategories.length > 0 && options.categories) {
    const hasCategory = options.categories.some((cat) =>
      coupon.applicableCategories.map((c) => String(c).toLowerCase()).includes(String(cat).toLowerCase()),
    );
    if (!hasCategory) {
      return "This coupon does not apply to the items in your cart.";
    }
  }
  if (Array.isArray(coupon.applicableProducts) && coupon.applicableProducts.length > 0 && options.productIds) {
    const hasProduct = options.productIds.some((pId) =>
      coupon.applicableProducts.some((cp) => String(cp) === String(pId)),
    );
    if (!hasProduct) {
      return "This coupon does not apply to the items in your cart.";
    }
  }
  return null;
};

module.exports = {
  claimCoupon,
  getCouponDiscount,
  getCouponStatusMessage,
  getShippingFee,
  releaseCoupon,
};
