// ecommerce-app/src/api/orderApi.js
import API from "./axios"; // ✅ Default import (NO curly braces!)

export const orderApi = {
  // ✅ GET current user's orders
  getMyOrders: () => API.get("/orders/my-orders"),

  // ✅ GET single order by ID
  getById: (id) => API.get(`/orders/${id}`),

  // ✅ CREATE new order
  create: (orderData) => API.post("/orders", orderData),

  // ✅ UPDATE order status (admin only)
  updateStatus: (id, status) => API.put(`/orders/${id}/status`, { status }),

  // ✅ GET admin dashboard stats (admin only) - MUST EXIST!
  getAdminStats: () => API.get("/orders/admin/stats"),

  // ✅ GET ALL orders for admin view (admin only) - MUST EXIST!
  getAllAdmin: () => API.get("/orders/admin/all"),
};
