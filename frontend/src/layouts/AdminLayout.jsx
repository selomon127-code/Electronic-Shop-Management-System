// ecommerce-app/src/layouts/AdminLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";

function AdminLayout({ user, handleLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);  // ✅ NEW: Track if auth is loaded

  // 🔐 Redirect NON-ADMINS away from admin panel — BUT wait for auth to load first
  useEffect(() => {
    // Only check auth AFTER we know if user is loaded
    if (user !== null) {  // ✅ Wait until user is either object or explicitly null
      if (!user || user.role !== "admin") {
        console.log("❌ Admin access denied for user:", user);
        navigate("/", { replace: true });
      } else {
        console.log("✅ Admin access granted for:", user.email);
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthChecked(true);  // ✅ Mark auth as checked
    }
  }, [user, navigate]);

  // Show loading while auth is being checked
  if (!authChecked) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#f8f9fa"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔐</div>
          <p style={{ color: "#666" }}>Checking admin access...</p>
        </div>
      </div>
    );
  }

  const adminMenuItems = [
    { path: "/admin/dashboard", label: "📊 Dashboard", icon: "📊" },
    { path: "/admin/orders", label: "📦 Orders", icon: "📦" },
    { path: "/admin/products", label: "🛍️ Products", icon: "🛍️" },
    { path: "/admin/add-product", label: "➕ Add Product", icon: "➕" },
    { path: "/admin/users", label: "👥 Users", icon: "👥" },
  ];

  const logout = () => {
    handleLogout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f6fa" }}>
      {/* Left Sidebar */}
      <aside style={{
        width: sidebarOpen ? "260px" : "80px",
        background: "linear-gradient(180deg, #2c3e50 0%, #34495e 100%)",
        color: "white",
        transition: "width 0.3s ease",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        height: "100vh",
        left: 0,
        top: 0,
        zIndex: 1000
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: "1.5rem 1rem",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: sidebarOpen ? "space-between" : "center"
        }}>
          {sidebarOpen && <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: "700" }}>🛠️ Admin Panel</h2>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "white",
              padding: "0.5rem",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1.2rem"
            }}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        {/* User Info */}
        {sidebarOpen && user && (
          <div style={{
            padding: "1rem",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.1)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>👤 {user.name}</span>
              {user.role === "admin" && (
                <span style={{
                  padding: "0.2rem 0.5rem",
                  background: "#28a745",
                  color: "white",
                  borderRadius: "4px",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  textTransform: "uppercase"
                }}>Admin</span>
              )}
            </div>
            <div style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: "0.25rem" }}>{user.email}</div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav style={{ flex: 1, padding: "1rem 0.5rem" }}>
          {adminMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0.85rem 1rem",
                  marginBottom: "0.5rem",
                  borderRadius: "8px",
                  textDecoration: "none",
                  color: isActive ? "white" : "rgba(255,255,255,0.7)",
                  background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                  transition: "all 0.2s",
                  fontSize: "0.95rem",
                  fontWeight: isActive ? "600" : "400"
                }}
              >
                <span style={{ fontSize: "1.3rem", marginRight: sidebarOpen ? "0.75rem" : "0" }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label.replace(/^[^\s]+\s/, "")}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={logout}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: "rgba(231, 76, 60, 0.9)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.95rem"
            }}
          >
            <span style={{ marginRight: sidebarOpen ? "0.5rem" : "0" }}>🚪</span>
            {sidebarOpen && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: sidebarOpen ? "260px" : "80px",
        transition: "margin-left 0.3s ease",
        padding: "2rem",
        minHeight: "100vh"
      }}>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;