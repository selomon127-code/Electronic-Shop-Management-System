const nodemailer = require("nodemailer");

// ✅ 1. CREATE THE TRANSPORTER
let transporter;
function initTransporter() {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
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
}
initTransporter();

function getTransporter() {
  if (!transporter) {
    initTransporter();
  }
  return transporter;
}

function setTransporter(newTransporter) {
  transporter = newTransporter;
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

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

const sendStatusUpdateEmail = async (userEmail, order, status) => {
  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    console.warn(
      "⚠️ [EMAIL] Skipped: Nodemailer transporter is not configured.",
    );
    return;
  }

  const statusLabels = {
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  const statusLabel = statusLabels[status] || "Updated";
  const orderId = order?._id
    ? order._id.toString().slice(-6).toUpperCase()
    : "N/A";
  const customerName = escapeHtml(order?.user?.name || "Valued Customer");
  const trackingUrl = `${process.env.FRONTEND_URL || ""}/profile/orders`;

  try {
    await activeTransporter.sendMail({
      from:
        process.env.EMAIL_FROM || `"E-Shop Ethiopia" <selomon127@gmail.com>`,
      to: userEmail,
      subject: `Order #${orderId} status: ${statusLabel}`,
      html: `<!DOCTYPE html>
        <html>
          <body style="font-family:Arial,sans-serif;background:#f8fafc;color:#1e293b;padding:24px">
            <main style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px">
              <h1 style="font-size:22px">Your order status has been updated</h1>
              <p>Hello ${customerName},</p>
              <p>Order <strong>#${orderId}</strong> is now <strong>${statusLabel}</strong>.</p>
              <p><a href="${escapeHtml(trackingUrl)}">View your order</a></p>
              <p style="color:#64748b;font-size:13px">E-Shop Ethiopia</p>
            </main>
          </body>
        </html>`,
    });
  } catch (error) {
    console.error("❌ Status email error:", error.message);
  }
};

// ✅ 3. ORDER CONFIRMATION FUNCTION
const sendOrderConfirmation = async (userEmail, order, userLang = "en") => {
  const activeTransporter = getTransporter();
  if (!activeTransporter) {
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

    const info = await activeTransporter.sendMail({
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
  const activeTransporter = getTransporter();
  if (!activeTransporter) {
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

    const info = await activeTransporter.sendMail({
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

// ============================================================================
// ✅ 5. AUTOMATED POST-PAYMENT EMAIL CONFIRMATION TEMPLATES & DISPATCHER
// Branding: Electronic Shop Ethiopia
// Subject: Payment Confirmed - Order #<ORDER_ID>
// ============================================================================

const formatPaymentMethod = (method) => {
  if (!method) return "Electronic Payment";
  const m = String(method).toLowerCase();
  if (m === "chapa") return "Chapa Payment";
  if (m === "telebirr") return "Telebirr";
  if (m === "cod") return "Cash on Delivery";
  if (m === "bank_transfer") return "Bank Transfer";
  return method.charAt(0).toUpperCase() + method.slice(1);
};

const renderPaymentConfirmationHtml = (order, customerName, options = {}) => {
  const rawOrderId = order?._id ? String(order._id) : "N/A";
  const displayOrderId =
    rawOrderId.length === 24 ? rawOrderId.slice(-6).toUpperCase() : rawOrderId;
  const safeCustomerName = escapeHtml(
    customerName || order?.user?.name || "Valued Customer",
  );
  const orderDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

  const paymentMethodLabel = escapeHtml(
    formatPaymentMethod(order?.paymentMethod),
  );
  const subtotal = Number(order?.subtotal ?? 0);
  const couponDiscount = Number(order?.coupon?.discount ?? 0);
  const tax = Number(order?.tax ?? 0);
  const deliveryFee = Number(order?.shippingFee ?? 0);
  const finalTotal = Number(
    order?.totalPrice ??
      Math.max(0, subtotal - couponDiscount + tax + deliveryFee),
  );

  const products = Array.isArray(order?.products) ? order.products : [];
  const itemsHtml = products
    .map((item) => {
      const name = escapeHtml(
        item.product?.name || item.name || "Product Item",
      );
      const quantity = Number(item.quantity) || 1;
      const unitPrice = Number(item.price ?? item.product?.price ?? 0);
      const lineTotal = unitPrice * quantity;
      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b;">
            ${name}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #475569; text-align: center;">
            ${quantity}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #475569; text-align: right;">
            ${unitPrice.toFixed(2)} ETB
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: 600; color: #1e293b; text-align: right;">
            ${lineTotal.toFixed(2)} ETB
          </td>
        </tr>
      `;
    })
    .join("");

  const frontendUrl = (
    process.env.FRONTEND_URL || "http://localhost:5173"
  ).replace(/\/+$/, "");
  const orderDetailsUrl =
    options.orderDetailsUrl || `${frontendUrl}/profile/orders`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmed - Order #${rawOrderId}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
    .email-wrapper { width: 100%; background-color: #f1f5f9; padding: 32px 12px; box-sizing: border-box; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 32px 28px; text-align: center; }
    .brand-title { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .brand-subtitle { margin: 6px 0 0 0; font-size: 14px; color: #94a3b8; }
    .status-badge-wrapper { margin-top: 18px; }
    .status-badge { display: inline-block; background-color: #10b981; color: #ffffff; font-size: 13px; font-weight: 700; padding: 6px 16px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 18px; font-weight: 600; color: #0f172a; margin: 0 0 12px 0; }
    .intro { font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 24px 0; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px; }
    .info-grid { width: 100%; border-collapse: collapse; }
    .info-grid td { padding: 6px 0; font-size: 14px; vertical-align: top; }
    .info-label { color: #64748b; width: 40%; font-weight: 500; }
    .info-value { color: #0f172a; font-weight: 600; text-align: right; }
    .section-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 24px 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px; font-size: 13px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th { background: #f1f5f9; padding: 10px 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; text-align: left; }
    .summary-card { background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px 20px; margin-top: 20px; }
    .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #475569; }
    .summary-table { width: 100%; border-collapse: collapse; }
    .summary-table td { padding: 6px 0; font-size: 14px; }
    .total-row td { border-top: 2px solid #cbd5e1; padding-top: 12px; font-size: 18px; font-weight: 700; color: #0f172a; }
    .cta-wrapper { text-align: center; margin: 32px 0 20px 0; }
    .cta-button { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 28px; border-radius: 8px; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25); }
    .support-box { border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 28px; font-size: 13px; line-height: 1.6; color: #64748b; }
    .support-box a { color: #2563eb; text-decoration: none; }
    .footer { background: #0f172a; color: #94a3b8; padding: 24px 28px; text-align: center; font-size: 12px; line-height: 1.5; }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="header">
        <h1 class="brand-title">Electronic Shop Ethiopia</h1>
        <p class="brand-subtitle">Order &amp; Payment Confirmation</p>
        <div class="status-badge-wrapper">
          <span class="status-badge">Payment Confirmed • PAID</span>
        </div>
      </div>
      <div class="content">
        <h2 class="greeting">Hello ${safeCustomerName},</h2>
        <p class="intro">
          We have successfully received and verified your payment. Your order is now confirmed and is being prepared for shipment.
        </p>

        <div class="info-card">
          <table class="info-grid">
            <tr>
              <td class="info-label">Order Reference:</td>
              <td class="info-value">#${displayOrderId} (${rawOrderId})</td>
            </tr>
            <tr>
              <td class="info-label">Payment Status:</td>
              <td class="info-value" style="color: #10b981;">PAID</td>
            </tr>
            <tr>
              <td class="info-label">Order Date:</td>
              <td class="info-value">${orderDate}</td>
            </tr>
            <tr>
              <td class="info-label">Payment Method:</td>
              <td class="info-value">${paymentMethodLabel}</td>
            </tr>
            <tr>
              <td class="info-label">Total Amount Paid:</td>
              <td class="info-value" style="color: #0f172a; font-size: 16px;">${finalTotal.toFixed(2)} ETB</td>
            </tr>
          </table>
        </div>

        <div class="section-title">Itemized Order Summary</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml || '<tr><td colspan="4" style="padding: 12px; text-align: center; color: #64748b;">No itemized details available</td></tr>'}
          </tbody>
        </table>

        <div class="summary-card">
          <table class="summary-table">
            <tr>
              <td style="color: #64748b;">Subtotal:</td>
              <td style="text-align: right; color: #0f172a; font-weight: 500;">${subtotal.toFixed(2)} ETB</td>
            </tr>
            <tr>
              <td style="color: #64748b;">Coupon Discount:</td>
              <td style="text-align: right; color: #10b981; font-weight: 500;">-${couponDiscount.toFixed(2)} ETB</td>
            </tr>
            <tr>
              <td style="color: #64748b;">Tax:</td>
              <td style="text-align: right; color: #0f172a; font-weight: 500;">${tax.toFixed(2)} ETB</td>
            </tr>
            <tr>
              <td style="color: #64748b;">Delivery Fee:</td>
              <td style="text-align: right; color: #0f172a; font-weight: 500;">${deliveryFee.toFixed(2)} ETB</td>
            </tr>
            <tr class="total-row">
              <td>Total Paid:</td>
              <td style="text-align: right; color: #10b981;">${finalTotal.toFixed(2)} ETB</td>
            </tr>
          </table>
        </div>

        <div class="cta-wrapper">
          <a href="${escapeHtml(orderDetailsUrl)}" class="cta-button" target="_blank" rel="noopener noreferrer">
            View Order Details
          </a>
        </div>

        <div class="support-box">
          <strong>Customer Support:</strong><br>
          If you have any questions or need assistance with your order, contact our support team:<br>
          Email: <a href="mailto:support@eshopethiopia.com">support@eshopethiopia.com</a> | Phone: +251 911 000 000<br>
          Operating Hours: Monday – Saturday, 8:30 AM – 6:00 PM (EAT)
        </div>
      </div>

      <div class="footer">
        <p><strong>Electronic Shop Ethiopia</strong></p>
        <p>Bole Road, Addis Ababa, Ethiopia</p>
        <p>© ${new Date().getFullYear()} Electronic Shop Ethiopia. All rights reserved.</p>
        <p style="font-size: 11px; color: #64748b;">This is an automated payment confirmation email. Please do not reply directly to this message.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

const renderPaymentConfirmationText = (order, customerName, options = {}) => {
  const rawOrderId = order?._id ? String(order._id) : "N/A";
  const safeCustomerName =
    customerName || order?.user?.name || "Valued Customer";
  const orderDate = order?.createdAt
    ? new Date(order.createdAt).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];
  const paymentMethodLabel = formatPaymentMethod(order?.paymentMethod);
  const subtotal = Number(order?.subtotal ?? 0);
  const couponDiscount = Number(order?.coupon?.discount ?? 0);
  const tax = Number(order?.tax ?? 0);
  const deliveryFee = Number(order?.shippingFee ?? 0);
  const finalTotal = Number(
    order?.totalPrice ??
      Math.max(0, subtotal - couponDiscount + tax + deliveryFee),
  );

  const products = Array.isArray(order?.products) ? order.products : [];
  const itemsText = products
    .map((item) => {
      const name = item.product?.name || item.name || "Product Item";
      const qty = Number(item.quantity) || 1;
      const unit = Number(item.price ?? item.product?.price ?? 0);
      const total = unit * qty;
      return `- ${name} | Qty: ${qty} | Unit: ${unit.toFixed(2)} ETB | Total: ${total.toFixed(2)} ETB`;
    })
    .join("\n");

  const frontendUrl = (
    process.env.FRONTEND_URL || "http://localhost:5173"
  ).replace(/\/+$/, "");
  const orderDetailsUrl =
    options.orderDetailsUrl || `${frontendUrl}/profile/orders`;

  return `ELECTRONIC SHOP ETHIOPIA
PAYMENT CONFIRMATION

Hello ${safeCustomerName},

Thank you for your business. We have successfully received and verified your payment. Your order is confirmed and is currently being processed.

ORDER SUMMARY:
---------------------------------------------
Order ID: #${rawOrderId}
Payment Status: PAID
Order Date: ${orderDate}
Payment Method: ${paymentMethodLabel}
Total Amount Paid: ${finalTotal.toFixed(2)} ETB

ITEMIZED PRODUCTS:
---------------------------------------------
${itemsText || "No itemized details available"}

FINANCIAL BREAKDOWN:
---------------------------------------------
Subtotal: ${subtotal.toFixed(2)} ETB
Coupon Discount: -${couponDiscount.toFixed(2)} ETB
Tax: ${tax.toFixed(2)} ETB
Delivery Fee: ${deliveryFee.toFixed(2)} ETB
Final Total: ${finalTotal.toFixed(2)} ETB

You can view your full order details and track delivery status here:
${orderDetailsUrl}

CUSTOMER SUPPORT:
Email: support@eshopethiopia.com
Phone: +251 911 000 000
Hours: Monday - Saturday, 8:30 AM - 6:00 PM (EAT)
Addis Ababa, Ethiopia

© ${new Date().getFullYear()} Electronic Shop Ethiopia. All rights reserved.
`;
};

const sendPaymentConfirmationEmail = async (userEmail, order, options = {}) => {
  if (!userEmail || typeof userEmail !== "string" || !userEmail.includes("@")) {
    throw new Error(
      `Invalid or missing customer email address: "${userEmail}"`,
    );
  }

  const activeTransporter = options.transporter || getTransporter();
  if (!activeTransporter) {
    console.warn(
      "⚠️ [EMAIL] Skipped: Nodemailer transporter is not configured.",
    );
    return {
      success: false,
      skipped: true,
      reason: "transporter_unconfigured",
    };
  }

  const rawOrderId = order?._id ? String(order._id) : "N/A";
  const customerName =
    options.customerName || order?.user?.name || "Valued Customer";
  const subject = `Payment Confirmed - Order #${rawOrderId}`;
  const htmlContent = renderPaymentConfirmationHtml(
    order,
    customerName,
    options,
  );
  const textContent = renderPaymentConfirmationText(
    order,
    customerName,
    options,
  );

  const mailOptions = {
    from:
      process.env.EMAIL_FROM ||
      `"Electronic Shop Ethiopia" <selomon127@gmail.com>`,
    to: userEmail.trim(),
    subject,
    text: textContent,
    html: htmlContent,
  };

  const info = await activeTransporter.sendMail(mailOptions);
  console.log(
    `✅ [EMAIL] Payment confirmation sent to ${userEmail} for Order #${rawOrderId}`,
  );
  return { success: true, messageId: info?.messageId || "sent", subject };
};

// ============================================================================
// ✅ 6. WELCOME & PASSWORD RESET EMAILS (used by routes/auth.js)
// ============================================================================

const accountTranslations = {
  en: {
    welcomeSubject: "Welcome to E-Shop Ethiopia! 🇪🇹",
    welcomeTitle: "🎉 Welcome to E-Shop Ethiopia!",
    greeting: (n) => `Hello ${n},`,
    welcomeBody:
      "Thank you for joining E-Shop Ethiopia! You can now browse our electronics, track your orders and enjoy exclusive deals.",
    welcomeButton: "Start Shopping",
    resetSubject: "Reset Your Password - E-Shop Ethiopia",
    resetTitle: "🔒 Reset Your Password",
    resetBody:
      "We received a request to reset your password. Click the button below to create a new password. This link expires in 1 hour.",
    resetButton: "Reset Password",
    resetIgnore:
      "If you didn't request this, please ignore this email. Your password will remain unchanged.",
  },
  am: {
    welcomeSubject: "እንኳን ወደ E-Shop Ethiopia በደህና መጡ! 🇪🇹",
    welcomeTitle: "🎉 እንኳን ደህና መጡ!",
    greeting: (n) => `ሰላም ${n},`,
    welcomeBody:
      "E-Shop Ethiopiaን ስለተቀላቀሉ እናመሰግናለን! አሁን ምርቶችን ማየት፣ ትዕዛዞችዎን መከታተል እና ልዩ ቅናሾችን ማግኘት ይችላሉ።",
    welcomeButton: "መግዛት ይጀምሩ",
    resetSubject: "የይለፍ ቃልዎን ይቀይሩ - E-Shop Ethiopia",
    resetTitle: "🔒 የይለፍ ቃል ዳግም ማስጀመር",
    resetBody:
      "የይለፍ ቃልዎን ለመቀየር ጥያቄ ደርሶናል። አዲስ የይለፍ ቃል ለመፍጠር ከታች ያለውን ቁልፍ ይጫኑ። ይህ አገናኝ ለ1 ሰዓት ብቻ ይሰራል።",
    resetButton: "የይለፍ ቃል ቀይር",
    resetIgnore: "ይህን ጥያቄ ካላቀረቡ ይህን ኢሜይል ችላ ይበሉ። የይለፍ ቃልዎ አይቀየርም።",
  },
  om: {
    welcomeSubject: "Baga nagaan dhufte E-Shop Ethiopia! 🇪🇹",
    welcomeTitle: "🎉 Baga nagaan dhufte!",
    greeting: (n) => `Akkam ${n},`,
    welcomeBody:
      "E-Shop Ethiopia waan makamteef galatoomi! Amma oomishoota ilaaluu, ajajaa hordofuu fi gatii addaa argachuu dandeessa.",
    welcomeButton: "Bituu Jalqabi",
    resetSubject: "Jecha Iccitii Jijjiiri - E-Shop Ethiopia",
    resetTitle: "🔒 Jecha Iccitii Deebisii Qopheessi",
    resetBody:
      "Jecha iccitii kee jijjiiruuf gaaffii nu bira ga'eera. Jecha iccitii haaraa uumuuf button armaan gadii cuqaasi. Linkiin kun sa'aa 1 qofa hojjata.",
    resetButton: "Jecha Iccitii Jijjiiri",
    resetIgnore:
      "Yoo ati gaafachuu dhiiftee, ergaa kana irra darbi. Jechi iccitii kee hin jijjiiramu.",
  },
  ti: {
    welcomeSubject: "እንኳዕ ብደሓን መጻእኩም E-Shop Ethiopia! 🇪🇹",
    welcomeTitle: "🎉 እንኳዕ ብደሓን መጻእኩም!",
    greeting: (n) => `ሰላም ${n},`,
    welcomeBody:
      "E-Shop Ethiopia ስለ ዝተጸምበርኩም ነመስግን! ሕጂ ፍርያት ክትርእዩ፣ ትእዛዛትኩም ክትከታተሉ ከምኡውን ፍሉይ ቅናሽ ክትረኽቡ ትኽእሉ ኢኹም።",
    welcomeButton: "ምዕዳግ ጀምሩ",
    resetSubject: "ቃል ጽርግያ ቀይሩ - E-Shop Ethiopia",
    resetTitle: "🔒 ቃል ጽርግያ ዳግም ምጅማር",
    resetBody:
      "ቃል ጽርግያኹም ንምቕያር ሕቶ ኣቕሪብኩም። ሓድሽ ቃል ጽርግያ ንምፍጣር ኣብ ታሕቲ ዘሎ መጽቅጢ ጠውቑ። እዚ ሊንክ ንሓደ ሰዓት ጥራይ ይሰርሕ።",
    resetButton: "ቃል ጽርግያ ቀይር",
    resetIgnore: "እዚ ሕቶ ዘየቕረብኩም እንተኾይኑ፣ ነዚ ኢመይል ዘይትግደሱ። ቃል ጽርግያኹም ኣይቅየርን።",
  },
};

const renderAccountEmail = ({ title, color, bodyHtml }) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background: ${color}; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; line-height: 1.6; }
    .btn { display: inline-block; padding: 14px 28px; background: ${color}; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>${title}</h1></div>
    <div class="content">${bodyHtml}</div>
    <div class="footer"><p>© ${new Date().getFullYear()} E-Shop Ethiopia. All rights reserved.</p></div>
  </div>
</body>
</html>`;

const sendWelcomeEmail = async (userEmail, userName, userLang = "en") => {
  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    console.warn(
      "⚠️ [EMAIL] Welcome skipped: Nodemailer transporter is not configured.",
    );
    return false;
  }
  try {
    const t = accountTranslations[userLang] || accountTranslations.en;
    const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/+$/, "");
    const info = await activeTransporter.sendMail({
      from:
        process.env.EMAIL_FROM ||
        `"E-Shop Ethiopia" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: t.welcomeSubject,
      html: renderAccountEmail({
        title: t.welcomeTitle,
        color: "#10b981",
        bodyHtml: `
          <h2>${t.greeting(escapeHtml(userName))}</h2>
          <p>${t.welcomeBody}</p>
          <div style="text-align:center"><a href="${escapeHtml(frontendUrl)}/products" class="btn">${t.welcomeButton}</a></div>`,
      }),
    });
    console.log(
      `✅ [EMAIL] Welcome email sent to ${userEmail} (${info.messageId})`,
    );
    return true;
  } catch (error) {
    console.error("❌ [EMAIL] Welcome email failed:", error.message);
    return false;
  }
};

// resetUrl is the FULL link, e.g. `${FRONTEND_URL}/reset-password/${token}`.
// Throws on failure so routes/auth.js can catch and log it.
const sendPasswordResetEmail = async (
  userEmail,
  userName,
  resetUrl,
  userLang = "en",
) => {
  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    throw new Error("Nodemailer transporter is not configured.");
  }
  const t = accountTranslations[userLang] || accountTranslations.en;
  const info = await activeTransporter.sendMail({
    from:
      process.env.EMAIL_FROM || `"E-Shop Ethiopia" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: t.resetSubject,
    html: renderAccountEmail({
      title: t.resetTitle,
      color: "#ef4444",
      bodyHtml: `
        <h2>${t.greeting(escapeHtml(userName))}</h2>
        <p>${t.resetBody}</p>
        <div style="text-align:center"><a href="${escapeHtml(resetUrl)}" class="btn">${t.resetButton}</a></div>
        <p style="font-size:14px;color:#64748b;">${t.resetIgnore}</p>`,
    }),
  });
  console.log(
    `✅ [EMAIL] Password reset email sent to ${userEmail} (${info.messageId})`,
  );
  return true;
};
// ==========================================
// 1. EXCLUSIVE DEAL BROADCAST
// ==========================================
const sendDealBroadcastEmail = async (users, coupon) => {
  if (!transporter || !users || users.length === 0) return;

  console.log(
    `📢 [BROADCAST] Sending deal alert to ${users.length} customers...`,
  );

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; border-top: 5px solid #8b5cf6; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .code-box { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #8b5cf6; }
        .code { font-size: 24px; font-weight: 800; color: #8b5cf6; letter-spacing: 2px; }
        .btn { display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2 style="color: #8b5cf6; margin-top: 0;">🎉 Exclusive Deal Just Dropped!</h2>
        <p>Hi there,</p>
        <p>We just launched a new promotion and wanted you to be the first to know!</p>
        <div class="code-box">
          <div style="font-size: 14px; color: #64748b; margin-bottom: 5px;">Use Promo Code:</div>
          <div class="code">${coupon.code}</div>
          <div style="font-size: 14px; color: #10b981; font-weight: 600; margin-top: 5px;">Get ${coupon.discount}% OFF</div>
        </div>
        <p><strong>Deal:</strong> ${coupon.title || "Special Discount"}</p>
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/products" class="btn">Shop Now</a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px; text-align: center;">This offer is valid until ${coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "further notice"}.</p>
      </div>
    </body>
    </html>
  `;

  // Send in batches with a small delay to avoid hitting SMTP rate limits (e.g., Gmail/Brevo)
  for (const user of users) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: `🎁 Exclusive Deal: Use code ${coupon.code} for ${coupon.discount}% OFF!`,
        html: emailHtml,
      });
      await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay between emails
    } catch (error) {
      console.error(
        `❌ Failed to send broadcast to ${user.email}:`,
        error.message,
      );
    }
  }
  console.log(`✅ [BROADCAST] Deal alert sent successfully!`);
};

// ==========================================
// 2. LOGIN ALERT NOTIFICATION
// ==========================================
const sendLoginAlertEmail = async (user, ip, userAgent) => {
  if (!transporter || !user) return;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; border-top: 5px solid #f59e0b; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .info-box { background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .info-row { margin: 8px 0; font-size: 14px; }
        .label { font-weight: 700; color: #92400e; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2 style="color: #f59e0b; margin-top: 0;">🔒 New Login Detected</h2>
        <p>Hi ${user.name},</p>
        <p>We detected a new login to your <strong>E-Shop Ethiopia</strong> account. If this was you, you can safely ignore this email.</p>
        <div class="info-box">
          <div class="info-row"><span class="label">📅 Time:</span> ${new Date().toLocaleString()}</div>
          <div class="info-row"><span class="label">🌐 IP Address:</span> ${ip || "Unknown"}</div>
          <div class="info-row"><span class="label">💻 Device:</span> ${userAgent ? userAgent.substring(0, 50) + "..." : "Unknown"}</div>
        </div>
        <p>If you did not log in, please <a href="${process.env.FRONTEND_URL}/profile?tab=password" style="color: #f59e0b; font-weight: 600;">change your password immediately</a>.</p>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "🔒 Security Alert: New login to your account",
      html: emailHtml,
    });
    console.log(`✅ [LOGIN ALERT] Sent to ${user.email}`);
  } catch (error) {
    console.error(`❌ Login alert failed for ${user.email}:`, error.message);
  }
};

// ==========================================
// 3. PRODUCT REVIEW REQUEST
// ==========================================
const sendReviewRequestEmail = async (user, order) => {
  if (!transporter || !user || !order) return;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; border-top: 5px solid #10b981; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .stars { font-size: 24px; color: #fbbf24; margin: 15px 0; }
        .btn { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2 style="color: #10b981; margin-top: 0;">⭐ How was your order?</h2>
        <p>Hi ${user.name},</p>
        <p>Your order <strong>#${order._id.toString().slice(-6).toUpperCase()}</strong> was recently delivered. We hope you love your new items!</p>
        <p>Could you take a minute to share your experience? Your feedback helps us improve and helps other customers.</p>
        <div class="stars">★★★★★</div>
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/product/${order.products[0]?.product?._id || order.products[0]?.product}" class="btn">Leave a Review</a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px; text-align: center;">Thank you for shopping with E-Shop Ethiopia!</p>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `⭐ Rate your recent order #${order._id.toString().slice(-6).toUpperCase()}`,
      html: emailHtml,
    });
    console.log(
      `✅ [REVIEW REQUEST] Sent to ${user.email} for Order #${order._id}`,
    );
  } catch (error) {
    console.error(`❌ Review request failed for ${user.email}:`, error.message);
  }
};

// ✅ 7. EXPORTS
module.exports = {
  sendOrderConfirmation,
  sendLowStockAlert,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendStatusUpdateEmail,
  sendPaymentConfirmationEmail,
  renderPaymentConfirmationHtml,
  renderPaymentConfirmationText,
  formatPaymentMethod,
  escapeHtml,
  getTransporter,
  setTransporter,
  sendDealBroadcastEmail,
  sendLoginAlertEmail,
  sendReviewRequestEmail,
};
