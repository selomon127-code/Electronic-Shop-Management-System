// ecommerce-app/src/pages/LoginForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { authApi } from "../api/authApi";

function LoginForm({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill email if passed from signup
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state?.email]);

  // Real-time validation
  useEffect(() => {
    const validEmail = /\S+@\S+\.\S+/.test(email);
    const validPassword = password.length >= 6;
    setErrors(prev => ({ 
      ...prev, 
      email: validEmail ? "" : prev.email,
      password: validPassword ? "" : prev.password
    }));
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const { data } = await authApi.login({ email, password });
      
      // ✅ Pass user and token to parent (App.jsx)
      onLogin(data.user, data.token);
      
      // 🔐 ROLE-BASED REDIRECT
      if (data.user?.isAdmin === true) {
        // ✅ Admin goes to dashboard with left sidebar
        navigate("/admin/dashboard", { replace: true });
      } else {
        // ✅ Regular user goes to home page with navbar
        navigate("/", { replace: true });
      }
      
    } catch (err) {
      console.error("Login error:", err);
      setErrors({
        general: err.response?.data?.message || "Login failed. Please check your credentials."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "80vh",
      padding: "1rem"
    }}>
      <form className="login-form" onSubmit={handleSubmit} style={{
        width: "100%",
        maxWidth: "400px",
        background: "white",
        padding: "2rem",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem", color: "#333" }}>🔐 Login</h2>
        
        {/* Success message from signup */}
        {location.state?.message && (
          <p style={{ 
            color: "#28a745", 
            background: "#d4edda", 
            padding: "0.75rem", 
            borderRadius: "6px",
            marginBottom: "1rem",
            textAlign: "center",
            margin: "0 0 1rem 0"
          }}>
            ✅ {location.state.message}
          </p>
        )}

        {/* General error */}
        {errors.general && (
          <p style={{ 
            color: "#dc3545", 
            background: "#ffe6e6", 
            padding: "0.75rem", 
            borderRadius: "6px",
            marginBottom: "1rem",
            textAlign: "center"
          }}>
            ❌ {errors.general}
          </p>
        )}

        {/* Email Input */}
        <div style={{ marginBottom: "1rem" }}>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "1rem",
              boxSizing: "border-box"
            }}
          />
          {errors.email && <p style={{ color: "#dc3545", fontSize: "0.85rem", marginTop: "0.25rem" }}>{errors.email}</p>}
        </div>

        {/* Password Input */}
        <div style={{ marginBottom: "1.5rem" }}>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "6px",
              border: "1px solid #ddd",
              fontSize: "1rem",
              boxSizing: "border-box"
            }}
          />
          {errors.password && <p style={{ color: "#dc3545", fontSize: "0.85rem", marginTop: "0.25rem" }}>{errors.password}</p>}
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isLoading || !email || !password}
          style={{
            width: "100%",
            padding: "0.75rem",
            background: isLoading || !email || !password ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: isLoading || !email || !password ? "not-allowed" : "pointer",
            fontSize: "1rem",
            fontWeight: "600",
            transition: "background 0.2s"
          }}
        >
          {isLoading ? "Logging in... 🔄" : "Login"}
        </button>

        {/* Signup Link */}
        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "#666" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "#007bff", textDecoration: "none", fontWeight: "500" }}>
            Create Account
          </Link>
        </p>
        
<p style={{ textAlign: "center", marginTop: "1.5rem", color: "#666" }}>
  <Link 
    to="/forgot-password" 
    style={{ color: "#667eea", textDecoration: "none", fontWeight: "600" }}
  >
    Forgot your password?
  </Link>
</p>
      </form>
    </div>
  );
}

export default LoginForm;