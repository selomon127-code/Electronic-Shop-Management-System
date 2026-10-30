// ecommerce-app/src/api/authApi.js
import API from "./axios";

export const authApi = {
  // ✅ REGISTER - This was missing!
  register: (userData) => API.post("/auth/register", userData),

  // ✅ LOGIN
  login: (credentials) => API.post("/auth/login", credentials),

  // ✅ FORGOT PASSWORD
  forgotPassword: (email) => API.post("/auth/forgot-password", { email }),

  // ✅ RESET PASSWORD
  resetPassword: (token, passwords) =>
    API.post(`/auth/reset-password/${token}`, passwords),

  // ✅ GET CURRENT USER
  getMe: () => API.get("/auth/me"),

  // ✅ LOGOUT (optional - just clears local storage)
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};
