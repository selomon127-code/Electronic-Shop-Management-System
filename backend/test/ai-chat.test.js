const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  answerCatalogQuestion,
  isModelUnavailable,
  localReply,
  MODELS,
  sanitizeMessages,
} = require("../routes/aiChat");
const {
  buildCatalogReply,
  getCatalogIntent,
  getPreferredLanguage,
} = require("../utils/aiChatKnowledge");

test("sanitizes chat history and removes assistant messages before the first user message", () => {
  const messages = sanitizeMessages([
    { role: "assistant", content: "old greeting" },
    { role: "user", content: "  How much is delivery?  " },
  ]);

  assert.deepEqual(messages, [{ role: "user", content: "How much is delivery?" }]);
});

test("rejects malformed or non-user-ending chat history", () => {
  assert.equal(sanitizeMessages([]), null);
  assert.equal(sanitizeMessages([{ role: "assistant", content: "hello" }]), null);
  assert.equal(sanitizeMessages([{ role: "user", content: "" }]), null);
});

test("provides grounded local answers when live AI is unavailable", () => {
  assert.match(localReply("How much is delivery?", []), /150 ETB/);
  assert.match(localReply("How long does delivery take?", []), /3–5 business days/);
  assert.match(localReply("Do you offer returns?", []), /7 days/);
  assert.match(localReply("What laptop do you recommend?", [{ _id: "p1" }]), /1 matching product/);
});

test("classifies catalog questions and preserves an explicit English preference", () => {
  assert.equal(getCatalogIntent("How many total products do we have?").type, "product_count");
  assert.equal(getCatalogIntent("Are you sure there are only 4 products?").type, "product_count");
  assert.equal(getCatalogIntent("Show products missing their unit costs").type, "missing_cost");
  assert.equal(getCatalogIntent("What is the highest price of smartphones?").type, "highest_price");
  assert.equal(getCatalogIntent("Do you have any available laptops?").type, "category_products");
  assert.equal(getCatalogIntent("List all available products").availableOnly, true);
  assert.equal(getPreferredLanguage([
    { role: "user", content: "Please answer in English." },
    { role: "assistant", content: "Okay." },
    { role: "user", content: "How many products are in the catalog?" },
  ]), "en");
});

test("builds catalog count from database totals instead of search results", async () => {
  const calls = [];
  const model = {
    countDocuments: async (filter) => {
      calls.push(filter);
      return filter.stock ? 45 : 49;
    },
  };
  const intent = getCatalogIntent("How many products are in the store?");
  const result = await answerCatalogQuestion(intent, "How many products are in the store?", "en", model);
  assert.deepEqual(calls, [{}, { stock: { $gt: 0 } }]);
  assert.equal(result.reply, "The store catalog contains 49 products.");
});

test("checks costPrice, not selling price, when listing products missing unit cost", async () => {
  let filter;
  const products = [{ name: "Gaming Headset" }];
  const model = {
    countDocuments: async (query) => {
      filter = query;
      return products.length;
    },
    find(query) {
      filter = query;
      return {
        select() { return this; },
        sort() { return this; },
        limit() { return this; },
        lean: async () => products,
      };
    },
  };
  const intent = getCatalogIntent("Show me products missing their unit costs.");
  const result = await answerCatalogQuestion(intent, "Show me products missing their unit costs.", "en", model);
  assert.deepEqual(filter, { costPrice: null });
  assert.match(result.reply, /Gaming Headset/);
  assert.match(result.reply, /different from the selling price/);
});

test("lists the catalog using all database products and no unrelated recommendation cards", async () => {
  const products = [
    { name: "Laptop A", category: "Laptops", price: 50000, stock: 2 },
    { name: "Phone B", category: "Smartphones", price: 30000, stock: 0 },
  ];
  let filter;
  const model = {
    countDocuments: async (query) => {
      filter = query;
      return products.length;
    },
    find(query) {
      filter = query;
      return {
        select() { return this; },
        sort() { return this; },
        limit() { return this; },
        lean: async () => products,
      };
    },
  };
  const intent = getCatalogIntent("List all products in the catalog.");
  const result = await answerCatalogQuestion(intent, "List all products in the catalog.", "en", model);
  assert.deepEqual(filter, {});
  assert.match(result.reply, /2 products in the catalog/);
  assert.match(result.reply, /Laptop A/);
  assert.match(result.reply, /Phone B/);
  assert.deepEqual(result.recommendations, []);
});

test("answers highest-priced smartphone from category records and avoids unrelated matches", async () => {
  let filter;
  let sort;
  const model = {
    countDocuments: async (query) => {
      filter = query;
      return 1;
    },
    find(query) {
      filter = query;
      return {
        select() { return this; },
        sort(value) { sort = value; return this; },
        limit() { return this; },
        lean: async () => [{ name: "iPhone 15", price: 500000, stock: 1 }],
      };
    },
  };
  const intent = getCatalogIntent("What is the highest price of smartphones?");
  const result = await answerCatalogQuestion(intent, "What is the highest price of smartphones?", "en", model);
  assert.deepEqual(sort, { price: -1, name: 1 });
  assert.ok(filter.$or);
  assert.equal(result.reply, "The highest-priced smartphone in the catalog is iPhone 15 at 500,000 ETB.");
  assert.equal(result.recommendations.length, 1);
});

test("does not attach recommendation cards to policy questions", () => {
  assert.equal(getCatalogIntent("What are delivery times for laptops?"), null);
  assert.equal(buildCatalogReply(
    { type: "product_count", availableOnly: false },
    { total: 0, available: 0 },
    "en",
  ), "The store catalog contains 0 products.");
});

test("recognizes unavailable model errors so the next model can be tried", () => {
  assert.equal(isModelUnavailable({ status: 404 }), true);
  assert.equal(isModelUnavailable({ error: { code: "model_decommissioned" } }), true);
  assert.equal(isModelUnavailable({ status: 429 }), false);
});

test("uses supported Groq model fallbacks instead of the retired Llama model", () => {
  assert.ok(MODELS.includes("openai/gpt-oss-20b"));
  assert.ok(MODELS.includes("openai/gpt-oss-120b"));
  assert.ok(MODELS.includes("qwen/qwen3.6-27b"));
  assert.ok(!MODELS.includes("llama-3.1-8b-instant"));
});
