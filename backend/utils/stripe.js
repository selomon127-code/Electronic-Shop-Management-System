// backend/utils/stripe.js
const Stripe = require("stripe");

// ✅ Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16", // Use latest stable version
});

module.exports = stripe;
