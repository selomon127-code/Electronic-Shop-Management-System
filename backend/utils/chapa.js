// backend/utils/chapa.js
const axios = require("axios");

/**
 * Initialize Chapa payment transaction
 */
exports.initializePayment = async ({
  orderId,
  totalPrice,
  customerEmail,
  customerName,
  customerPhone,
  orderTitle,
  orderDescription,
  callbackUrl,
  returnUrl,
}) => {
  try {
    const payload = {
      amount: totalPrice.toString(),
      currency: "ETB",
      email: customerEmail,
      first_name: customerName?.split(" ")[0] || "Customer",
      last_name: customerName?.split(" ")?.slice(1)?.join(" ") || " ",
      phone_number: customerPhone,
      tx_ref: `order-${orderId}-${Date.now()}`,
      title: orderTitle || `Order #${orderId.slice(-6)}`,
      description: orderDescription || "E-Shop Ethiopia Purchase",
      callback_url:
        callbackUrl || `${process.env.BACKEND_URL}/api/payment/chapa/callback`,
      return_url:
        returnUrl ||
        `${process.env.FRONTEND_URL}/order-confirmation?order_id=${orderId}`,
      customization: {
        title: "E-Shop Ethiopia",
        description: "Secure payment via Chapa",
        logo: "https://via.placeholder.com/150x150/667eea/ffffff?text=E-Shop",
      },
    };

    console.log("🔍 Initializing Chapa payment:", {
      tx_ref: payload.tx_ref,
      amount: payload.amount,
      email: payload.email,
    });

    const response = await axios.post(
      `${process.env.CHAPA_BASE_URL}/transactions/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("✅ Chapa response:", response.data);

    // ✅ Return format frontend expects
    return {
      success: response.data.status === "success",
      message: response.data.message,
      txRef: payload.tx_ref,
      checkoutUrl: response.data.data?.checkout_url, // 🔑 CRITICAL: Frontend redirects here
      data: response.data.data,
    };
  } catch (err) {
    console.error("❌ Chapa initialize error:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });

    return {
      success: false,
      error: err.response?.data?.message || err.message,
      status: err.response?.status,
      checkoutUrl: null, // Always include checkoutUrl
    };
  }
};

/**
 * Verify Chapa payment status
 */
exports.verifyPayment = async (txRef) => {
  try {
    const response = await axios.get(
      `${process.env.CHAPA_BASE_URL}/transactions/verify/${txRef}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = response.data.data;

    return {
      success: response.data.status === "success",
      status: data?.status,
      amount: data?.amount,
      currency: data?.currency,
      method: data?.method,
      message: response.data.message,
      data: data,
    };
  } catch (err) {
    console.error("❌ Chapa verify error:", err.message);
    return {
      success: false,
      error: err.message,
      status: err.response?.status,
    };
  }
};
