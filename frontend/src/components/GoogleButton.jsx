// ecommerce-app/src/components/GoogleButton.jsx
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import API from "../api/axios";

let recaptchaScriptPromise;

function loadRecaptcha() {
  if (window.grecaptcha?.render && window.grecaptcha?.ready) {
    return new Promise((resolve) => window.grecaptcha.ready(() => resolve(window.grecaptcha)));
  }
  if (!recaptchaScriptPromise) {
    recaptchaScriptPromise = new Promise((resolve, reject) => {
      let timeoutId;
      const waitForApi = () => {
        const grecaptcha = window.grecaptcha;
        if (grecaptcha?.render && grecaptcha?.ready) {
          window.clearInterval(intervalId);
          window.clearTimeout(timeoutId);
          grecaptcha.ready(() => resolve(grecaptcha));
        }
      };
      const intervalId = window.setInterval(waitForApi, 50);
      timeoutId = window.setTimeout(() => {
        window.clearInterval(intervalId);
        recaptchaScriptPromise = null;
        reject(new Error("Google reCAPTCHA API did not become ready after loading"));
      }, 10000);
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = waitForApi;
      script.onerror = () => {
        window.clearInterval(intervalId);
        window.clearTimeout(timeoutId);
        recaptchaScriptPromise = null;
        reject(new Error("Could not load Google reCAPTCHA"));
      };
      document.head.appendChild(script);
    });
  }
  return recaptchaScriptPromise;
}

function GoogleButton({ label = "Continue with Google", disabled = false }) {
  const { t } = useTranslation();
  const captchaContainer = useRef(null);
  const widgetId = useRef(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return undefined;
    let active = true;

    loadRecaptcha()
      .then((grecaptcha) => {
        if (!active || !captchaContainer.current) return;
        try {
          widgetId.current = grecaptcha.render(captchaContainer.current, {
            sitekey: siteKey,
            callback: (token) => {
              setCaptchaToken(token);
              setError("");
            },
            "expired-callback": () => {
              setCaptchaToken("");
              setError(t("auth.recaptcha_expired"));
            },
            "error-callback": () => {
              console.error("Google reCAPTCHA widget could not load; check the site key domain and browser network/ad-block settings.");
              setCaptchaToken("");
              setError(t("auth.recaptcha_load_failed"));
            },
          });
          setCaptchaReady(true);
        } catch (renderError) {
          console.error("Could not render Google reCAPTCHA widget:", renderError);
          setError(t("auth.recaptcha_load_failed"));
        }
      })
      .catch((loadError) => {
        console.error("Could not load Google reCAPTCHA:", loadError);
        if (active) setError(t("auth.recaptcha_load_failed"));
      });

    return () => {
      active = false;
      if (widgetId.current !== null && window.grecaptcha?.reset) {
        window.grecaptcha.reset(widgetId.current);
        widgetId.current = null;
      }
      captchaContainer.current?.replaceChildren();
    };
  }, [siteKey, t]);

  const handleClick = async () => {
    if (!captchaToken || loading) return;
    setLoading(true);
    setError("");
    try {
      await API.post("/auth/google/verify-captcha", { token: captchaToken });
      const apiBase = API.defaults.baseURL.replace(/\/$/, "");
      window.location.assign(`${apiBase}/auth/google`);
    } catch (verificationError) {
      console.error("Google sign-in verification failed:", verificationError);
      setCaptchaToken("");
      const errorCode = verificationError.response?.data?.code;
      const errorKey = {
        recaptcha_secret_missing: "recaptcha_not_configured",
        recaptcha_secret_invalid: "recaptcha_secret_invalid",
        recaptcha_token_expired: "recaptcha_expired",
        recaptcha_token_invalid: "recaptcha_token_invalid",
        recaptcha_provider_error: "recaptcha_provider_error",
      }[errorCode] || "recaptcha_verify_failed";
      setError(t(`auth.${errorKey}`));
      if (widgetId.current !== null && window.grecaptcha?.reset) {
        window.grecaptcha.reset(widgetId.current);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {siteKey ? (
        <div ref={captchaContainer} style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }} />
      ) : (
        <p role="alert" style={{ color: "#b91c1c", fontSize: "0.9rem" }}>
          {t("auth.recaptcha_not_configured")}
        </p>
      )}
      {error && <p role="alert" style={{ color: "#b91c1c", fontSize: "0.9rem" }}>{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading || !captchaReady || !captchaToken}
        style={{
          width: "100%",
          padding: "0.85rem",
          background: "white",
          color: "#333",
          border: "2px solid #ddd",
          borderRadius: "8px",
          cursor: disabled || loading || !captchaReady || !captchaToken ? "not-allowed" : "pointer",
          fontWeight: "600",
          fontSize: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          transition: "all 0.2s",
          opacity: disabled || loading || !captchaReady || !captchaToken ? 0.6 : 1,
        }}
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt=""
          aria-hidden="true"
          style={{ width: "20px", height: "20px" }}
        />
        {loading ? t("auth.recaptcha_verifying") : label}
      </button>
    </div>
  );
}

export default GoogleButton;