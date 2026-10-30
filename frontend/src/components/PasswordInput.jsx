// ecommerce-app/src/components/PasswordInput.jsx
import React, { useState } from "react";

function PasswordInput({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder = "Password",
  autoComplete = "current-password",
  disabled = false,
  required = true,
  invalid = false,
  describedBy,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        required={required}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        style={{
          width: "100%",
          padding: "0.75rem",
          paddingRight: "4rem", // Make room for the button
          borderRadius: "6px",
          border: invalid ? "1px solid #dc3545" : "1px solid #ddd",
          fontSize: "1rem",
          boxSizing: "border-box",
        }}
      />
      <button
        type="button"
        style={{
          position: "absolute",
          right: "0.5rem",
          background: "transparent",
          border: "none",
          color: "#666",
          cursor: "pointer",
          fontSize: "0.85rem",
          padding: "0.25rem 0.5rem",
        }}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        disabled={disabled}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export default PasswordInput;