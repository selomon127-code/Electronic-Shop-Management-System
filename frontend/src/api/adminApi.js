// ecommerce-app/src/api/adminApi.js
import API from "./axios";

// ✅ WISHLIST API - Now sends full product data
export const wishlistApi = {
  getWishlist: () => API.get("/wishlist"),

  // ✅ Send full product details
  addToWishlist: (product) =>
    API.post("/wishlist", {
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      description: product.description,
      stock: product.stock,
    }),

  removeFromWishlist: (productId) => API.delete(`/wishlist/${productId}`),
  clearWishlist: () => API.delete("/wishlist"),
};
// Add to ecommerce-app/src/api/adminApi.js

export const profileApi = {
  // Profile
  getProfile: () => API.get("/users/profile"),
  updateProfile: (data) => API.put("/users/profile", data),
  changePassword: (data) => API.post("/users/change-password", data),

  // Orders
  getMyOrders: () => API.get("/users/orders"),

  // Addresses
  getAddresses: () => API.get("/users/addresses"),
  addAddress: (data) => API.post("/users/addresses", data),
  updateAddress: (id, data) => API.put(`/users/addresses/${id}`, data),
  deleteAddress: (id) => API.delete(`/users/addresses/${id}`),
};

// ✅ ADMIN API
export const adminApi = {
  // Dashboard
  getDashboard: () => API.get("/admin/dashboard"),

  // Orders
  getOrders: (params = {}) => API.get("/admin/orders", { params }),
  getOrder: (id) => API.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) =>
    API.put(`/admin/orders/${id}/status`, { status }),
  updatePaymentStatus: (id, paymentStatus) =>
    API.put(`/admin/orders/${id}/payment-status`, { paymentStatus }),
  deleteOrder: (id) => API.delete(`/admin/orders/${id}`),

  // Users
  getUsers: (params = {}) => API.get("/admin/users", { params }),
  getUser: (id) => API.get(`/admin/users/${id}`),
  createUser: (userData) => API.post("/admin/users", userData),
  updateUserRole: (id, role) => API.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),

  // Products
  getProducts: (params = {}) => API.get("/admin/products", { params }),
  getProduct: (id) => API.get(`/admin/products/${id}`),
  createProduct: (productData) => API.post("/admin/products", productData),
  updateProduct: (id, productData) =>
    API.put(`/admin/products/${id}`, productData),
  deleteProduct: (id) => API.delete(`/admin/products/${id}`), // ✅ FIXED!
};
export const reviewApi = {
  createReview: (data) => API.post("/reviews", data),
  getProductReviews: (productId) => API.get(`/reviews/product/${productId}`),
  deleteReview: (id) => API.delete(`/reviews/${id}`),
};
