// ecommerce-app/src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

function Navbar({ cartCount, user, handleLogout }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobile, setMobile] = useState(window.innerWidth < 768);

  // 🔹 Detect screen resize
  useEffect(() => {
    const handleResize = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🔹 Logout handler
  const logout = () => {
    handleLogout();
    navigate("/login");
    setMenuOpen(false);
  };

  // 🔹 Hover effect helpers (for inline styles)
  const hoverLink = (e) => {
    e.currentTarget.style.color = "#ffd700"; // ✅ Gold on hover
    e.currentTarget.style.fontWeight = "600";
  };
  
  const leaveLink = (e) => {
    e.currentTarget.style.color = "white"; // ✅ Back to white
    e.currentTarget.style.fontWeight = "400";
  };

  const hoverBtn = (e) => {
    e.currentTarget.style.background = "rgba(255,255,255,0.2)";
    e.currentTarget.style.transform = "scale(1.05)";
  };
  
  const leaveBtn = (e) => {
    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
    e.currentTarget.style.transform = "scale(1)";
  };

  return (
    <nav
      style={{
        background: "#2c3e50",
        color: "white",
        padding: "1rem 2rem",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        transition: "background 0.3s ease"
      }}
    >
      {/* 🔹 Logo */}
      <h2 style={{ margin: 0 }}>
        <Link
          to="/"
          style={{
            color: "white",
            textDecoration: "none",
            fontWeight: "700",
            fontSize: "1.4rem",
            transition: "opacity 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          🛍️ E-Shop
        </Link>
      </h2>

      {/* 🔹 Hamburger Button (Mobile Only) */}
      {mobile && (
        <div
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            fontSize: "28px",
            cursor: "pointer",
            userSelect: "none",
            padding: "0.5rem",
            borderRadius: "6px",
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          ☰
        </div>
      )}

      {/* 🔹 Navigation Menu */}
      <div
        style={{
          display: mobile ? (menuOpen ? "flex" : "none") : "flex",
          flexDirection: mobile ? "column" : "row",
          position: mobile ? "absolute" : "static",
          top: mobile ? "70px" : "auto",
          right: mobile ? "0" : "auto",
          background: mobile ? "#2c3e50" : "transparent",
          width: mobile ? "100%" : "auto",
          padding: mobile ? "1rem" : "0",
          gap: "1rem",
          alignItems: "center",
          transition: "all 0.3s ease"
        }}
      >
        {/* 🔹 Theme Toggle */}
        <ThemeToggle />

        {/* 🔹 USER LINKS */}
        {user && user.role !== "admin" && (
          <>
            <Link 
              to="/" 
              onClick={() => setMenuOpen(false)} 
              style={linkStyle}
              onMouseEnter={hoverLink}
              onMouseLeave={leaveLink}
            >
              🏠 Home
            </Link>

            <Link 
              to="/products" 
              onClick={() => setMenuOpen(false)} 
              style={linkStyle}
              onMouseEnter={hoverLink}
              onMouseLeave={leaveLink}
            >
              🛍️ Products
            </Link>

            <button
              onClick={() => {
                navigate("/cart");
                setMenuOpen(false);
              }}
              style={btnStyle}
              onMouseEnter={hoverBtn}
              onMouseLeave={leaveBtn}
            >
              🛒 Cart ({cartCount})
            </button>

            <Link 
              to="/orders" 
              onClick={() => setMenuOpen(false)} 
              style={linkStyle}
              onMouseEnter={hoverLink}
              onMouseLeave={leaveLink}
            >
              📦 My Orders
            </Link>
          </>
        )}

        {/* 🔹 ADMIN LINKS */}
        {user?.role === "admin" && (
          <>
            <Link 
              to="/admin/dashboard" 
              onClick={() => setMenuOpen(false)} 
              style={{...linkStyle, color: "#ffd700"}}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ffed4e";
                e.currentTarget.style.fontWeight = "700";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#ffd700";
                e.currentTarget.style.fontWeight = "600";
              }}
            >
              📊 Dashboard
            </Link>

            <Link 
              to="/admin/products" 
              onClick={() => setMenuOpen(false)} 
              style={linkStyle}
              onMouseEnter={hoverLink}
              onMouseLeave={leaveLink}
            >
              🛍️ Products
            </Link>

            <Link 
              to="/admin/orders" 
              onClick={() => setMenuOpen(false)} 
              style={linkStyle}
              onMouseEnter={hoverLink}
              onMouseLeave={leaveLink}
            >
              🛠️ Orders
            </Link>
          </>
        )}

        {/* 🔹 AUTH SECTION */}
        {user ? (
          <>
            <span style={{fontSize:"0.9rem", color: "white"}}>👤 {user.name}</span>
            <button 
              onClick={logout} 
              style={logoutBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#c0392b"; // ✅ Darker red
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#e74c3c";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link 
              to="/login" 
              style={linkStyle}
              onMouseEnter={hoverLink}
              onMouseLeave={leaveLink}
            >
              Login
            </Link>
            <Link 
              to="/signup" 
              style={signupBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#2980b9"; // ✅ Darker blue
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#3498db";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

// 🔹 Style objects (base styles)
const linkStyle = {
  color: "white",
  textDecoration: "none",
  fontSize: "0.95rem",
  transition: "color 0.2s, font-weight 0.2s" // ✅ Smooth hover transition
};

const btnStyle = {
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.3)",
  padding: "0.4rem 0.9rem",
  borderRadius: "6px",
  color: "white",
  cursor: "pointer",
  transition: "background 0.2s, transform 0.2s" // ✅ Smooth hover transition
};

const logoutBtn = {
  background: "#e74c3c",
  border: "none",
  padding: "0.4rem 0.9rem",
  borderRadius: "6px",
  color: "white",
  cursor: "pointer",
  transition: "background 0.2s, transform 0.2s" // ✅ Smooth hover transition
};

const signupBtn = {
  background: "#3498db",
  color: "white",
  padding: "0.4rem 0.9rem",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
  transition: "background 0.2s, transform 0.2s" // ✅ Smooth hover transition
};

export default Navbar;