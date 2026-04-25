// ecommerce-app/src/api/productApi.js
import API from "./axios";

export const productApi = {
  // GET all products
  getAll: () => API.get("/products"),

  // GET single product by ID
  getById: (id) => API.get(`/products/${id}`),

  // CREATE new product (admin only)
  create: (productData) => API.post("/products", productData),

  // UPDATE product (admin only)
  update: (id, productData) => API.put(`/products/${id}`, productData),

  // DELETE product (admin only)
  delete: (id) => API.delete(`/products/${id}`),
};
