// backend/utils/telebirr.js
const axios = require("axios");
const crypto = require("crypto");

const TELEBIRR_APP_KEY = process.env.TELEBIRR_APP_KEY;
const TELEBIRR_PUBLIC_KEY = process.env.TELEBIRR_PUBLIC_KEY;
const TELEBIRR_PRIVATE_KEY = process.env.TELEBIRR_PRIVATE_KEY;
const TELEBIRR_BASE_URL =
  process.env.TELEBIRR_BASE_URL || "https://api.telebirr.et/superapp/v1";

/**
 * Generate Telebirr signature
 */
const generateSignature = (data, privateKey) => {
  const sortedKeys = Object.keys(data).sort();
  const stringToSign = sortedKeys.map((key) => `${key}=${data[key]}`).join("&");
  return crypto
    .createHmac("sha256", privateKey)
    .update(stringToSign)
    .digest("hex")
    .toUpperCase();
};

/**
 * Initialize Telebirr payment (USSD Push)
 * @param {Object} orderData - Order details
 * @returns {Promise<Object>} - Payment initiation result
 */
exports.initializePayment = async (orderData) => {
  try {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14);
    const txRef = `TB_${orderData.orderId}_${Date.now()}`;

    const payload = {
      appKey: TELEBIRR_APP_KEY,
      nonce: Math.random().toString(36).substring(2, 15),
      timestamp,
      signType: "HMAC-SHA256",
      notifyUrl: `${process.env.BACKEND_URL}/api/payment/telebirr/callback`,
      returnUrl: `${process.env.FRONTEND_URL}/payment-success?ref=${orderData.orderId}`,
      shortCode: "201234", // Your Telebirr short code
      amount: orderData.totalPrice.toString(),
      subject: orderData.orderTitle || "E-Shop Order",
      body: orderData.orderDescription || "Payment for your order",
      merchantOrderNo: txRef,
      timeoutExpress: "5m",
    };

    // Generate signature
    payload.sign = generateSignature(
      { ...payload, appKey: TELEBIRR_APP_KEY, nonce: payload.nonce, timestamp },
      TELEBIRR_PRIVATE_KEY,
    );

    const response = await axios.post(
      `${TELEBIRR_BASE_URL}/online/unionpay/pay`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          appKey: TELEBIRR_APP_KEY,
        },
      },
    );

    if (response.data.respCode === "0000") {
      return {
        success: true,
        txRef,
        message: "USSD push sent. Please check your phone to complete payment.",
      };
    }

    return {
      success: false,
      error: response.data.respMsg || "Telebirr initialization failed",
    };
  } catch (error) {
    console.error(
      "❌ Telebirr API error:",
      error.response?.data || error.message,
    );
    return { success: false, error: error.message };
  }
};

/**
 * Verify Telebirr payment status
 * @param {String} txRef - Transaction reference
 * @returns {Promise<Object>} - Payment verification result
 */
exports.verifyPayment = async (txRef) => {
  try {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14);

    const payload = {
      appKey: TELEBIRR_APP_KEY,
      nonce: Math.random().toString(36).substring(2, 15),
      timestamp,
      signType: "HMAC-SHA256",
      merchantOrderNo: txRef,
    };

    payload.sign = generateSignature(
      { ...payload, appKey: TELEBIRR_APP_KEY, nonce: payload.nonce, timestamp },
      TELEBIRR_PRIVATE_KEY,
    );

    const response = await axios.post(
      `${TELEBIRR_BASE_URL}/online/unionpay/query`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          appKey: TELEBIRR_APP_KEY,
        },
      },
    );

    if (response.data.respCode === "0000") {
      const payment = response.data.data;
      return {
        success: true,
        status: payment.orderStatus, // "0": pending, "1": success, "2": failed
        amount: payment.amount,
        paidAt: payment.payTime,
      };
    }

    return { success: false, error: response.data.respMsg };
  } catch (error) {
    console.error(
      "❌ Telebirr verify error:",
      error.response?.data || error.message,
    );
    return { success: false, error: error.message };
  }
};
