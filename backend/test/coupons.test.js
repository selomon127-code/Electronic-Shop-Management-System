const assert = require("node:assert/strict");
const { afterEach, test, mock } = require("node:test");
const express = require("express");
const jwt = require("jsonwebtoken");
const Coupon = require("../models/Coupon");
const CouponUserUsage = require("../models/CouponUserUsage");
const couponRoutes = require("../routes/coupons");

const originalJwtSecret = process.env.JWT_SECRET;
const originalCouponFind = Coupon.find;
const originalUsageFind = CouponUserUsage.find;

afterEach(() => {
  Coupon.find = originalCouponFind;
  CouponUserUsage.find = originalUsageFind;
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
  mock.restoreAll();
});

test("GET /available excludes exhausted global coupons and personal limits", async () => {
  process.env.JWT_SECRET = "coupon-test-secret";
  const coupons = [
    {
      _id: "507f1f77bcf86cd799439011",
      code: "SAVE20",
      type: "percentage",
      value: 20,
      minimumSubtotal: 2000,
      usageLimit: 10,
      usageCount: 2,
      perUserLimit: 1,
      expiresAt: null,
    },
    {
      _id: "507f1f77bcf86cd799439012",
      code: "SOLDOUT",
      type: "fixed",
      value: 100,
      usageLimit: 4,
      usageCount: 4,
      perUserLimit: null,
    },
    {
      _id: "507f1f77bcf86cd799439013",
      code: "WELCOME",
      type: "fixed",
      value: 50,
      minimumSubtotal: 0,
      usageLimit: null,
      usageCount: 20,
      perUserLimit: null,
      expiresAt: null,
    },
  ];
  let couponFilter;
  let usageFilter;
  mock.method(Coupon, "find", (filter) => {
    couponFilter = filter;
    return {
      select: () => ({
        sort: () => ({ lean: async () => coupons }),
      }),
    };
  });
  mock.method(CouponUserUsage, "find", (filter) => {
    usageFilter = filter;
    return {
      select: () => ({
        lean: async () => [{ coupon: coupons[0]._id, uses: 1 }],
      }),
    };
  });

  const app = express();
  app.use(couponRoutes);
  const server = app.listen(0);
  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const url = `http://127.0.0.1:${server.address().port}/available`;
    const publicResponse = await fetch(url);
    assert.equal(publicResponse.status, 200);
    const publicData = await publicResponse.json();
    assert.deepEqual(
      publicData.coupons.map((coupon) => coupon.code),
      ["SAVE20", "WELCOME"],
    );
    // Verify private administrative fields are never leaked
    assert.equal(publicData.coupons[0].usageLimit, undefined);
    assert.equal(publicData.coupons[0].usageCount, undefined);
    assert.equal(publicData.coupons[0].perUserLimit, undefined);
    assert.equal(couponFilter.isActive, true);
    assert.equal(couponFilter.$and.length, 2);

    const userId = "507f1f77bcf86cd799439099";
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
    const userResponse = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(userResponse.status, 200);
    assert.deepEqual(
      (await userResponse.json()).coupons.map((coupon) => coupon.code),
      ["WELCOME"],
    );
    assert.equal(usageFilter.user, userId);

    // Verify subtotal filter: when cart subtotal is 1500, SAVE20 (min 2000) should be excluded
    const subtotalResponse = await fetch(`${url}?subtotal=1500`);
    assert.equal(subtotalResponse.status, 200);
    assert.deepEqual(
      (await subtotalResponse.json()).coupons.map((c) => c.code),
      ["WELCOME"],
    );
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("GET /available filters by user restrictions and status", async () => {
  process.env.JWT_SECRET = "coupon-test-secret";
  const userIdA = "507f1f77bcf86cd7994390aa";
  const userIdB = "507f1f77bcf86cd7994390bb";
  const coupons = [
    {
      _id: "507f1f77bcf86cd799439021",
      code: "VIPONLY",
      type: "percentage",
      value: 25,
      minimumSubtotal: 0,
      status: "Active",
      allowedUsers: [userIdA],
    },
    {
      _id: "507f1f77bcf86cd799439022",
      code: "INACTIVE",
      type: "percentage",
      value: 15,
      minimumSubtotal: 0,
      status: "Inactive",
    },
  ];

  mock.method(Coupon, "find", () => ({
    select: () => ({
      sort: () => ({ lean: async () => coupons }),
    }),
  }));
  mock.method(CouponUserUsage, "find", () => ({
    select: () => ({
      lean: async () => [],
    }),
  }));

  const app = express();
  app.use(couponRoutes);
  const server = app.listen(0);
  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const url = `http://127.0.0.1:${server.address().port}/available`;

    // Unauthenticated request should NOT see VIPONLY (user restricted) or INACTIVE
    const publicResponse = await fetch(url);
    const publicData = await publicResponse.json();
    assert.deepEqual(publicData.coupons, []);

    // User B should NOT see VIPONLY
    const tokenB = jwt.sign({ id: userIdB }, process.env.JWT_SECRET);
    const respB = await fetch(url, { headers: { Authorization: `Bearer ${tokenB}` } });
    assert.deepEqual((await respB.json()).coupons, []);

    // User A SHOULD see VIPONLY
    const tokenA = jwt.sign({ id: userIdA }, process.env.JWT_SECRET);
    const respA = await fetch(url, { headers: { Authorization: `Bearer ${tokenA}` } });
    const dataA = await respA.json();
    assert.equal(dataA.coupons.length, 1);
    assert.equal(dataA.coupons[0].code, "VIPONLY");
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
