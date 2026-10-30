require("dotenv").config();
const { Groq } = require("groq-sdk");

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function checkModels() {
  try {
    console.log("🔍 Fetching available models for your API key...\n");
    const list = await client.models.list();

    // Filter for models that are actually active and not deprecated
    const activeModels = list.data.filter((m) => m.active).map((m) => m.id);

    console.log("✅ YOU HAVE ACCESS TO THESE MODELS:");
    activeModels.forEach((model) => console.log(` - ${model}`));

    if (activeModels.length === 0) {
      console.log(
        "⚠️ No active models found. Your free tier limit may be reached, or the API key needs to be regenerated.",
      );
    }
  } catch (error) {
    console.error("❌ Error fetching models:", error.message);
  }
}

checkModels();
