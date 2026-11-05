require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const User = require("../models/User");

async function migrateUserRoles() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required to migrate user roles.");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const legacyCustomers = await User.collection.updateMany(
      { role: "user" },
      { $set: { role: "customer" } },
    );
    const legacyAdmins = await User.collection.updateMany(
      { role: "admin" },
      { $set: { role: "business_owner" } },
    );

    console.log(
      `Role migration complete: ${legacyCustomers.modifiedCount} user -> customer, ${legacyAdmins.modifiedCount} admin -> business_owner.`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

migrateUserRoles().catch((error) => {
  console.error("User role migration failed:", error);
  process.exitCode = 1;
});
