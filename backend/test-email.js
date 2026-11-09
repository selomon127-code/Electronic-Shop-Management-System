require("dotenv").config();
const {
  sendWelcomeEmail,
  sendPaymentConfirmationEmail,
} = require("./utils/sendEmail");

async function runTest() {
  console.log("🧪 Starting manual email test to solomontareke41@gmail.com...");

  try {
    // 1. የ Welcome ኢሜይል ቴስት ማድረግ (በአማርኛ)
    console.log("Sending test welcome email...");
    await sendWelcomeEmail("solomontareke41@gmail.com", "Solomon Tareke", "am");

    // 2. የ Payment Confirmation ኢሜይል ቴስት ማድረግ
    console.log("Sending test payment confirmation email...");
    const mockOrder = {
      _id: "6aece3f81522796ff4c41bc3",
      createdAt: new Date(),
      totalPrice: 3200,
      paymentMethod: "chapa",
      products: [{ name: "Gaming Headset", quantity: 1, price: 3200 }],
    };
    await sendPaymentConfirmationEmail("solomontareke41@gmail.com", mockOrder);

    console.log(
      "✅ Test emails successfully sent to solomontareke41@gmail.com!",
    );
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

runTest();
