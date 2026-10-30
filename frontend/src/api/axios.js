import axios from "axios";
import i18n from "../i18n"; // ✅ Import i18n to get current language

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ✅ Attach JWT token AND current language to all requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  // ✅ Send current language to backend (defaults to 'am' if not set)
  config.headers["Accept-Language"] = i18n.language || "am";
  return config;
});

// ✅ Handle 401 unauthorized globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default API;
