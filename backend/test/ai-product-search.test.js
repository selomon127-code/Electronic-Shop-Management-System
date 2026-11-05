const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseProductQuery } = require("../utils/aiProductSearch");

test("parses a natural-language category and ETB budget", () => {
  const parsed = parseProductQuery("Laptop for programming under 50,000 ETB");

  assert.equal(parsed.filters.category, "Laptops");
  assert.deepEqual(parsed.filters.price, { max: 50000 });
  assert.ok(parsed.filters.tags.includes("programming"));
});

test("parses brand and a price range", () => {
  const parsed = parseProductQuery("Samsung phone between 10k and 30k birr");

  assert.equal(parsed.filters.brand, "Samsung");
  assert.deepEqual(parsed.filters.price, { min: 10000, max: 30000 });
});

test("does not interpret unsupported amounts as price filters", () => {
  const parsed = parseProductQuery("show me affordable camera");

  assert.equal(parsed.filters.price, undefined);
  assert.equal(parsed.filters.category, "Camera");
});
