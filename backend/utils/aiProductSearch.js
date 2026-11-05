const Product = require("../models/Product");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const CATEGORY_ALIASES = [
  { category: "Laptops", matches: ["Laptops", "Laptop"], terms: ["laptop", "notebook", "programming", "coding"] },
  { category: "Smartphones", matches: ["Smartphones", "Phone"], terms: ["phone", "smartphone", "mobile"] },
  { category: "Audio", matches: ["Audio"], terms: ["headphone", "earphone", "speaker", "audio", "earbud"] },
  { category: "Tablet", matches: ["Tablet"], terms: ["tablet", "ipad"] },
  { category: "Camera", matches: ["Camera"], terms: ["camera", "photography"] },
  { category: "Gaming", matches: ["Gaming"], terms: ["gaming", "game", "console", "playstation", "xbox"] },
  { category: "Accessories", matches: ["Accessories"], terms: ["accessory", "accessories", "charger", "cable", "hub"] },
  { category: "Wearables", matches: ["Wearables"], terms: ["watch", "wearable", "fitness band"] },
  { category: "TVs & Displays", matches: ["TVs & Displays"], terms: ["tv", "television", "monitor", "display"] },
];
const BRANDS = [
  "Apple", "Samsung", "Xiaomi", "Sony", "Canon", "Nikon", "Dell", "HP",
  "Lenovo", "ASUS", "Acer", "JBL", "Logitech", "Anker", "TP-Link", "TCL",
  "LG", "Garmin", "GoPro", "Nintendo", "Microsoft", "Baseus", "SanDisk",
  "Epson", "Huawei", "Tecno", "Infinix", "OnePlus", "Oppo", "Vivo",
];

const STOP_WORDS = new Set([
  "a", "an", "and", "for", "i", "in", "is", "it", "me", "of", "on", "or",
  "please", "product", "recommend", "recommendation", "show", "the", "to",
  "under", "below", "less", "than", "over", "above", "more", "between",
  "with", "within", "etb", "birr", "budget", "price", "maximum", "max",
  "minimum", "min", "cheap", "affordable", "best", "good", "looking", "need",
  "want", "buy", "shop", "my",
]);

function parseAmount(value) {
  const normalized = value.replace(/,/g, "").toLowerCase();
  const amount = Number(normalized.replace(/k$/, "")) * (normalized.endsWith("k") ? 1000 : 1);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function parseProductQuery(input) {
  const query = input.trim();
  const lower = query.toLowerCase();
  const filters = {};

  const between = lower.match(/between\s+([\d,.]+k?)\s+(?:and|to)\s+([\d,.]+k?)/i);
  const maxMatch = lower.match(/(?:under|below|less than|up to|max(?:imum)?(?: budget)?(?: of)?)\s*([\d,.]+k?)/i);
  const minMatch = lower.match(/(?:over|above|more than|at least|min(?:imum)?(?: budget)?(?: of)?)\s*([\d,.]+k?)/i);
  if (between) {
    const min = parseAmount(between[1]);
    const max = parseAmount(between[2]);
    if (min !== null && max !== null) filters.price = { min: Math.min(min, max), max: Math.max(min, max) };
  } else {
    const min = minMatch ? parseAmount(minMatch[1]) : null;
    const max = maxMatch ? parseAmount(maxMatch[1]) : null;
    if (min !== null || max !== null) filters.price = { ...(min !== null && { min }), ...(max !== null && { max }) };
  }

  const category = CATEGORY_ALIASES.find(({ terms }) => terms.some((term) => lower.includes(term)));
  if (category) {
    filters.category = category.category;
    filters.categoryMatches = category.matches;
  }
  const brand = BRANDS.find((item) => new RegExp(`\\b${escapeRegex(item.toLowerCase())}\\b`, "i").test(lower));
  if (brand) filters.brand = brand;

  const withoutPrice = lower
    .replace(/between\s+[\d,.]+k?\s+(?:and|to)\s+[\d,.]+k?/gi, " ")
    .replace(/(?:under|below|less than|up to|max(?:imum)?(?: budget)?(?: of)?|over|above|more than|at least|min(?:imum)?(?: budget)?(?: of)?)\s*[\d,.]+k?/gi, " ")
    .replace(/[\d,.]+k?\s*(?:etb|birr)/gi, " ");
  const terms = withoutPrice
    .split(/[^a-z0-9]+/i)
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term) && term !== brand?.toLowerCase());
  filters.tags = [...new Set(terms)].slice(0, 8);
  return { query, filters, terms: filters.tags };
}

function buildProductFilter(parsed) {
  const clauses = [];
  if (parsed.filters.price?.min !== undefined || parsed.filters.price?.max !== undefined) {
    const price = {};
    if (parsed.filters.price.min !== undefined) price.$gte = parsed.filters.price.min;
    if (parsed.filters.price.max !== undefined) price.$lte = parsed.filters.price.max;
    clauses.push({ price });
  }
  if (parsed.filters.category) {
    const matches = parsed.filters.categoryMatches || [parsed.filters.category];
    clauses.push({ category: { $in: matches.map((value) => new RegExp(`^${escapeRegex(value)}$`, "i")) } });
  }
  if (parsed.filters.brand) {
    const expression = new RegExp(escapeRegex(parsed.filters.brand), "i");
    clauses.push({ $or: [{ brand: expression }, { name: expression }] });
  }
  for (const term of parsed.terms) {
    const expression = new RegExp(escapeRegex(term), "i");
    clauses.push({
      $or: [
        { name: expression },
        { description: expression },
        { category: expression },
        { brand: expression },
        { tags: expression },
      ],
    });
  }
  return clauses.length ? { $and: clauses } : {};
}

async function findProductsForQuery(input, limit = 12) {
  const parsed = parseProductQuery(input);
  if (
    !parsed.terms.length &&
    !parsed.filters.category &&
    !parsed.filters.price &&
    !parsed.filters.brand
  ) {
    return { parsed, products: [], fallbackUsed: false };
  }
  const filter = buildProductFilter(parsed);
  let products = await Product.find(filter).select("-costPrice").sort({ stock: -1, createdAt: -1 }).limit(limit).lean();
  let fallbackUsed = false;

  if (!products.length && parsed.terms.length) {
    fallbackUsed = true;
    if (parsed.filters.category || parsed.filters.price || parsed.filters.brand) {
      products = await Product.find(buildProductFilter({ ...parsed, terms: [] }))
        .select("-costPrice").sort({ stock: -1, createdAt: -1 }).limit(limit).lean();
    } else {
      const expression = new RegExp(parsed.terms.map(escapeRegex).join("|"), "i");
      products = await Product.find({
        $or: [
          { name: expression },
          { description: expression },
          { category: expression },
          { brand: expression },
          { tags: expression },
        ],
      }).select("-costPrice").sort({ stock: -1, createdAt: -1 }).limit(limit).lean();
    }
  }

  return { parsed, products, fallbackUsed };
}

module.exports = { findProductsForQuery, parseProductQuery };
