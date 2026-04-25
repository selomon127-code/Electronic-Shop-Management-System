// ecommerce-app/src/pages/ForgotPassword.jsx
// ecommerce-app/src/pages/ForgotPassword.jsx - TOP OF FILE:
import React, { useState } from "react";
import { Link } from "react-router-dom";  // ✅ MUST IMPORT useNavigate
import { authApi } from "../api/authApi";

function ForgotPassword() {
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
      setMessage("If an account with that email exists, a reset link has been sent.");
    } catch (err) {
      console.error("❌ Forgot password error:", err);
      setError(err.response?.data?.message || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "2rem"
      }}>
        <div style={{ 
          background: "white", 
          padding: "2.5rem", 
          borderRadius: "12px", 
          maxWidth: "450px", 
          width: "100%",
          textAlign: "center",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✉️</div>
          <h2 style={{ margin: "0 0 1rem 0", color: "#333" }}>Check Your Email</h2>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>{message}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button
              onClick={() => { setSubmitted(false); setEmail(""); }}
              style={{
                padding: "0.75rem",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              🔁 Send Another Link
            </button>
            <Link
              to="/login"
              style={{
                padding: "0.75rem",
                background: "transparent",
                color: "#667eea",
                border: "2px solid #667eea",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "600",
                textAlign: "center"
              }}
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "2rem"
    }}>
      <div style={{ 
        background: "white", 
        padding: "2.5rem", 
        borderRadius: "12px", 
        maxWidth: "450px", 
        width: "100%",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ margin: "0 0 0.5rem 0", color: "#333", fontSize: "1.8rem" }}>
            🔐 Forgot Password?
          </h1>
          <p style={{ margin: 0, color: "#666" }}>Enter your email to receive a reset link</p>
        </div>

        {error && (
          <p style={{ color: "#dc3545", background: "#ffe6e6", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>
            ❌ {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#333" }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.85rem 1rem",
                borderRadius: "8px",
                border: "1px solid #ddd",
                fontSize: "1rem",
                boxSizing: "border-box"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            style={{
              width: "100%",
              padding: "0.85rem",
              background: loading || !email.trim() ? "#ccc" : "#667eea",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading || !email.trim() ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "1rem"
            }}
          >
            {loading ? "Sending... 🔄" : "Send Reset Link ✉️"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "#666" }}>
          Remember your password?{" "}
          <Link to="/login" style={{ color: "#667eea", textDecoration: "none", fontWeight: "600" }}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;