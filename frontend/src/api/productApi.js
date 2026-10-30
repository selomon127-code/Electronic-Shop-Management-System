// ecommerce-app/src/api/productApi.js
import API from "./axios";

export const productApi = {
  getAll: () => API.get("/products"),
  getById: (id) => API.get(`/products/${id}`),

  create: (formData) =>
    API.post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  update: (id, formData) =>
    API.put(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  delete: (id) => API.delete(`/products/${id}`),
};
