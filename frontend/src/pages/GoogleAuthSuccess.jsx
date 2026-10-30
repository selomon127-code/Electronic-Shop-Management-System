// ecommerce-app/src/pages/GoogleAuthSuccess.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authApi } from "../api/authApi";

function GoogleAuthSuccess({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("Verifying your account... 🔄");

  useEffect(() => {
    const handleGoogleAuth = async () => {
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get("token");

      if (!token) {
        setStatus("❌ Authentication failed. No token received.");
        setTimeout(() => navigate("/login?error=no_token", { replace: true }), 2000);
        return;
      }

      try {
        console.log("✅ Token received, saving to localStorage...");
        localStorage.setItem("token", token);
        
        console.log("🚀 Fetching user profile from /api/auth/me...");
        const { data } = await authApi.getMe();
        console.log("✅ User profile fetched successfully:", data);
        
        if (onLogin) {
          onLogin(data, token);
        }

        if (data.role === "admin") {
          console.log("🔑 Admin detected, redirecting to /admin/dashboard");
          navigate("/admin/dashboard", { replace: true });
        } else {
          console.log("👤 User detected, redirecting to /");
          navigate("/", { replace: true });
        }
      } catch (err) {
        // ✅ THIS IS THE CRITICAL LOG WE NEED TO SEE
        console.error("❌ FAILED TO FETCH USER DETAILS:");
        console.error("Error object:", err);
        console.error("Error response data:", err.response?.data);
        console.error("Error status:", err.response?.status);
        
        setStatus("❌ Failed to complete login. Check console (F12) for details.");
        setTimeout(() => navigate("/login?error=server_error", { replace: true }), 3000);
      }
    };

    handleGoogleAuth();
  }, [location, navigate, onLogin]);

  return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <h2 style={{ fontSize: "1.5rem", color: "#1e293b" }}>{status}</h2>
      <p style={{ color: "#64748b", marginTop: "1rem" }}>Please wait while we securely log you in.</p>
    </div>
  );
}

export default GoogleAuthSuccess;