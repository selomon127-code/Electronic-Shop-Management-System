const nodemailer = require("nodemailer");

// ✅ 1. CREATE THE TRANSPORTER
let transporter;
try {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log("✅ Nodemailer transporter initialized successfully.");
} catch (error) {
  console.error("❌ Failed to initialize Nodemailer:", error.message);
}

// ✅ 2. MULTILINGUAL TEMPLATES (Typos fixed & optimized)
const emailTranslations = {
  am: {
    orderSubject: "✅ ትዕዛዝዎ ተረጋግጧል! - E-Shop Ethiopia",
    orderGreeting: (name) => `ሰላም ${name}!`,
    orderMessage:
      "ከ E-Shop Ethiopia ጋር ስለገበያዎ እናመሰግናለን! ትዕዛዝዎን ተቀብለን ለመላክ እያዘጋጀን ነው።",
    orderDetailsTitle: "የትዕዛዝ ዝርዝር",
    orderSummaryTitle: "የትዕዛዝ ማጠቃለያ",
    tableHeaders: { product: "ምርት", qty: "ብዛት", price: "ዋጋ" },
    totalLabel: "ጠቅላላ:",
    trackButton: "ትዕዛዝዎን ይከታተሉ",
  },
  om: {
    orderSubject: "✅ Ajajaan kee mirkanaa'e! - E-Shop Ethiopia",
    orderGreeting: (name) => `Akkam ${name}!`,
    orderMessage:
      "E-Shop Ethiopia waan bitataniif galatoomaa! Ajajaa kee fudhannee erguuf qopheessaa jirra.",
    orderDetailsTitle: "Odeeffannoo Ajajaa",
    orderSummaryTitle: "Gabatee Ajajaa",
    tableHeaders: { product: "Oomisha", qty: "Hamma", price: "Gatii" },
    totalLabel: "Waliigala:",
    trackButton: "Ajajaa Keetii Hordofi",
  },
  ti: {
    orderSubject: "✅ ትእዛዝካ ተረጋጊጹ! - E-Shop Ethiopia",
    orderGreeting: (name) => `ሰላም ${name}!`,
    orderMessage:
      "ምስ E-Shop Ethiopia ስለ ዝገበርኩም ነመስግን! ትእዛዝኩም ተቀቢልና ንምልኣኽ ነዳሉ ኣለና።",
    orderDetailsTitle: "ዝርዝር ትእዛዝ",
    orderSummaryTitle: "ጽማቚ ትእዛዝ",
    tableHeaders: { product: "ፍርያት", qty: "ብዝሒ", price: "ዋጋ" },
    totalLabel: "ጠቕላላ:",
    trackButton: "ትእዛዝካ ክትከታተል",
  },
  en: {
    orderSubject: "✅ Order Confirmed! - E-Shop Ethiopia",
    orderGreeting: (name) => `Hello ${name},`,
    orderMessage:
      "Thank you for shopping with E-Shop Ethiopia! We have received your order and are getting it ready for shipment.",
    orderDetailsTitle: "Order Details",
    orderSummaryTitle: "Order Summary",
    tableHeaders: { product: "Product", qty: "Qty", price: "Price" },
    totalLabel: "Total:",
    trackButton: "Track Your Order",
  },
};

// ✅ 3. ORDER CONFIRMATION FUNCTION
const sendOrderConfirmation = async (userEmail, order, userLang = "en") => {
  if (!transporter) {
    console.warn(
      "⚠️ [EMAIL] Skipped: Nodemailer transporter is not configured.",
    );
    return;
  }

  console.log(
    `🚀 [EMAIL] Attempting to send order confirmation to: ${userEmail}`,
  );

  try {
    const t = emailTranslations[userLang] || emailTranslations.en;
    const orderId = order?._id
      ? order._id.toString().slice(-6).toUpperCase()
      : "N/A";
    const userName = order?.user?.name || "Valued Customer";

    let addressObj = order?.shippingAddress || order?.address;
    if (typeof addressObj === "string") {
      try {
        addressObj = JSON.parse(addressObj);
      } catch (e) {
        addressObj = {};
      }
    }

    const itemsList = (order?.products || [])
      .map((item) => {
        const productName = item.product?.name || item.name || "Product";
        const productImage =
          item.product?.image || item.image || "https://via.placeholder.com/50";
        const price = item.product?.price || item.price || 0;
        const qty = item.quantity || 1;

        return `
        <tr>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${productImage}" alt="${productName}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
              <span>${productName}</span>
            </div>
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${qty}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${(price * qty).toFixed(2)} ETB</td>
        </tr>`;
      })
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .order-details { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; padding: 12px 10px; background: #e2e8f0; color: #475569; font-weight: 600; font-size: 14px; }
          .total { font-size: 1.3rem; font-weight: 700; color: #10b981; text-align: right; margin-top: 20px; padding-top: 15px; border-top: 2px solid #e2e8f0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; }
          .btn { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 15px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>✅ ${userLang === "am" ? "ትዕዛዝዎ ተረጋግጧል!" : userLang === "om" ? "Ajajaan kee mirkanaa'e!" : userLang === "ti" ? "ትእዛዝካ ተረጋጊጹ!" : "Order Confirmed!"}</h1></div>
          <div class="content">
            <h2>${t.orderGreeting(userName)}</h2>
            <p>${t.orderMessage}</p>
            <div class="order-details">
              <p><strong>${t.orderDetailsTitle}:</strong></p>
              <p>📦 <strong>Order ID:</strong> #${orderId}</p>
              <p>📅 <strong>Date:</strong> ${order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
              <p>💳 <strong>Payment:</strong> <span style="color: #10b981; font-weight: 600; text-transform: uppercase;">${order?.paymentStatus || order?.status || "Pending"}</span></p>
              <p>📍 <strong>Shipping:</strong> ${addressObj?.city || "N/A"}, ${addressObj?.subcity || "N/A"}</p>
            </div>
            <h3 style="margin-bottom: 10px; color: #1e293b;">${t.orderSummaryTitle}</h3>
            <table><thead><tr><th>${t.tableHeaders.product}</th><th style="text-align: center;">${t.tableHeaders.qty}</th><th style="text-align: right;">${t.tableHeaders.price}</th></tr></thead><tbody>${itemsList}</tbody></table>
            <div class="total">${t.totalLabel} ${order?.totalPrice ? order.totalPrice.toFixed(2) : "0.00"} ETB</div>
            <div style="text-align: center; margin-top: 20px;"><a href="${process.env.FRONTEND_URL}/profile/orders" class="btn">${t.trackButton}</a></div>
          </div>
          <div class="footer"><p>© ${new Date().getFullYear()} E-Shop Ethiopia. All rights reserved.</p></div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from:
        process.env.EMAIL_FROM || `"E-Shop Ethiopia" <selomon127@gmail.com>`,
      to: userEmail,
      subject: t.orderSubject,
      html: emailHtml,
    });

    console.log(`✅ [EMAIL] SUCCESS! Message ID: ${info.messageId}`);
  } catch (error) {
    console.error("❌❌❌ [EMAIL] CRITICAL FAILURE ❌❌❌");
    console.error("Error Message:", error.message);
  }
};

// ✅ 4. LOW STOCK ALERT FUNCTION
const sendLowStockAlert = async (productName, currentStock, adminEmail) => {
  if (!transporter) {
    console.warn(
      "⚠️ [ALERT] Skipped: Nodemailer transporter is not configured.",
    );
    return;
  }

  console.log(
    `🚨 [ALERT] Attempting to send low stock alert for: ${productName}`,
  );

  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; border-top: 5px solid #ef4444; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { color: #ef4444; font-size: 24px; font-weight: 800; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
          .detail { background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca; }
          .detail p { margin: 5px 0; font-size: 16px; }
          .btn { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 15px; text-align: center; }
          .footer { margin-top: 30px; font-size: 13px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">🚨 Low Stock Alert!</div>
          <p>Hello Admin,</p>
          <p>This is an automated alert from <strong>E-Shop Ethiopia</strong>.</p>
          <div class="detail">
            <p style="margin: 0;"><strong>📦 Product:</strong> ${productName}</p>
            <p style="margin: 5px 0 0 0;"><strong>📉 Current Stock:</strong> <span style="color: #ef4444; font-weight: 800; font-size: 18px;">${currentStock} units</span></p>
          </div>
          <p>Please restock this item as soon as possible to avoid losing sales and disappointing customers.</p>
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/admin/products" class="btn">Manage Products Now</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} E-Shop Ethiopia. Automated System.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from:
        process.env.EMAIL_FROM || `"E-Shop Ethiopia" <selomon127@gmail.com>`,
      to: adminEmail,
      subject: `🚨 Low Stock Alert: ${productName} (${currentStock} left)`,
      html: emailHtml,
    });

    console.log(
      `✅ [ALERT] Low stock email sent successfully! ID: ${info.messageId}`,
    );
  } catch (error) {
    console.error("❌ [ALERT] Failed to send low stock email:", error.message);
  }
};

// ✅ 5. EXPORTS
module.exports = {
  sendOrderConfirmation,
  sendLowStockAlert,
};
