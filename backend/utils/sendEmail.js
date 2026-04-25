// backend/utils/sendEmail.js
const nodemailer = require("nodemailer");

// ✅ Create transporter - Port 587 requires secure: false (TLS)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // ✅ false for port 587 (TLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  dns: { family: 4 }, // Force IPv4
  connectionTimeout: 15000,
  socketTimeout: 15000,
});

// Verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error.message);
  } else {
    console.log("✅ Email server ready to send messages");
  }
});

// 🔹 Send Order Confirmation Email
const sendOrderConfirmation = async (userEmail, order) => {
  try {
    // ✅ Convert ObjectId to string for safe string operations
    const orderId = order._id?.toString() || "UNKNOWN";
    const orderShortId = orderId.slice(-6).toUpperCase();

    // Parse address
    let addr;
    try {
      addr =
        typeof order.address === "string"
          ? JSON.parse(order.address)
          : order.address;
    } catch {
      addr = { full: order.address };
    }

    const addressText = addr.street
      ? `${addr.street}, ${addr.city || ""} ${addr.state || ""} ${addr.zip || ""} ${addr.country || ""}`.trim()
      : order.address;

    // Helper for date formatting
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // HTML Email Template
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
          .order-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .order-info table { width: 100%; }
          .order-info td { padding: 8px 0; border-bottom: 1px solid #dee2e6; }
          .label { color: #6c757d; }
          .value { font-weight: 600; text-align: right; }
          .total { color: #28a745; font-size: 20px; font-weight: bold; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th { background: #667eea; color: white; padding: 12px; text-align: left; }
          .items-table td { padding: 12px; border-bottom: 1px solid #dee2e6; }
          .status { display: inline-block; padding: 6px 16px; background: #ffc107; color: white; border-radius: 20px; font-weight: 600; }
          .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 14px; }
          .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div style="border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
          <div class="header">
            <h1 style="margin: 0;">🎉 Order Confirmed!</h1>
            <p style="margin: 10px 0 0 0;">Thank you for shopping with us</p>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p>Your order has been placed successfully!</p>
            <div class="order-info">
              <table>
                <tr><td class="label">Order #</td><td class="value">#${orderShortId}</td></tr>
                <tr><td class="label">Date</td><td class="value">${formatDate(order.createdAt)}</td></tr>
                <tr><td class="label">Status</td><td class="value"><span class="status">${order.status}</span></td></tr>
                <tr><td class="label">Payment</td><td class="value">${order.paymentMethod?.toUpperCase() || "CARD"}</td></tr>
              </table>
            </div>
            <h3>📦 Items</h3>
            <table class="items-table">
              <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
              <tbody>
                ${order.products?.map((item) => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>$${item.price?.toFixed(2)}</td><td>$${(item.price * item.quantity)?.toFixed(2)}</td></tr>`).join("")}
                <tr><td colspan="3" style="text-align: right; font-weight: bold; font-size: 18px; padding-top: 15px;">Total:</td><td class="total" style="padding-top: 15px;">$${order.totalPrice?.toFixed(2)}</td></tr>
              </tbody>
            </table>
            <h3>🚚 Shipping To</h3>
            <div class="order-info">
              <p style="margin: 0; line-height: 1.8;">
                ${addr.street ? `<strong>${addr.street}</strong><br>` : ""}
                ${[addr.city, addr.state].filter(Boolean).join(", ")} ${addr.zip || ""}<br>
                ${addr.country || ""}
              </p>
            </div>
            <div style="text-align: center;">
              <a href="http://localhost:5174/orders" class="btn">View Order Status</a>
            </div>
            <p style="margin-top: 30px;">Questions? Reply to this email or contact support@yourstore.com</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Your Store. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text fallback
    const text = `Order Confirmed! #${orderShortId}
    
Items:
${order.products?.map((i) => `- ${i.name} x${i.quantity} - $${(i.price * i.quantity).toFixed(2)}`).join("\n")}

Total: $${order.totalPrice?.toFixed(2)}
Ship to: ${addressText}
View: http://localhost:5174/orders`;

    // Send email
    const info = await transporter.sendMail({
      from:
        process.env.EMAIL_FROM ||
        `"SOLOMON YENENEH E-SHOP ETHIOPIA" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `🎉 Order Confirmed! #${orderShortId}`,
      text,
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ Send email error:", err.message);
    return { success: false, error: err.message };
  }
};

// 🔹 Send Order Status Update Email
const sendStatusUpdateEmail = async (userEmail, order, newStatus) => {
  try {
    // ✅ Convert ObjectId to string
    const orderId = order._id?.toString() || "UNKNOWN";
    const orderShortId = orderId.slice(-6).toUpperCase();

    // ✅ Status messages and colors
    const statusInfo = {
      pending: {
        emoji: "⏳",
        message: "received and is being prepared",
        color: "#ffc107",
      },
      processing: {
        emoji: "🔄",
        message: "is being processed",
        color: "#17a2b8",
      },
      shipped: {
        emoji: "🚚",
        message: "has shipped and is on its way!",
        color: "#007bff",
      },
      delivered: {
        emoji: "✅",
        message: "has been delivered! Enjoy your purchase! 🎉",
        color: "#28a745",
      },
      cancelled: {
        emoji: "❌",
        message: "has been cancelled. Please contact us if you have questions.",
        color: "#dc3545",
      },
    };

    const { emoji, message, color } = statusInfo[newStatus] || {
      emoji: "📦",
      message: "status has been updated",
      color: "#6c757d",
    };

    // Parse address
    let addr;
    try {
      addr =
        typeof order.address === "string"
          ? JSON.parse(order.address)
          : order.address;
    } catch {
      addr = { full: order.address };
    }

    // HTML Email Template
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
          .status-badge { display: inline-block; padding: 8px 20px; background: ${color}; color: white; border-radius: 20px; font-weight: 600; font-size: 16px; margin: 10px 0; }
          .order-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .order-info table { width: 100%; }
          .order-info td { padding: 8px 0; border-bottom: 1px solid #dee2e6; }
          .label { color: #6c757d; }
          .value { font-weight: 600; text-align: right; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th { background: #667eea; color: white; padding: 12px; text-align: left; }
          .items-table td { padding: 12px; border-bottom: 1px solid #dee2e6; }
          .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 14px; }
          .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div style="border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
          <div class="header">
            <h1 style="margin: 0;">${emoji} Order Update!</h1>
            <p style="margin: 10px 0 0 0;">Your order status has changed</p>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p>Great news! Your order status has been updated:</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <span class="status-badge">${newStatus.toUpperCase()}</span>
              <p style="margin: 10px 0; font-size: 18px;"><strong>${message}</strong></p>
            </div>
            
            <div class="order-info">
              <table>
                <tr><td class="label">Order #</td><td class="value">#${orderShortId}</td></tr>
                <tr><td class="label">Updated</td><td class="value">${new Date(order.updatedAt).toLocaleDateString()}</td></tr>
                <tr><td class="label">Total</td><td class="value">$${order.totalPrice?.toFixed(2)}</td></tr>
              </table>
            </div>
            
            ${
              newStatus === "shipped"
                ? `
            <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
              <strong>🚚 Tracking Info:</strong>
              <p style="margin: 10px 0 0 0;">Your order is on its way!</p>
            </div>
            `
                : ""
            }
            
            ${
              newStatus === "delivered"
                ? `
            <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <strong>✅ Enjoy Your Purchase!</strong>
              <p style="margin: 10px 0 0 0;">We hope you love your items!</p>
            </div>
            `
                : ""
            }
            
            <h3 style="margin-top: 30px;">📦 Order Items</h3>
            <table class="items-table">
              <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
              <tbody>
                ${order.products?.map((item) => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>$${item.price?.toFixed(2)}</td></tr>`).join("")}
              </tbody>
            </table>
            
            <div style="text-align: center;">
              <a href="http://localhost:5174/orders" class="btn">View Order Details</a>
            </div>
            
            <p style="margin-top: 30px;">Questions? Reply to this email or contact support@yourstore.com</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Your Store. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text fallback
    const text = `Order Update! ${emoji}
    
Order #${orderShortId} status: ${newStatus.toUpperCase()}
${message}

Items:
${order.products?.map((i) => `- ${i.name} x${i.quantity} - $${(i.price * i.quantity).toFixed(2)}`).join("\n")}

Total: $${order.totalPrice?.toFixed(2)}
View: http://localhost:5174/orders`;

    // Send email
    const info = await transporter.sendMail({
      from:
        process.env.EMAIL_FROM || `"Your Store" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `${emoji} Order #${orderShortId} - ${newStatus.toUpperCase()}`,
      text,
      html,
    });

    console.log("✅ Status email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("❌ Send status email error:", err.message);
    return { success: false, error: err.message };
  }
};

// ✅ Export BOTH functions
module.exports = {
  sendOrderConfirmation,
  sendStatusUpdateEmail,
};
