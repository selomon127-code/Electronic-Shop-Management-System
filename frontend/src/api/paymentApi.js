// ecommerce-app/src/api/paymentApi.js
import API from "./axios"; // Your existing axios instance with auth interceptor

export const paymentApi = {
  // ✅ Create order with payment (hits /api/payment/create)
  createOrder: (orderData) => API.post("/payment/create", orderData),

  // ✅ Verify Chapa payment status (for polling after redirect)
  verifyChapaPayment: (txRef) => API.get(`/payment/chapa/verify/${txRef}`),
};
