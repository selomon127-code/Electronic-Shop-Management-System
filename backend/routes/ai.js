const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");

const MODELS = [
  process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-20b",
].filter((m, i, arr) => m && arr.indexOf(m) === i);

let client = null;
const getClient = () => {
  if (!process.env.GROQ_API_KEY) return null;
  if (!client) {
    client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: 30000,
      maxRetries: 1,
    });
  }
  return client;
};

const extractJson = (text) => {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1)
    throw new SyntaxError("No JSON in AI response");
  return JSON.parse(cleaned.slice(start, end + 1));
};

const isModelProblem = (err) =>
  err?.status === 404 ||
  err?.error?.error?.code === "model_not_found" ||
  err?.error?.error?.code === "model_decommissioned";

const isNetworkProblem = (err) =>
  err?.constructor?.name === "APIConnectionError" ||
  [
    "ENOTFOUND",
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT",
    "EAI_AGAIN",
  ].includes(err?.cause?.cause?.code || err?.cause?.code);

const MAX_TOKENS = 8000;

const requestCompletion = async (groq, model, prompt) => {
  const base = {
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_completion_tokens: MAX_TOKENS,
  };

  try {
    return await groq.chat.completions.create({
      ...base,
      response_format: { type: "json_object" },
    });
  } catch (err) {
    if (err?.error?.error?.code === "json_validate_failed") {
      console.warn(`⚠️ JSON mode failed on ${model}, retrying without it`);
      return await groq.chat.completions.create(base);
    }
    throw err;
  }
};

const buildPrompt = ({ name, category, specs }) => `
You are a professional e-commerce copywriter for E-Shop Ethiopia.
Write a compelling, SEO-friendly product description for:
- Product Name: ${name}
- Category: ${category || "Electronics"}
- Details: ${specs || "Not provided"}

Requirements:
1. Professional, engaging tone.
2. Highlight key features and benefits naturally.
3. 2-3 sentences per language (keep it concise).
4. Persuasive for Ethiopian customers.
5. Do not invent technical specifications that were not provided.

Return ONLY a JSON object with exactly these keys:
{
  "en": "English description",
  "am": "Amharic description (አማርኛ)",
  "om": "Afaan Oromoo description",
  "ti": "Tigrinya description (ትግርኛ)"
}
`;

// ✅ POST /api/ai/generate-product-description (ONLY THIS ROUTE HERE)
router.post("/generate-product-description", async (req, res) => {
  const groq = getClient();
  if (!groq) {
    console.error("❌ GROQ_API_KEY is missing from backend/.env");
    return res.status(500).json({
      message: "AI service is not configured on the server (missing API key).",
    });
  }

  const { name, category, specs } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Product name is required" });
  }

  const prompt = buildPrompt({ name: name.trim(), category, specs });
  let lastError = null;

  for (const model of MODELS) {
    try {
      const completion = await requestCompletion(groq, model, prompt);
      const text = completion.choices?.[0]?.message?.content || "";
      const d = extractJson(text);

      console.log(`✅ AI descriptions generated with ${model}`);
      return res.json({
        success: true,
        descriptions: {
          en: d.en || "",
          am: d.am || "",
          om: d.om || "",
          ti: d.ti || "",
        },
      });
    } catch (error) {
      lastError = error;
      console.error(
        `❌ AI Generation Error (${model}):`,
        error.status || "",
        error.message,
      );
      if (!isModelProblem(error)) break;
    }
  }

  const status = lastError?.status;
  let httpStatus = 500;
  let message = "Failed to generate description. Please try again.";

  if (isNetworkProblem(lastError)) {
    httpStatus = 503;
    message =
      "The server cannot reach the AI provider. Check the server's internet connection.";
  } else if (isModelProblem(lastError)) {
    message = "None of the configured AI models are available.";
  } else if (status === 401 || status === 403) {
    message = "The AI API key was rejected. Check GROQ_API_KEY.";
  } else if (status === 429) {
    httpStatus = 429;
    message = "AI rate limit reached. Please wait a minute and try again.";
  } else if (lastError instanceof SyntaxError) {
    message = "The AI returned an unreadable response. Please try again.";
  }

  res.status(httpStatus).json({ message });
});

// ✅ SINGLE EXPORT ONLY
module.exports = router;
