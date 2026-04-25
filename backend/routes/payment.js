// backend/routes/payment.js
const router = require("express").Router();
const {
  createOrderWithPayment,
  chapaCallback,
  checkPaymentStatus,
} = require("../controllers/paymentController");
const auth = require("../middleware/auth");

// 🔹 Create order with payment (protected - requires login)
router.post("/create", auth, createOrderWithPayment);

// 🔹 Chapa webhook callback (PUBLIC - called by Chapa, no auth)
router.post("/chapa/callback", chapaCallback);

// 🔹 Check payment status (protected - for frontend polling)
router.get("/status/:orderId", auth, checkPaymentStatus);

module.exports = router;
