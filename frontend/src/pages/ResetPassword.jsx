// ecommerce-app/src/pages/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { authApi } from "../api/authApi";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Validate token on mount (optional: check if token is valid format)
  useEffect(() => {
    if (!token || token.length < 32) {
      setError("Invalid reset link. Please request a new one.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Client-side validation
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { data } = await authApi.resetPassword(token, newPassword, confirmPassword);
      
      // Save new auth token and user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      setMessage("Password reset successfully! Redirecting...");
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
      
    } catch (err) {
      console.error("❌ Reset password error:", err);
      setError(err.response?.data?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  // If invalid token or error before submit
  if (error && !newPassword && !confirmPassword) {
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
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>❌</div>
          <h2 style={{ margin: "0 0 1rem 0", color: "#333" }}>Invalid Link</h2>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>
            {error}
          </p>
          <Link
            to="/forgot-password"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              background: "#667eea",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: "600"
            }}
          >
            🔁 Request New Link
          </Link>
        </div>
      </div>
    );
  }

  // If success message
  if (message) {
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
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
          <h2 style={{ margin: "0 0 1rem 0", color: "#333" }}>Password Reset!</h2>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>
            {message}
          </p>
          <div style={{ fontSize: "1.5rem" }}>🔄</div>
        </div>
      </div>
    );
  }

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
            🔑 Create New Password
          </h1>
          <p style={{ margin: 0, color: "#666" }}>
            Enter your new password below
          </p>
        </div>

        {error && (
          <p style={{ 
            color: "#dc3545", 
            background: "#ffe6e6", 
            padding: "0.75rem", 
            borderRadius: "6px", 
            marginBottom: "1rem",
            fontSize: "0.9rem"
          }}>
            ❌ {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#333" }}>
              New Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "0.85rem 1rem",
                  paddingRight: "3rem",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "1rem",
                  boxSizing: "border-box"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#667eea",
                  cursor: "pointer",
                  fontSize: "1.2rem"
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.8rem", color: "#666" }}>
              Must be at least 6 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#333" }}>
              Confirm New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
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

          {/* Password Strength Indicator (Optional) */}
          {newPassword && (
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.25rem" }}>
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    style={{
                      flex: 1,
                      height: "4px",
                      background: newPassword.length >= level * 2 ? 
                        (newPassword.length >= 8 ? "#28a745" : newPassword.length >= 6 ? "#ffc107" : "#dc3545") 
                        : "#eee",
                      borderRadius: "2px"
                    }}
                  />
                ))}
              </div>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#666" }}>
                Password strength:{" "}
                {newPassword.length < 6 ? "Weak" : newPassword.length < 8 ? "Medium" : "Strong"}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            style={{
              width: "100%",
              padding: "0.85rem",
              background: loading || !newPassword || !confirmPassword ? "#ccc" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading || !newPassword || !confirmPassword ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "1rem",
              transition: "background 0.2s"
            }}
          >
            {loading ? "Resetting... 🔄" : "Reset Password 🔐"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "#666", fontSize: "0.9rem" }}>
          <Link to="/login" style={{ color: "#667eea", textDecoration: "none", fontWeight: "600" }}>
            ← Back to Login
          </Link>
        </p>

        <p style={{ 
          textAlign: "center", 
          marginTop: "1rem", 
          fontSize: "0.8rem", 
          color: "#999",
          padding: "1rem",
          background: "#f8f9fa",
          borderRadius: "6px"
        }}>
          🔒 Reset links expire in 1 hour for security. Use a strong, unique password.
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;