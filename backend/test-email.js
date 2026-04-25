// backend/test-email.js
require("dotenv").config();
const nodemailer = require("nodemailer");

console.log("🔍 Email config:", {
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  user: process.env.EMAIL_USER,
  secure: process.env.EMAIL_PORT == 465, // ✅ TRUE only for port 465, FALSE for 587
});

// ✅ Transporter - MUST match .env: port 587 → secure: false
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_PORT == 465, // ✅ Dynamic: true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  dns: { family: 4 }, // Force IPv4
  connectionTimeout: 15000,
  socketTimeout: 15000,
});

console.log("🔄 Verifying transporter...");
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Transporter error:", {
      message: error.message,
      code: error.code,
      command: error.command,
    });
    process.exit(1);
  }

  console.log("✅ Transporter ready!");

  console.log("📧 Sending test email to selomon127@gmail.com...");
  transporter.sendMail(
    {
      from: process.env.EMAIL_FROM,
      to: "selomon127@gmail.com",
      subject: "🧪 Test Email from Your Store",
      text: "If you receive this, email is working! 🎉",
      html: "<h1>🎉 Email Working!</h1><p>If you see this, your email configuration is correct.</p>",
    },
    (err, info) => {
      if (err) {
        console.error("❌ Send error:", {
          message: err.message,
          code: err.code,
          command: err.command,
        });
        process.exit(1);
      }
      console.log("✅ Test email sent:", info.messageId);
      console.log("📬 Check your Gmail inbox (and Spam/Promotions tabs)!");
      process.exit(0);
    },
  );
});
