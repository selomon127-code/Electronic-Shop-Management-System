// ecommerce-app/src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { data } = await API.post("/auth/forgot-password", { email });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "450px", margin: "4rem auto", padding: "2rem", background: "white", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
      <h2 style={{ textAlign: "center", color: "#1e293b", marginBottom: "0.5rem" }}>🔐 Forgot Password?</h2>
      <p style={{ textAlign: "center", color: "#64748b", marginBottom: "2rem", fontSize: "0.95rem" }}>
        Enter your email address and we'll send you a link to reset your password.
      </p>

      {message && <div style={{ background: "#d1fae5", color: "#065f46", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem", textAlign: "center" }}>{message}</div>}
      {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem", textAlign: "center" }}>❌ {error}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
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
          {loading ? "Sending Email... 🔄" : "Send Reset Link"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem", color: "#64748b" }}>
        Remember your password?{" "}
        <Link to="/login" style={{ color: "#6366f1", fontWeight: "600", textDecoration: "none" }}>Back to Login</Link>
      </p>
    </div>
  );
}

export default ForgotPassword;