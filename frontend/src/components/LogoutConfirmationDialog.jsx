import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

function LogoutConfirmationDialog({ onCancel, onConfirm }) {
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "rgba(15, 23, 42, 0.6)",
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-message"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "1.5rem",
          borderRadius: "16px",
          background: "var(--surface, #fff)",
          color: "var(--text-primary, #0f172a)",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h2 id="logout-dialog-title" style={{ margin: "0 0 0.75rem", fontSize: "1.25rem" }}>
          {t("nav.logout")}
        </h2>
        <p id="logout-dialog-message" style={{ margin: "0 0 1.5rem", lineHeight: 1.5, color: "var(--text-secondary, #475569)" }}>
          {t("nav.logout_confirm")}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            style={{
              padding: "0.65rem 1rem",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {t("admin.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "0.65rem 1rem",
              border: "none",
              borderRadius: "8px",
              background: "#dc2626",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {t("nav.logout")}
          </button>
        </div>
      </section>
    </div>
  );
}

export default LogoutConfirmationDialog;
