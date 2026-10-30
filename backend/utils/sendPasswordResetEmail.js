const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  try {
    // Create the reset link (adjust the URL to match your frontend)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .btn { display: inline-block; padding: 14px 28px; background: #ef4444; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Reset Your Password</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>We received a request to reset your password for your E-Shop Ethiopia account.</p>
            <p>Click the button below to create a new password. This link will expire in 1 hour.</p>
            <p><strong>የይለፍ ቃልዎን ለመቀየር ከዚህ በታች ያለውን አገናኝ ይጠቀሙ። ይህ አገናኝ ለ 1 ሰዓት ብቻ ይሰራል።</strong></p>
            
            <a href="${resetUrl}" class="btn">Reset Password</a>
            
            <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
              If you didn't request this, please ignore this email. Your password will remain unchanged.
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
      subject: "Reset Your Password - E-Shop Ethiopia",
      html: emailHtml,
    });

    if (error) {
      console.error("❌ Resend Password Reset Error:", error);
      return false;
    }

    console.log(`✅ Password reset email sent to ${userEmail}`);
    return true;
  } catch (err) {
    console.error("❌ Failed to send password reset email:", err.message);
    return false;
  }
};

module.exports = sendPasswordResetEmail;
