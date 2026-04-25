// backend/seed-products.js
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

// ✅ Products to seed
const products = [
  {
    name: 'iPad Pro 12.9"',
    price: 1099,
    category: "Tablet",
    description: "Powerful tablet with M2 chip",
    image: "https://picsum.photos/seed/ipadpro/300/300",
    stock: 25,
  },
  {
    name: "MacBook Air M2",
    price: 1199,
    category: "Laptop",
    description: "Thin and powerful laptop",
    image: "https://picsum.photos/seed/macbook/300/300",
    stock: 15,
  },
  {
    name: "AirPods Pro",
    price: 249,
    category: "Audio",
    description: "Noise-cancelling wireless earbuds",
    image: "https://picsum.photos/seed/airpods/300/300",
    stock: 50,
  },
  {
    name: "Apple Watch Ultra",
    price: 799,
    category: "Accessories",
    description: "Rugged smartwatch for adventures",
    image: "https://picsum.photos/seed/watch/300/300",
    stock: 30,
  },
];

// Connect and seed
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/first_react_test",
  )
  .then(async () => {
    console.log("✅ Connected to MongoDB for seeding");

    // Optional: Clear existing products first
    // await Product.deleteMany({});
    // console.log("🗑️ Cleared existing products");

    // Insert products
    const result = await Product.insertMany(products);
    console.log(`✅ Seeded ${result.length} products:`);
    result.forEach((p) => console.log(`  - ${p.name} ($${p.price})`));

    mongoose.connection.close();
    console.log("🎉 Seeding complete!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seed error:", err);
    process.exit(1);
  });
