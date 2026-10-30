// frontend/src/components/LanguageSwitcher.jsx
import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "am", label: "አማርኛ", flag: "🇪🇹" },
    { code: "om", label: "Afaan Oromoo", flag: "🇪🇹" },
    { code: "ti", label: "ትግርኛ", flag: "🇪🇷" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  return (
    <div className="lang-switcher" ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.4rem 0.8rem",
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "8px",
          color: "white",
          cursor: "pointer",
          fontSize: "0.9rem",
          fontWeight: "600",
        }}
      >
        <span>{currentLang.flag}</span>
        <span>{currentLang.label}</span>
        <span style={{ fontSize: "0.7rem" }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "0.5rem",
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            overflow: "hidden",
            zIndex: 1000,
            minWidth: "160px",
          }}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                width: "100%",
                padding: "0.75rem 1rem",
                border: "none",
                background: i18n.language === lang.code ? "#f1f5f9" : "transparent",
                color: "#1e293b",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: i18n.language === lang.code ? "700" : "500",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#e2e8f0")}
              onMouseLeave={(e) =>
                (e.target.style.background = i18n.language === lang.code ? "#f1f5f9" : "transparent")
              }
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;