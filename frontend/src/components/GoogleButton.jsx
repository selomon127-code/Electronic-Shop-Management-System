// ecommerce-app/src/components/GoogleButton.jsx
import React from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function GoogleButton({ label = "Continue with Google", disabled = false }) {
  const handleClick = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "0.85rem",
        background: "white",
        color: "#333",
        border: "2px solid #ddd",
        borderRadius: "8px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: "600",
        fontSize: "1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        marginBottom: "1.5rem",
        transition: "all 0.2s",
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "#f8f9fa";
          e.currentTarget.style.borderColor = "#4285f4";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(66,133,244,0.2)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "white";
        e.currentTarget.style.borderColor = "#ddd";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt=""
        aria-hidden="true"
        style={{ width: "20px", height: "20px" }}
      />
      {label}
    </button>
  );
}

export default GoogleButton;