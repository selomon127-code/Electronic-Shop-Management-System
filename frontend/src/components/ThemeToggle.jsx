// ecommerce-app/src/components/ThemeToggle.jsx
import React, { useState, useEffect } from "react";
import "./ThemeToggle.css";

function ThemeToggle() {
  // Get initial theme from localStorage or system preference
  const getInitialTheme = () => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    
    // Check system preference
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  };

  const [theme, setTheme] = useState(getInitialTheme);
  const [hasManualPreference, setHasManualPreference] = useState(
    () => localStorage.getItem("theme") !== null
  );

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    
    if (hasManualPreference) {
      localStorage.setItem("theme", theme);
    }
    root.style.colorScheme = theme;
  }, [theme, hasManualPreference]);

  // Toggle theme
  const toggleTheme = () => {
    setHasManualPreference(true);
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!hasManualPreference) {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    
    mediaQuery.addEventListener?.("change", handleChange);
    return () => mediaQuery.removeEventListener?.("change", handleChange);
  }, [hasManualPreference]);

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}


export default ThemeToggle;