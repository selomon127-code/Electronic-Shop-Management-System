// ecommerce-app/src/api/cartApi.js
import API from "./axios";

export const cartApi = {
  // Sync cart to backend
  sync: (cartItems) => API.post("/cart/sync", { items: cartItems }),

  // Get user's saved cart
  get: () => API.get("/cart"),

  // Clear user's cart
  clear: () => API.delete("/cart"),
};
