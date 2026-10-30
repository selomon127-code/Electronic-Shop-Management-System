// ecommerce-app/src/pages/ResetPassword.jsx
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/axios";

function ResetPassword() {
  const { token } = useParams();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }

    setLoading(true);

    try {
      const { data } = await API.post(`/auth/reset-password/${token}`, { password });
      
      // ✅ 1. Nuke the old session completely
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // ✅ 2. Show success message
      setMessage(data.message || "Password updated successfully!");
      
      // ✅ 3. FORCE a hard browser redirect to Login (bypasses React Router cache)
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      
    } catch (err) {
      console.error("❌ Reset error:", err);
      setError(err.response?.data?.message || "Failed to reset password. Link may be expired.");
    } finally {
      setLoading(false);
    }
  };

  if (message) {
    return (
      <div style={{ maxWidth: "450px", margin: "4rem auto", padding: "2rem", background: "white", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
        <h2 style={{ color: "#10b981", marginBottom: "1rem" }}>Password Updated!</h2>
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>{message}</p>
        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "450px", margin: "4rem auto", padding: "2rem", background: "white", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
      <h2 style={{ textAlign: "center", color: "#1e293b", marginBottom: "0.5rem" }}>🔑 Reset Password</h2>
      <p style={{ textAlign: "center", color: "#64748b", marginBottom: "2rem", fontSize: "0.95rem" }}>
        Enter your new password below.
      </p>

      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem", textAlign: "center", border: "1px solid #fecaca" }}>
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Must be at least 6 characters"
            style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Repeat password"
            style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", boxSizing: "border-box" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "1rem",
            background: loading ? "#94a3b8" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "700",
            fontSize: "1rem",
            marginTop: "0.5rem"
          }}
        >
          {loading ? "Updating Password... 🔄" : "Reset Password"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem", color: "#64748b" }}>
        <Link to="/login" style={{ color: "#6366f1", fontWeight: "600", textDecoration: "none" }}>← Back to Login</Link>
      </p>
    </div>
  );
}

export default ResetPassword;