const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createAiAnalyticsController } = require("../controllers/aiAnalyticsController");
const {
  ELIGIBLE_ORDER_FILTER,
  buildStockPredictions,
  createAiAnalyticsService,
  groupSeriesByInterval,
  makeSalesForecast,
  segmentCustomers,
} = require("../services/aiAnalyticsService");

const fixedNow = new Date("2026-11-05T15:00:00.000Z");

test("revenue eligibility includes paid or delivered orders and excludes cancelled/refunded", () => {
  assert.deepEqual(ELIGIBLE_ORDER_FILTER, {
    status: { $ne: "cancelled" },
    paymentStatus: { $ne: "refunded" },
    $or: [{ paymentStatus: "paid" }, { status: "delivered" }],
  });
});

test("sales forecasts use a 30-day flat-average fallback for sparse history", () => {
  const forecast = makeSalesForecast([
    { date: "2026-11-01", revenue: 300, orders: 1 },
    { date: "2026-11-02", revenue: 0, orders: 0 },
    { date: "2026-11-03", revenue: 0, orders: 0 },
  ], fixedNow);

  assert.equal(forecast.forecast.length, 30);
  assert.equal(forecast.forecast[0].date, "2026-11-05");
  assert.equal(forecast.forecast[0].revenue, 100);
  assert.equal(forecast.expectedRevenue30d, 3000);
  assert.equal(forecast.confidence, "limited");
  assert.equal(forecast.trend, "limited_data");
});

test("sales forecasting detects a trend and reports when history is insufficient for seasonality", () => {
  const daily = Array.from({ length: 10 }, (_, index) => ({
    date: new Date(Date.UTC(2026, 9, 1 + index)).toISOString().slice(0, 10),
    revenue: 100 + index * 10,
    orders: 1,
  }));
  const forecast = makeSalesForecast(daily, fixedNow);

  assert.equal(forecast.trend, "increasing");
  assert.equal(forecast.forecast.length, 30);
  assert.equal(forecast.seasonality.detected, false);
  assert.match(forecast.seasonality.insight, /More paid order history/);
});

test("historical sales can be grouped by week or month", () => {
  const daily = [
    { date: "2026-11-02", revenue: 10, orders: 1 },
    { date: "2026-11-03", revenue: 20, orders: 2 },
    { date: "2026-11-09", revenue: 30, orders: 3 },
  ];

  assert.deepEqual(groupSeriesByInterval(daily, "week"), [
    { date: "2026-11-02", revenue: 30, orders: 3 },
    { date: "2026-11-09", revenue: 30, orders: 3 },
  ]);
  assert.deepEqual(groupSeriesByInterval(daily, "month"), [
    { date: "2026-11", revenue: 60, orders: 6 },
  ]);
});

test("sales forecast endpoint rejects unsupported interval values", async () => {
  const controller = createAiAnalyticsController({
    getSalesForecast: async (interval) => ({ interval }),
  });
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await controller.getSalesForecast({ query: { interval: "year" } }, response);
  assert.equal(response.statusCode, 400);
  assert.match(response.body.message, /day, week, or month/);
});

test("stock predictions calculate velocity, stock coverage, reorder quantity, and slow movers", () => {
  const result = buildStockPredictions([
    { _id: "fast", name: "Fast", category: "Audio", stock: 5 },
    { _id: "slow", name: "Slow", category: "Audio", stock: 20 },
    { _id: "none", name: "No sales", category: "Audio", stock: 0 },
  ], [
    { _id: "fast", unitsSold: 90 },
    { _id: "slow", unitsSold: 2 },
  ], fixedNow);

  const fast = result.lowStock.find((item) => item._id === "fast");
  assert.equal(fast.daysToOutOfStock, 5);
  assert.equal(fast.monthlyBurnRate, 30);
  assert.equal(fast.recommendedRestockQuantity, 55);
  assert.equal(result.slowMovingCount, 1);
  assert.equal(result.slowMoving[0].name, "Slow");
  assert.equal(result.lowStockCount, 2);
});

test("customer segmentation separates VIP, frequent, inactive, occasional, and new profiles", () => {
  const users = [
    { _id: "vip", name: "VIP", email: "vip@example.test" },
    { _id: "frequent", name: "Frequent", email: "frequent@example.test" },
    { _id: "risk", name: "At risk", email: "risk@example.test" },
    { _id: "once", name: "Once", email: "once@example.test" },
    { _id: "new", name: "New", email: "new@example.test" },
  ];
  const purchases = [
    { _id: "vip", orders: 1, spend: 25000, lastPurchase: new Date("2026-11-01T00:00:00Z") },
    { _id: "frequent", orders: 3, spend: 6000, lastPurchase: new Date("2026-10-01T00:00:00Z") },
    { _id: "risk", orders: 5, spend: 40000, lastPurchase: new Date("2026-01-01T00:00:00Z") },
    { _id: "once", orders: 1, spend: 1000, lastPurchase: new Date("2026-10-20T00:00:00Z") },
  ];
  const result = segmentCustomers(users, purchases, fixedNow);

  assert.equal(result.totalCustomers, 5);
  assert.equal(result.purchasingCustomers, 4);
  assert.equal(result.segments.find((segment) => segment.key === "high_value").count, 1);
  assert.equal(result.segments.find((segment) => segment.key === "frequent").count, 1);
  assert.equal(result.segments.find((segment) => segment.key === "at_risk").count, 1);
  assert.equal(result.segments.find((segment) => segment.key === "occasional").count, 1);
  assert.equal(result.segments.find((segment) => segment.key === "new").count, 1);
  assert.match(result.segments.find((segment) => segment.key === "at_risk").suggestion, /win-back/);
});

test("analytics service applies the paid/delivered data filter to forecasting and inventory", async () => {
  const aggregateCalls = [];
  const Order = {
    aggregate: async (pipeline) => {
      aggregateCalls.push(pipeline);
      return [];
    },
  };
  const Product = {
    find: () => ({ select() { return this; }, lean: async () => [] }),
  };
  const User = {
    find: () => ({ select() { return this; }, sort() { return this; }, lean: async () => [] }),
  };
  const service = createAiAnalyticsService({ Order, Product, User, clock: () => fixedNow });

  await service.getSalesForecast();
  await service.getStockPredictions();
  await service.getCustomerInsights();

  for (const pipeline of aggregateCalls) {
    assert.deepEqual(pipeline[0].$match.status, { $ne: "cancelled" });
    assert.deepEqual(pipeline[0].$match.paymentStatus, { $ne: "refunded" });
    assert.deepEqual(pipeline[0].$match.$or, ELIGIBLE_ORDER_FILTER.$or);
  }
});
