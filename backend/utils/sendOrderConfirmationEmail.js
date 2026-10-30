const { Resend } = require("resend");

// Initialize Resend with your API key from .env
const resend = new Resend(process.env.RESEND_API_KEY);

const sendOrderConfirmationEmail = async (userEmail, userName, order) => {
  try {
    // Format the order items for the email
    const itemsList = order.products
      .map(
        (item) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.product?.name || "Product"}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${(item.product?.price * item.quantity).toFixed(2)} ETB</td>
          </tr>
        `,
      )
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - E-Shop Ethiopia</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .content h2 { margin-top: 0; color: #1e293b; }
          .content p { line-height: 1.6; color: #475569; }
          .order-details { background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .order-details p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; padding: 10px; background: #e2e8f0; color: #475569; font-weight: 600; }
          .total { font-size: 1.2rem; font-weight: 700; color: #10b981; text-align: right; margin-top: 20px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
          .btn { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Order Confirmed!</h1>
            <p>ትዕዛዝዎ ተረጋግጧል!</p>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>Thank you for shopping with E-Shop Ethiopia! We have received your order and are getting it ready for shipment.</p>
            <p>እኔ ሾፕ ኢትዮጵያን ስለመረጡ እናመሰግናለን! ትዕዛዝዎን ተቀብለን ለመላክ እያዘጋጀን ነው።</p>
            
            <div class="order-details">
              <p><strong>Order ID:</strong> #${order._id.toString().slice(-6).toUpperCase()}</p>
              <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Payment Status:</strong> <span style="color: #10b981; font-weight: 600;">${order.paymentStatus.toUpperCase()}</span></p>
              <p><strong>Shipping Address:</strong> ${order.address?.city || "N/A"}, ${order.address?.subcity || "N/A"}</p>
            </div>

            <h3>Order Summary</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
            </table>

            <div class="total">
              Total: ${order.totalPrice.toFixed(2)} ETB
            </div>

            <p style="margin-top: 30px;">
              If you have any questions, simply reply to this email or contact our support team.
            </p>
            <a href="${process.env.FRONTEND_URL}/orders" class="btn">Track Your Order</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} E-Shop Ethiopia. All rights reserved.</p>
            <p>Addis Ababa, Ethiopia | support@eshopethiopia.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "E-Shop Ethiopia <onboarding@resend.dev>",
      to: [userEmail],
      subject: `Order Confirmed! #${order._id.toString().slice(-6).toUpperCase()} - E-Shop Ethiopia`,
      html: emailHtml,
    });

    if (error) {
      console.error("❌ Resend API Error:", error);
      return false;
    }

    console.log(`✅ Order confirmation email sent to ${userEmail}`);
    return true;
  } catch (err) {
    console.error("❌ Failed to send order confirmation email:", err.message);
    return false;
  }
};

module.exports = sendOrderConfirmationEmail;
