// ecommerce-app/src/pages/SignUp.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api/authApi";

// eslint-disable-next-line no-unused-vars
function Signup({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(""); // ← New: success feedback

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords don't match" });
      return;
    }
    if (formData.password.length < 6) {
      setErrors({ password: "Password must be at least 6 characters" });
      return;
    }

    setIsLoading(true);

    try {
      // 🔐 Call backend register API
      await authApi.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      // ✅ Show success message + redirect to LOGIN (not home!)
      setSuccessMessage("✅ Account created! Please login to continue.");
      
      // 🔐 Redirect to login page after 1.5 seconds
      setTimeout(() => {
        navigate("/login", { 
          state: { 
            message: "Account created! Please login.",
            email: formData.email // ← Pre-fill email on login page (optional)
          } 
        });
      }, 1500);
      
    } catch (err) {
      console.error("Registration error:", err);
      setErrors({
        general: err.response?.data?.message || "Registration failed. Email may already exist."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>📝 Create Account</h2>

        {/* ✅ Success Message */}
        {successMessage && (
          <p className="success" style={{ color: "#28a745", background: "#d4edda", padding: "0.5rem", borderRadius: "4px" }}>
            {successMessage}
          </p>
        )}

        {/* ❌ Error Message */}
        {errors.general && <p className="error">❌ {errors.general}</p>}

        <input
          name="name"
          id="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          disabled={isLoading || successMessage}
          required
        />
        {errors.name && <p className="error">{errors.name}</p>}

        <input
          name="email"
          id="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading || successMessage}
          required
        />
        {errors.email && <p className="error">{errors.email}</p>}

        <input
          name="password"
          id="password"
          type="password"
          placeholder="Password (min 6 characters)"
          value={formData.password}
          onChange={handleChange}
          disabled={isLoading || successMessage}
          required
        />
        {errors.password && <p className="error">{errors.password}</p>}

        <input
          name="confirmPassword"
          id="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={isLoading || successMessage}
          required
        />
        {errors.confirmPassword && <p className="error">{errors.confirmPassword}</p>}

        <button 
          type="submit" 
          disabled={isLoading || successMessage}
          style={{ opacity: isLoading || successMessage ? 0.6 : 1 }}
        >
          {isLoading ? "Creating Account... 🔄" : "Sign Up"}
        </button>

        <p className="signup-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default Signup;