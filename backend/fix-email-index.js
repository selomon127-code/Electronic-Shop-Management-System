// Run once with: node fix-email-index.js
require("dotenv").config();
const mongoose = require("mongoose");

mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/first_react_test",
  )
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    const collection = mongoose.connection.collection("users");
    use;
    // Drop old index
    try {
      await collection.dropIndex("email_1");
      console.log("🗑️ Dropped old email index");
    } catch (e) {
      console.log("ℹ️  Index didn't exist or already dropped");
    }

    // Create new case-insensitive index
    await collection.createIndex(
      { email: 1 },
      {
        unique: true,
        collation: { locale: "en", strength: 2 },
      },
    );
    console.log("✅ Created case-insensitive email index");

    // Show all indexes
    const indexes = await collection.indexes();
    console.log(
      "📋 Current indexes:",
      indexes.map((i) => ({ name: i.name, unique: i.unique })),
    );

    mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
