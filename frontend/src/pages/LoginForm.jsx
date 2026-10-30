import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "../api/authApi";
import PasswordInput from "../components/PasswordInput";
import GoogleButton from "../components/GoogleButton";
import "../styles/auth.css";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const GOOGLE_ERRORS = {
  google_auth_failed: "Google authentication failed. Please try again.",
  server_error: "Server error during Google login. Please try again.",
  invalid_data: "Invalid authentication data received.",
  no_token: "Authentication token not received.",
};

function LoginForm({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(); // ✅ Initialize translation

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const googleErrorKey = new URLSearchParams(location.search).get("error");
  const googleError = googleErrorKey ? GOOGLE_ERRORS[googleErrorKey] || t("common.error") : "";

  useEffect(() => {
    if (location.state?.email) setEmail(location.state.email);
  }, [location.state?.email]);

  const validate = () => {
    const next = {};
    if (!EMAIL_REGEX.test(email.trim())) next.email = t("auth.email_invalid") || "Please enter a valid email address.";
    if (!password) next.password = t("auth.password_required") || "Please enter your password.";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      const { data } = await authApi.login({ email: email.trim(), password });
      onLogin(data.user, data.token);
      navigate(data.user?.role === "admin" ? "/admin/dashboard" : "/", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (!err.response) setErrors({ general: t("common.server_error") || "Cannot reach the server." });
      else if (data?.useGoogle) setErrors({ general: t("auth.use_google") || "This account uses Google Sign-In." });
      else setErrors({ general: data?.message || t("auth.login_failed") });
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = (field) => setErrors((prev) => ({ ...prev, [field]: "", general: "" }));

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div className="auth-header">
          <div className="auth-logo" aria-hidden="true">🔐</div>
          <h1 className="auth-title">{t("auth.welcome_back") || "Welcome back"}</h1>
          <p className="auth-subtitle">{t("auth.sign_in_subtitle") || "Sign in to your E-Shop Ethiopia account"}</p>
        </div>
        {googleError && <div className="auth-alert auth-alert--error">{googleError}</div>}
        {location.state?.message && <div className="auth-alert auth-alert--success">{location.state.message}</div>}
        {errors.general && <div className="auth-alert auth-alert--error">{errors.general}</div>}

        <GoogleButton disabled={isLoading} />
        <div className="auth-divider">{t("auth.or_sign_in") || "or sign in with email"}</div>

        <div className="auth-field">
          <label htmlFor="email" className="auth-label">{t("auth.email")}</label>
          <input id="email" name="email" type="email" placeholder="you@example.com" value={email}
            onChange={(e) => { setEmail(e.target.value); clearError("email"); }} disabled={isLoading}
            className={`auth-input${errors.email ? " auth-input--invalid" : ""}`} />
          {errors.email && <p className="auth-field-error">{errors.email}</p>}
        </div>

        <div className="auth-field">
          <label htmlFor="password" className="auth-label">{t("auth.password")}</label>
          <PasswordInput id="password" name="password" value={password}
            onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
            placeholder={t("auth.enter_password") || "Enter your password"} disabled={isLoading}
            invalid={Boolean(errors.password)} />
          {errors.password && <p className="auth-field-error">{errors.password}</p>}
        </div>

        <div className="auth-row">
          <Link to="/forgot-password" className="auth-link">{t("auth.forgot_password")}</Link>
        </div>

        <button type="submit" className="auth-btn auth-btn--primary" disabled={isLoading}>
          {isLoading ? t("common.loading") : t("auth.login_btn")}
        </button>

        <p className="auth-footer">
          {t("auth.no_account")} <Link to="/signup" className="auth-link">{t("auth.create_account")}</Link>
        </p>
      </form>
    </div>
  );
}
export default LoginForm;