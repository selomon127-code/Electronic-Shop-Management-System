const assert = require("node:assert/strict");
const { afterEach, test, mock } = require("node:test");
const express = require("express");
const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const User = require("../models/User");
const orderRoutes = require("../routes/orders");
const { canAccessOrderReceipt, receiptStatus } = require("../utils/orderReceipt");

const originalJwtSecret = process.env.JWT_SECRET;
const ORDER_ID = "507f1f77bcf86cd799439011";
const OWNER_ID = "507f1f77bcf86cd799439099";
const OTHER_ID = "507f1f77bcf86cd799439088";

function sampleOrder(overrides = {}) {
  const order = {
    _id: ORDER_ID,
    user: OWNER_ID,
    products: [
      { name: "Wireless Earbuds", price: 1000, quantity: 2 },
    ],
    subtotal: 2000,
    shippingFee: 150,
    coupon: { code: "SAVE10", discount: 100 },
    tax: 0,
    shippingAddress: {
      fullName: "Abebe Kebede",
      street: "Cameroon Street",
      subcity: "Bole",
      city: "Addis Ababa",
      phone: "0911000000",
    },
    totalPrice: 2050,
    paymentStatus: "paid",
    status: "processing",
    createdAt: new Date("2026-11-05T10:00:00.000Z"),
    async populate() {
      this.user = {
        _id: OWNER_ID,
        name: "Abebe Kebede",
        email: "abebe@example.com",
      };
      return this;
    },
    ...overrides,
  };
  return order;
}

function tokenFor(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET);
}

function pdfPlainText(bytes) {
  const source = Buffer.from(bytes).toString("latin1");
  return Array.from(source.matchAll(/<([0-9A-Fa-f]+)>/g))
    .map((match) => Buffer.from(match[1], "hex").toString("latin1"))
    .join("");
}

async function startServer() {
  const app = express();
  app.use("/api/orders", orderRoutes);
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  return {
    server,
    base: `http://127.0.0.1:${server.address().port}`,
  };
}

afterEach(() => {
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
  mock.restoreAll();
});

test("receipt status maps pending, paid, and delivered orders", () => {
  assert.equal(receiptStatus({ status: "pending", paymentStatus: "pending" }), "PENDING");
  assert.equal(receiptStatus({ status: "pending_payment", paymentStatus: "pending" }), "PENDING");
  assert.equal(receiptStatus({ status: "processing", paymentStatus: "paid" }), "PAID");
  assert.equal(receiptStatus({ status: "delivered", paymentStatus: "paid" }), "DELIVERED");
});

test("customers can read only their own receipts and staff can read any receipt", () => {
  const order = { user: OWNER_ID };
  assert.equal(canAccessOrderReceipt(order, { _id: OWNER_ID, role: "customer" }), true);
  assert.equal(canAccessOrderReceipt(order, { _id: OTHER_ID, role: "customer" }), false);
  assert.equal(canAccessOrderReceipt(order, { _id: OTHER_ID, role: "business_owner" }), true);
  assert.equal(canAccessOrderReceipt(order, { _id: OTHER_ID, role: "system_admin" }), true);
});

test("GET /api/orders/:id/receipt rejects missing and foreign access", async () => {
  process.env.JWT_SECRET = "receipt-test-secret";
  const orders = new Map([[ORDER_ID, sampleOrder()]]);
  mock.method(Order, "findById", async (id) => orders.get(String(id)) || null);
  mock.method(User, "findById", (id) => ({
    select: async () => ({ _id: id, role: "customer" }),
  }));

  const { server, base } = await startServer();
  try {
    const missingAuth = await fetch(`${base}/api/orders/${ORDER_ID}/receipt`);
    assert.equal(missingAuth.status, 401);

    const unknown = await fetch(`${base}/api/orders/507f1f77bcf86cd799439012/receipt`, {
      headers: { Authorization: `Bearer ${tokenFor(OWNER_ID)}` },
    });
    assert.equal(unknown.status, 404);

    const forbidden = await fetch(`${base}/api/orders/${ORDER_ID}/receipt`, {
      headers: { Authorization: `Bearer ${tokenFor(OTHER_ID)}` },
    });
    assert.equal(forbidden.status, 403);
  } finally {
    server.close();
  }
});

test("GET /api/orders/:id/receipt streams a PDF for the owner and for staff", async () => {
  process.env.JWT_SECRET = "receipt-test-secret";
  mock.method(Order, "findById", async () => sampleOrder());
  let role = "customer";
  let userId = OWNER_ID;
  mock.method(User, "findById", () => ({
    select: async () => ({ _id: userId, role }),
  }));

  const { server, base } = await startServer();
  try {
    for (const nextRole of ["customer", "business_owner", "system_admin"]) {
      role = nextRole;
      userId = role === "customer" ? OWNER_ID : OTHER_ID;

      const response = await fetch(`${base}/api/orders/${ORDER_ID}/receipt`, {
        headers: { Authorization: `Bearer ${tokenFor(userId)}` },
      });
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type") || "", /application\/pdf/);
      assert.match(
        response.headers.get("content-disposition") || "",
        /attachment;\s*filename="Receipt_439011\.pdf"/,
      );

      const bytes = Buffer.from(await response.arrayBuffer());
      const pdf = pdfPlainText(bytes);
      assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
      assert.match(pdf, /Electronic Shop Ethiopia/);
      assert.match(pdf, /#439011/);
      assert.match(pdf, /Wireless Earbuds/);
      assert.match(pdf, /Abebe Kebede/);
      assert.match(pdf, /abebe@example.com/);
      assert.match(pdf, /Cameroon Street, Bole, Addis Ababa/);
      assert.match(pdf, /SAVE10/);
      assert.match(pdf, /PAID/);
      assert.match(pdf, /2,050\.00 ETB/);
    }
  } finally {
    server.close();
  }
});
