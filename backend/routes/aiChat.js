const express = require("express");
const rateLimit = require("express-rate-limit");
const { Groq } = require("groq-sdk");

const router = express.Router();

// Initialize Groq client
const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ✅ BULLETPROOF: Updated with the EXACT models your API key has access to
const MODELS_TO_TRY = [
  process.env.GROQ_MODEL || "openai/gpt-oss-120b", // Primary choice
  "qwen/qwen3.8-27b", // Excellent multilingual alternative
  "openai/gpt-oss-20b", // Fallback
  "allam-2-7b", // Final fallback
];

const SYSTEM_PROMPT = `You are the customer support assistant for E-Shop Ethiopia, an online electronics store.
- Reply in the EXACT SAME LANGUAGE the customer writes in (English, Amharic/አማርኛ, Afaan Oromoo, or Tigrinya/ትግርኛ).
- Keep answers short, friendly, and practical (max 3-4 sentences).
- Help with orders, payments (Chapa, Telebirr, CBE Birr, COD), delivery (Free over 5,000 ETB, otherwise 150 ETB), returns (7-day policy), and product questions.
- If you do not know something specific, politely say so and suggest contacting human support. 
- NEVER invent order details, policies, or prices.`;

/* Limit abuse: 20 requests per minute per IP */
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down." },
});

/* Forgiving validation + sanitization */
function sanitizeMessages(input) {
  if (!Array.isArray(input) || input.length === 0) return null;

  const cleaned = input
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m) => ({
      role: m.role,
      content: m.content.trim().slice(0, 1000),
    }));

  if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== "user") {
    return null;
  }

  const finalMessages = [];
  for (const msg of cleaned) {
    if (finalMessages.length === 0 && msg.role !== "user") continue;
    finalMessages.push(msg);
  }

  return finalMessages.length > 0 ? finalMessages : null;
}

// POST /api/ai/chat
router.post("/chat", limiter, async (req, res) => {
  const messages = sanitizeMessages(req.body?.messages);

  if (!messages) {
    return res.status(400).json({
      success: false,
      message: "Invalid messages payload.",
      reply: "I didn't quite catch that. Could you try rephrasing?",
    });
  }

  let completion = null;

  // ✅ Try each model until one works
  for (const model of MODELS_TO_TRY) {
    try {
      completion = await client.chat.completions.create({
        model: model,
        max_tokens: 500,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      });
      console.log(`✅ Chatbot successfully used model: ${model}`);
      break; // Success! Exit the loop
    } catch (err) {
      const errCode = err?.error?.code || err?.error?.error?.code;

      // If it's a model not found or decommissioned error, try the next one
      if (
        err?.status === 404 ||
        errCode === "model_not_found" ||
        errCode === "model_decommissioned"
      ) {
        console.warn(`⚠️ Model ${model} is deprecated, trying next...`);
        continue;
      }

      // If it's a different error (like rate limit or auth), break and show error
      console.error(`❌ Non-recoverable error on ${model}:`, err.message);
      break;
    }
  }

  // If ALL models failed, return a graceful fallback message instead of crashing
  if (!completion) {
    console.warn("⚠️ All AI models failed. Using graceful fallback response.");
    return res.json({
      success: true,
      reply:
        "I'm currently experiencing high traffic and my AI brain is taking a quick nap. For immediate help with orders, payments (Chapa/Telebirr/COD), or delivery (Free over 5,000 ETB), please contact our human support team! (አሁን ላይ ከፍተኛ ያቄ ስላለ መልስ ለመስጠት አቅቶኛል፣ እባክዎ የሰው ሰራተኛችንን ያግኙ።)",
    });
  }

  const reply =
    completion.choices?.[0]?.message?.content?.trim() ||
    "Sorry, I couldn't generate a reply.";
  res.json({ success: true, reply });
});

module.exports = router;
