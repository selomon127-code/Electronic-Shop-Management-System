// ecommerce-app/src/api/authApi.js
import API from "./axios";

export const authApi = {
  // Existing methods
  register: (userData) => API.post("/auth/register", userData),
  login: (credentials) => API.post("/auth/login", credentials),
  getMe: () => API.get("/auth/me"),

  // ✅ NEW: Password reset methods
  forgotPassword: (email) => API.post("/auth/forgot-password", { email }),
  resetPassword: (token, newPassword, confirmPassword) =>
    API.post(`/auth/reset-password/${token}`, { newPassword, confirmPassword }),
};
