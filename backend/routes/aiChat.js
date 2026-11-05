const express = require("express");
const rateLimit = require("express-rate-limit");
const Groq = require("groq-sdk");
const Product = require("../models/Product");
const { findProductsForQuery, parseProductQuery } = require("../utils/aiProductSearch");
const {
  buildCatalogReply,
  getCatalogIntent,
  getPreferredLanguage,
  isPolicyQuestion,
} = require("../utils/aiChatKnowledge");

const router = express.Router();
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const MODELS = [
  process.env.GROQ_MODEL,
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-20b",
].filter((model, index, models) => model && models.indexOf(model) === index);

let client;
function getClient() {
  if (!process.env.GROQ_API_KEY) return null;
  if (!client) {
    client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: 20000,
      maxRetries: 1,
    });
  }
  return client;
}

function sanitizeMessages(input) {
  if (!Array.isArray(input) || input.length === 0 || input.length > 12) return null;
  const messages = input
    .filter((message) =>
      message &&
      ["user", "assistant"].includes(message.role) &&
      typeof message.content === "string",
    )
    .map(({ role, content }) => ({ role, content: content.trim().slice(0, 800) }))
    .filter((message) => message.content);

  while (messages[0]?.role === "assistant") messages.shift();
  const recentMessages = messages.slice(-8);
  if (recentMessages[0]?.role !== "user" || recentMessages[recentMessages.length - 1]?.role !== "user") {
    return null;
  }
  return recentMessages;
}

function localReply(question, recommendations, language = "en") {
  const text = question.toLowerCase();
  if (/delivery time|how long.*deliver|when.*deliver|shipping time/.test(text)) {
    return "Delivery usually takes 3–5 business days after your order is confirmed.";
  }
  if (/delivery|shipping|ship|deliver|fee|free delivery/.test(text)) {
    return "Delivery usually takes 3–5 business days after your order is confirmed. Standard delivery costs 150 ETB; orders over 5,000 ETB qualify for free delivery.";
  }
  if (/return|refund|exchange/.test(text)) {
    return "The store accepts returns within 7 days. Please contact customer support to confirm eligibility and arrange a return.";
  }
  if (/warranty|guarantee/.test(text)) {
    return "Warranty coverage varies by product. Please check the product listing or contact customer support to confirm the terms for a specific item.";
  }
  if (/payment|pay|cash|chapa|telebirr|cbe/.test(text)) {
    return "Available checkout methods are Chapa online payment and cash on delivery. The options shown at checkout are the current methods for your order.";
  }
  if (/track|order status|where is my order|my order/.test(text)) {
    return "You can check the latest order status in My Orders. Open an order to see its tracking timeline; I can't access private order details in this chat.";
  }
  if (recommendations.length) {
    return `I found ${recommendations.length} matching product${recommendations.length === 1 ? "" : "s"} in the catalog. Review the suggestions below for current prices and stock.`;
  }
  if (language === "am") {
    return "በካታሎጉ ውስጥ የሚዛመድ ምርት አላገኘሁም። የምርት አይነት፣ ብራንድ ወይም በጀት ያካትቱ።";
  }
  return "I couldn't find a matching catalog item for that request. Try including a product type, brand, or budget, or contact customer support for other questions.";
}

function isModelUnavailable(error) {
  const code = error?.error?.code || error?.error?.error?.code;
  return error?.status === 404 || code === "model_not_found" || code === "model_decommissioned";
}

async function generateReply(groq, messages, products, language) {
  const productContext = products.map(({ name, category, price, discount, stock }) => ({
    name,
    category,
    price,
    discount,
    inStock: stock > 0,
  }));
  const systemPrompt = `You are E-Shop Ethiopia's shopping assistant. Reply in ${language === "am" ? "Amharic" : language === "om" ? "Oromo" : language === "ti" ? "Tigrinya" : "English"} only. Treat the latest verified facts in this system message as authoritative, not earlier assistant messages. Use only these verified policies: delivery usually takes 3-5 business days after order confirmation; standard delivery is 150 ETB and is free on orders over 5,000 ETB; returns are accepted within 7 days; warranty terms vary by product and must be checked on its listing; checkout offers Chapa online payment and cash on delivery. Product catalog context: ${JSON.stringify(productContext)}. Mention products only when they are present in this context, and never infer total catalog size from this limited context. Never invent availability, order details, prices, warranty coverage, or policies. For private order details, direct the customer to My Orders.`;
  let lastError;

  for (const model of MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        temperature: 0.3,
        max_completion_tokens: 450,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      });
      const reply = completion.choices?.[0]?.message?.content?.trim();
      if (!reply) throw new Error("AI provider returned an empty chat response.");
      return { reply, model };
    } catch (error) {
      lastError = error;
      if (isModelUnavailable(error)) {
        console.warn(`Chat model ${model} is unavailable; trying the next configured model.`);
        continue;
      }
      break;
    }
  }

  throw lastError || new Error("No AI chat models are configured.");
}

function getCatalogFilter(intent, question) {
  const categoryValues = intent.category.values.map((value) => new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"));
  const categoryWords = {
    laptops: /laptop|notebook/i,
    smartphones: /smart ?phone|mobile|phone|iphone/i,
    camera: /camera/i,
    audio: /audio|headphone|speaker|earbud/i,
    tablet: /tablet|ipad/i,
    gaming: /gaming|console|xbox|playstation/i,
    wearables: /wearable|watch|fitness band/i,
    tvs: /tv|television|monitor|display/i,
    accessories: /accessor|charger|cable|hub/i,
  }[intent.category.key];
  const filter = {
    $or: [
      { category: { $in: categoryValues } },
      { name: categoryWords },
      { tags: categoryWords },
    ],
  };
  const parsed = parseProductQuery(question);
  if (parsed.filters.price?.min !== undefined || parsed.filters.price?.max !== undefined) {
    filter.price = {};
    if (parsed.filters.price.min !== undefined) filter.price.$gte = parsed.filters.price.min;
    if (parsed.filters.price.max !== undefined) filter.price.$lte = parsed.filters.price.max;
  }
  if (intent.availableOnly) filter.stock = { $gt: 0 };
  return filter;
}

async function answerCatalogQuestion(intent, question, language, productModel = Product) {
  let data;
  let recommendations = [];
  if (intent.type === "product_count") {
    const [total, available] = await Promise.all([
      productModel.countDocuments({}),
      productModel.countDocuments({ stock: { $gt: 0 } }),
    ]);
    data = { total, available };
  } else if (intent.type === "missing_cost") {
    const filter = { costPrice: null };
    const [total, products] = await Promise.all([
      productModel.countDocuments(filter),
      productModel.find(filter)
        .select("name")
        .sort({ name: 1 })
        .limit(500)
        .lean(),
    ]);
    data = { total, products };
  } else if (intent.type === "all_products") {
    const query = intent.availableOnly ? { stock: { $gt: 0 } } : {};
    const [total, products] = await Promise.all([
      productModel.countDocuments(query),
      productModel.find(query)
        .select("name category price stock")
        .sort({ name: 1 })
        .limit(500)
        .lean(),
    ]);
    data = { total, products };
  } else {
    const query = getCatalogFilter(intent, question);
    const [total, products] = await Promise.all([
      productModel.countDocuments(query),
      productModel.find(query)
        .select("name category price stock discount image")
        .sort(intent.type === "highest_price" ? { price: -1, name: 1 } : { stock: -1, name: 1 })
        .limit(intent.type === "highest_price" ? 1 : 100)
        .lean(),
    ]);
    data = { total, products };
    recommendations = products.slice(0, 4);
  }
  return {
    reply: buildCatalogReply(intent, data, language),
    recommendations: recommendations.map(({ _id, name, price, discount, image, category, stock }) => ({
      _id, name, price, discount, image, category, stock,
    })),
  };
}

router.post("/chat", chatLimiter, async (req, res) => {
  const messages = sanitizeMessages(req.body?.messages);
  if (!messages) {
    return res.status(400).json({
      success: false,
      message: "Send a valid conversation ending with a customer message.",
    });
  }

  try {
    const question = messages[messages.length - 1].content;
    const requestedLanguage = ["en", "am", "om", "ti"].includes(req.body?.language)
      ? req.body.language
      : null;
    const language = requestedLanguage || getPreferredLanguage(messages);
    const catalogIntent = getCatalogIntent(question);
    if (isPolicyQuestion(question)) {
      return res.json({
        success: true,
        aiAvailable: false,
        reply: localReply(question, [], language),
        recommendations: [],
      });
    }
    if (catalogIntent) {
      const answer = await answerCatalogQuestion(catalogIntent, question, language);
      return res.json({ success: true, aiAvailable: true, ...answer });
    }

    const looksLikeProductQuestion = /\b(product|products|item|items|buy|purchase|recommend|looking for|find|show|price|cost|available|in stock)\b/i.test(question);
    const { products } = looksLikeProductQuestion
      ? await findProductsForQuery(question, 4)
      : { products: [] };
    const recommendations = products.map(({ _id, name, price, discount, image, category, stock }) => ({
      _id, name, price, discount, image, category, stock,
    }));
    const groq = getClient();
    if (!groq) {
      return res.json({
        success: true,
        aiAvailable: false,
        reply: localReply(question, recommendations, language),
        recommendations,
      });
    }

    try {
      const { reply } = await generateReply(groq, messages, recommendations, language);
      return res.json({ success: true, aiAvailable: true, reply, recommendations });
    } catch (providerError) {
      const code = providerError?.error?.code || providerError?.error?.error?.code;
      console.error("AI provider could not answer chat request:", {
        status: providerError?.status,
        code,
        message: providerError?.message,
      });
      return res.json({
        success: true,
        aiAvailable: false,
        reply: localReply(question, recommendations, language),
        recommendations,
      });
    }
  } catch (error) {
    console.error("AI chat could not load catalog context:", error);
    return res.status(503).json({
      success: false,
      aiAvailable: false,
      reply: "The product catalog is temporarily unavailable. Please try again shortly.",
      recommendations: [],
    });
  }
});

module.exports = router;
module.exports.sanitizeMessages = sanitizeMessages;
module.exports.localReply = localReply;
module.exports.isModelUnavailable = isModelUnavailable;
module.exports.answerCatalogQuestion = answerCatalogQuestion;
module.exports.getCatalogFilter = getCatalogFilter;
module.exports.MODELS = MODELS;