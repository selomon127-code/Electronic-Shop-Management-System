const CATEGORY_GROUPS = [
  { key: "laptops", terms: ["laptop", "laptops", "notebook", "notebooks"] },
  { key: "smartphones", terms: ["smartphone", "smartphones", "phone", "phones", "mobile"] },
  { key: "camera", terms: ["camera", "cameras"] },
  { key: "audio", terms: ["audio", "headphone", "headphones", "speaker", "speakers", "earbuds"] },
  { key: "tablet", terms: ["tablet", "tablets", "ipad"] },
  { key: "gaming", terms: ["gaming", "console", "consoles", "xbox", "playstation"] },
  { key: "wearables", terms: ["wearable", "wearables", "watch", "watches"] },
  { key: "tvs", terms: ["tv", "tvs", "television", "monitor", "monitors", "display"] },
  { key: "accessories", terms: ["accessory", "accessories", "charger", "chargers", "cable", "hub"] },
];

const CATEGORY_VALUES = {
  laptops: ["Laptops", "Laptop"],
  smartphones: ["Smartphones", "Smartphone", "Phones", "Phone", "Mobile"],
  camera: ["Camera", "Cameras"],
  audio: ["Audio"],
  tablet: ["Tablet", "Tablets"],
  gaming: ["Gaming"],
  wearables: ["Wearables", "Wearable"],
  tvs: ["TVs & Displays", "TV", "Television", "Displays"],
  accessories: ["Accessories"],
};

function getPreferredLanguage(messages) {
  const userMessages = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content.toLowerCase());
  const languageRequest = userMessages.slice(-8).reverse().find((content) =>
    /\b(answer|reply|respond|speak|write)\b.{0,30}\b(english|amharic|oromo|afaan oromoo|tigrinya)\b/.test(content) ||
    /\b(in|use)\s+(english|amharic|oromo|afaan oromoo|tigrinya)\b/.test(content),
  );
  if (languageRequest) {
    if (/amharic/.test(languageRequest)) return "am";
    if (/oromo|afaan oromoo/.test(languageRequest)) return "om";
    if (/tigrinya/.test(languageRequest)) return "ti";
    return "en";
  }
  const latest = userMessages[userMessages.length - 1] || "";
  if (/afaan oromoo|afaan oromiffa/.test(latest)) return "om";
  if (/ትግርኛ|ብትግርኛ/.test(latest)) return "ti";
  if (/[ሀ-ፚ]/.test(latest)) return "am";
  return "en";
}

function getCategoryFromQuestion(question) {
  const lower = question.toLowerCase();
  const category = CATEGORY_GROUPS.find(({ terms }) =>
    terms.some((term) => new RegExp(`\\b${term}\\b`, "i").test(lower)),
  );
  if (!category) return null;
  return { key: category.key, values: CATEGORY_VALUES[category.key] };
}

function getCatalogIntent(question) {
  const text = question.toLowerCase();
  if (isPolicyQuestion(question)) return null;
  const category = getCategoryFromQuestion(text);
  if (/\b(unit costs?|cost price|purchase costs?)\b/.test(text) &&
      /\b(missing|without|no|lack|list|which|show|have|any)\b/.test(text)) {
    return { type: "missing_cost" };
  }
  if (/\b(how many|number of|total|count|catalog size)\b/.test(text) &&
      /\b(products?|items?|catalog|stock|store)\b/.test(text)) {
    return { type: "product_count", availableOnly: /\b(available|in stock)\b/.test(text) };
  }
  if (
    /\b(products?|items?)\b/.test(text) &&
    (/\b(are you sure|really|only|is it true|is that right|correct)\b/.test(text) ||
      /\b\d+\s+products?\b.*\b(true|right|correct)\b/.test(text))
  ) {
    return { type: "product_count", availableOnly: /\b(available|in stock)\b/.test(text) };
  }
  if (/\b(all|every|entire|list|show)\b/.test(text) &&
      /\b(products?|items?|catalog)\b/.test(text)) {
    return { type: "all_products", availableOnly: /\b(available|in stock)\b/.test(text) };
  }
  if (/\b(highest|most expensive|priciest|maximum price|top[- ]priced)\b/.test(text) && category) {
    return { type: "highest_price", category };
  }
  if (category) {
    return { type: "category_products", category, availableOnly: /\b(available|in stock)\b/.test(text) };
  }
  return null;
}

function isPolicyQuestion(question) {
  return /\b(delivery|shipping|ship|deliver|fee|free delivery|return|refund|exchange|warranty|guarantee|payment|pay|cash|chapa|telebirr|cbe|track|order status|my order)\b/i.test(question);
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("en-US")} ETB`;
}

function formatProductList(products, language = "en") {
  if (!products.length) {
    if (language === "am") return "የሚዛመዱ ምርቶች በካታሎጉ ውስጥ አልተገኙም።";
    return "No matching products were found in the catalog.";
  }
  const label = language === "am" ? "በክምችት ውስጥ" : "in stock";
  return products.map((product) => {
    const stockText = Number(product.stock) > 0
      ? `${product.stock} ${label}`
      : language === "am" ? "ከክምችት ውጭ" : "out of stock";
    return `• ${product.name} — ${formatCurrency(product.price)} — ${stockText}`;
  }).join("\n");
}

function buildCatalogReply(intent, data, language = "en") {
  const amharic = language === "am";
  switch (intent.type) {
    case "product_count":
      return amharic
        ? `በካታሎጉ ውስጥ ${data.total} ምርቶች አሉ።${intent.availableOnly ? ` ከእነዚህ ${data.available} በክምችት ውስጥ ናቸው።` : ""}`
        : `The store catalog contains ${data.total} products.${intent.availableOnly ? ` ${data.available} are currently in stock.` : ""}`;
    case "all_products":
      return amharic
        ? `በካታሎጉ ውስጥ ${data.total} ${intent.availableOnly ? "በክምችት ያሉ" : "ጠቅላላ"} ምርቶች፦${data.total > data.products.length ? ` የመጀመሪያዎቹ ${data.products.length} እዚህ አሉ።` : ""}\n${formatProductList(data.products, language)}`
        : `Here are ${data.total}${intent.availableOnly ? " in-stock" : ""} products in the catalog:${data.total > data.products.length ? ` Showing the first ${data.products.length}.` : ""}\n${formatProductList(data.products, language)}`;
    case "missing_cost":
      if (!data.total) {
        return "Every product currently has a recorded unit cost.";
      }
      return `These ${data.total} products are missing a recorded unit cost (this is different from the selling price):${data.total > data.products.length ? ` Showing the first ${data.products.length}.` : ""}\n${data.products.map((product) => `• ${product.name}`).join("\n")}`;
    case "highest_price": {
      if (!data.products.length) return "There are no products in that category.";
      const categoryName = intent.category.key === "smartphones"
        ? "smartphone"
        : intent.category.key.replace(/s$/, "");
      return `The highest-priced ${categoryName} in the catalog is ${data.products[0].name} at ${formatCurrency(data.products[0].price)}.`;
    }
    case "category_products":
      if (!data.products.length) {
        return amharic ? "ይህን ምድብ የሚመስሉ ምርቶች አልተገኙም።" : `I couldn't find ${intent.availableOnly ? "in-stock " : ""}${intent.category.key} products in the catalog.`;
      }
      return amharic
        ? `${data.total} ምርቶች ተገኝተዋል፦${data.total > data.products.length ? ` የመጀመሪያዎቹ ${data.products.length} እዚህ አሉ።` : ""}\n${formatProductList(data.products, language)}`
        : `I found ${data.total} ${intent.availableOnly ? "in-stock " : ""}${intent.category.key} products:${data.total > data.products.length ? ` Showing the first ${data.products.length}.` : ""}\n${formatProductList(data.products, language)}`;
    default:
      return null;
  }
}

module.exports = {
  buildCatalogReply,
  formatProductList,
  getCatalogIntent,
  getCategoryFromQuestion,
  isPolicyQuestion,
  getPreferredLanguage,
};
