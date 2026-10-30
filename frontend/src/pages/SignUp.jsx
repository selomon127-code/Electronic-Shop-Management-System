import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "../api/authApi";
import PasswordInput from "../components/PasswordInput";
import GoogleButton from "../components/GoogleButton";
import "../styles/auth.css";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD_LENGTH = 6;

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

function Signup() {
  const navigate = useNavigate();
  const { t } = useTranslation(); // ✅ Initialize translation here
  const redirectTimer = useRef(null);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
  };

  const validate = () => {
    const next = {};
    const { name, email, password, confirmPassword } = formData;

    if (name.trim().length < 2) {
      next.name = t("auth.name_required") || "Please enter your full name.";
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      next.email = t("auth.email_invalid") || "Please enter a valid email address.";
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = t("auth.password_length") || `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (confirmPassword !== password) {
      next.confirmPassword = t("auth.password_mismatch") || "Passwords don't match.";
    }
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || success) return;

    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    const email = formData.email.trim().toLowerCase();

    try {
      await authApi.register({
        name: formData.name.trim(),
        email,
        phone: formData.phone.trim(),
        password: formData.password,
      });

      setSuccess(true);

      redirectTimer.current = setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            message: t("auth.signup_success") || "Account created successfully! Please sign in.",
            email,
          },
        });
      }, 1500);
    } catch (err) {
      const message = err.response?.data?.message;

      if (!err.response) {
        setErrors({
          general: t("common.server_error") || "Cannot reach the server. Check your connection and try again.",
        });
      } else if (message && /already exists/i.test(message)) {
        setErrors({ email: t("auth.email_exists") || "An account with this email already exists." });
      } else {
        setErrors({
          general: message || t("auth.signup_failed") || "Registration failed. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const locked = isLoading || success;
  const passwordsMatch = formData.confirmPassword && formData.password === formData.confirmPassword;

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div className="auth-header">
          <div className="auth-logo" aria-hidden="true">📝</div>
          <h1 className="auth-title">{t("auth.create_account_title") || "Create your account"}</h1>
          <p className="auth-subtitle">{t("auth.join_eshop") || "Join E-Shop Ethiopia today"}</p>
        </div>

        {success && (
          <div className="auth-alert auth-alert--success" role="status">
            {t("auth.redirecting") || "Account created! Redirecting to sign in..."}
          </div>
        )}

        {errors.general && (
          <div className="auth-alert auth-alert--error" role="alert">
            {errors.general}
          </div>
        )}

        <GoogleButton label={t("auth.signup_with_google") || "Sign up with Google"} disabled={locked} />

        <div className="auth-divider">{t("auth.or_sign_up_email") || "or sign up with email"}</div>

        <div className="auth-field">
          <label htmlFor="name" className="auth-label">{t("auth.full_name")}</label>
          <input
            id="name" name="name" type="text" placeholder="Abebe Kebede" value={formData.name}
            onChange={handleChange} autoComplete="name" disabled={locked}
            aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined}
            className={`auth-input${errors.name ? " auth-input--invalid" : ""}`}
          />
          {errors.name && <p id="name-error" className="auth-field-error">{errors.name}</p>}
        </div>

        <div className="auth-field">
          <label htmlFor="email" className="auth-label">{t("auth.email")}</label>
          <input
            id="email" name="email" type="email" placeholder="you@example.com" value={formData.email}
            onChange={handleChange} autoComplete="email" disabled={locked}
            aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined}
            className={`auth-input${errors.email ? " auth-input--invalid" : ""}`}
          />
          {errors.email && <p id="email-error" className="auth-field-error">{errors.email}</p>}
        </div>

        <div className="auth-field">
          <label htmlFor="phone" className="auth-label">
            {t("auth.phone")} <span className="auth-optional">({t("auth.optional") || "optional"})</span>
          </label>
          <input
            id="phone" name="phone" type="tel" placeholder="+251 9XX XXX XXX" value={formData.phone}
            onChange={handleChange} autoComplete="tel" disabled={locked} className="auth-input"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password" className="auth-label">{t("auth.password")}</label>
          <PasswordInput
            id="password" name="password" value={formData.password} onChange={handleChange}
            placeholder={`${t("auth.at_least")} ${MIN_PASSWORD_LENGTH} ${t("auth.characters")}`}
            autoComplete="new-password" disabled={locked} required={false}
            invalid={Boolean(errors.password)} describedBy={errors.password ? "password-error" : undefined}
          />
          {errors.password && <p id="password-error" className="auth-field-error">{errors.password}</p>}
        </div>

        <div className="auth-field">
          <label htmlFor="confirmPassword" className="auth-label">{t("auth.confirm_password")}</label>
          <PasswordInput
            id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
            placeholder={t("auth.re_enter_password") || "Re-enter your password"} autoComplete="new-password"
            disabled={locked} required={false} invalid={Boolean(errors.confirmPassword) || (!passwordsMatch && formData.confirmPassword)}
            describedBy="confirm-feedback"
          />
          <div id="confirm-feedback" aria-live="polite">
            {errors.confirmPassword ? (
              <p className="auth-field-error">{errors.confirmPassword}</p>
            ) : passwordsMatch ? (
              <p className="auth-field-ok">✓ {t("auth.passwords_match") || "Passwords match"}</p>
            ) : null}
          </div>
        </div>

        <button type="submit" className="auth-btn auth-btn--primary" disabled={locked} style={{ marginTop: "0.5rem" }}>
          {isLoading && <span className="auth-spinner" aria-hidden="true" />}
          {isLoading ? (t("common.loading") || "Creating account...") : success ? (t("auth.account_created") || "Account created ✓") : (t("auth.create_account_btn") || "Create account")}
        </button>

        <p className="auth-footer">
          {t("auth.have_account")}{" "}
          <Link to="/login" className="auth-link">{t("auth.sign_in")}</Link>
        </p>
      </form>
    </div>
  );
}

export default Signup;