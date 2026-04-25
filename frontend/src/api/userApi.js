// ecommerce-app/src/api/userApi.js
import API from "./axios";

export const userApi = {
  // GET all users (admin only)
  getAll: () => API.get("/users"),

  // DELETE user (admin only)
  delete: (id) => API.delete(`/users/${id}`),

  // UPDATE user role (admin only)
  updateRole: (id, role) => API.put(`/users/${id}/role`, { role }),
};
