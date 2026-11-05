const { afterEach, test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const Product = require("../models/Product");
const User = require("../models/User");
const adminRoutes = require("../routes/admin");
const {
  BulkCostUpdateError,
  bulkUpdateProductCosts,
  normalizeBulkCostUpdates,
} = require("../services/bulkProductCostService");

const originalFindById = User.findById;
const originalProductFind = Product.find;
const originalBulkWrite = Product.bulkWrite;
const originalJwtSecret = process.env.JWT_SECRET;

afterEach(() => {
  User.findById = originalFindById;
  Product.find = originalProductFind;
  Product.bulkWrite = originalBulkWrite;
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
});

test("validates bulk cost values, ObjectIds, duplicates, and request size", () => {
  const validId = "507f1f77bcf86cd799439011";
  assert.deepEqual(normalizeBulkCostUpdates([{ id: validId, costPrice: 0 }]), [
    { id: validId, costPrice: 0 },
  ]);
  for (const updates of [
    [{ id: validId, costPrice: -1 }],
    [{ id: validId, costPrice: "10" }],
    [{ id: "invalid-id", costPrice: 10 }],
    [{ id: validId, costPrice: 10 }, { id: validId, costPrice: 20 }],
    [],
  ]) {
    assert.throws(() => normalizeBulkCostUpdates(updates), BulkCostUpdateError);
  }
});

test("bulk updates only costPrice and verifies every product exists before writing", async () => {
  const ids = ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"];
  let operations;
  let writeOptions;
  const model = {
    find: () => ({
      select: () => ({
        lean: async () => ids.map((_id) => ({ _id })),
      }),
    }),
    bulkWrite: async (ops, options) => {
      operations = ops;
      writeOptions = options;
      return { matchedCount: 2, modifiedCount: 2 };
    },
  };
  const result = await bulkUpdateProductCosts(model, [
    { id: ids[0], costPrice: 120 },
    { id: ids[1], costPrice: 45.5 },
  ]);

  assert.deepEqual(result, { updatedCount: 2, matchedCount: 2 });
  assert.deepEqual(operations, ids.map((id, index) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { costPrice: [120, 45.5][index] } },
      runValidators: true,
    },
  })));
  assert.deepEqual(writeOptions, { ordered: true });

  let wrote = false;
  const missingModel = {
    find: () => ({ select: () => ({ lean: async () => [] }) }),
    bulkWrite: async () => { wrote = true; },
  };
  await assert.rejects(
    bulkUpdateProductCosts(missingModel, [{ id: ids[0], costPrice: 100 }]),
    (error) => error instanceof BulkCostUpdateError && error.statusCode === 404,
  );
  assert.equal(wrote, false);
});

test("PUT /products/bulk-cost is restricted to business owners and returns the bulk result", async () => {
  process.env.JWT_SECRET = "test-only-secret";
  const ids = ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"];
  let operations;
  let role = "customer";
  User.findById = () => ({ select: async () => ({ role }) });
  Product.find = () => ({
    select: () => ({
      lean: async () => ids.map((_id) => ({ _id })),
    }),
  });
  Product.bulkWrite = async (ops) => {
    operations = ops;
    return { matchedCount: 2, modifiedCount: 2 };
  };

  const app = express();
  app.use(express.json(), adminRoutes);
  const server = app.listen(0);
  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const url = `http://127.0.0.1:${server.address().port}/products/bulk-cost`;
    const updates = ids.map((id, index) => ({ id, costPrice: index * 75 }));
    const token = (id) => jwt.sign({ id }, process.env.JWT_SECRET);

    const denied = await fetch(url, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token("customer-id")}`, "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    assert.equal(denied.status, 403);
    assert.equal(operations, undefined);

    role = "business_owner";
    const allowed = await fetch(url, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token("owner-id")}`, "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    assert.equal(allowed.status, 200);
    assert.deepEqual(await allowed.json(), { success: true, updatedCount: 2, matchedCount: 2 });
    assert.equal(operations.length, 2);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
