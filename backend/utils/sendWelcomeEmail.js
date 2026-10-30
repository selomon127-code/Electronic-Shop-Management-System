const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .btn { display: inline-block; padding: 14px 28px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to E-Shop Ethiopia!</h1>
            <p>እንኳን ደህና መጡ!</p>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>Thank you for joining E-Shop Ethiopia! We are thrilled to have you as part of our community.</p>
            <p>You can now browse our premium electronics, track your orders, and enjoy exclusive deals.</p>
            
            <a href="${process.env.FRONTEND_URL}/products" class="btn">Start Shopping</a>
            
            <p style="margin-top: 30px;">
              If you have any questions, our AI support chatbot is available 24/7, or you can reply to this email.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} E-Shop Ethiopia. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "E-Shop Ethiopia <onboarding@resend.dev>",
      to: [userEmail],
      subject: "Welcome to E-Shop Ethiopia! 🇪🇹",
      html: emailHtml,
    });

    if (error) {
      console.error("❌ Resend Welcome Email Error:", error);
      return false;
    }

    console.log(`✅ Welcome email sent to ${userEmail}`);
    return true;
  } catch (err) {
    console.error("❌ Failed to send welcome email:", err.message);
    return false;
  }
};

module.exports = sendWelcomeEmail;
