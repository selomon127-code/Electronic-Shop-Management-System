/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState, useRef } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ThemeToggle from "../components/ThemeToggle";
import NotificationBell from "../components/NotificationBell";
import LogoutConfirmationDialog from "../components/LogoutConfirmationDialog";

function AdminLayout({ user, onLogout }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 900);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 900);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Responsive handler
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile sidebar on Escape
  useEffect(() => {
    if (!isMobile || !sidebarOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, sidebarOpen]);

  // Close user menu when clicking outside
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setUserMenuOpen(false);
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const isBusinessOwner = user?.role === "business_owner";
  const isAdmin = user?.role === "admin";

  const menuItems = isBusinessOwner
    ? [
        { path: "/admin/dashboard", label: t("nav.dashboard") || "Dashboard", icon: "📊" },
        { path: "/admin/orders", label: t("nav.orders") || "Orders", icon: "📦" },
        { path: "/admin/products", label: t("nav.products") || "Products", icon: "🛍️" },
        { path: "/admin/coupons", label: t("admin.coupons") || "Coupons", icon: "🏷️" },
        { path: "/admin/notifications", label: "Notifications", icon: "🔔" },
        { path: "/admin/reports", label: t("admin.reports") || "Reports", icon: "📈" },
      ]
    : [
        { path: "/admin/dashboard", label: t("nav.dashboard") || "Dashboard", icon: "📊" },
        { path: "/admin/users", label: t("admin.users") || "Users", icon: "👥" },
        { path: "/admin/notifications", label: "Notifications", icon: "🔔" },
        { path: "/admin/system", label: "System health", icon: "🖥️" },
      ];

  const handleLogout = () => {
    if (onLogout) onLogout();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const confirmLogout = () => {
    setLogoutDialogOpen(false);
    handleLogout();
  };

  const getInitial = (name) => (name || "A").charAt(0).toUpperCase();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f6fa", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 999, backdropFilter: "blur(4px)"
          }}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        style={{
          width: sidebarOpen ? "260px" : "72px",
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
          color: "white",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          height: "100vh",
          left: 0,
          top: 0,
          zIndex: 1000,
          boxShadow: "2px 0 20px rgba(0,0,0,0.15)"
        }}
        className={`admin-sidebar ${isMobile && sidebarOpen ? "mobile-open" : ""}`}
      >
        {/* Sidebar Header */}
        <div style={{
          padding: sidebarOpen ? "1.25rem 1rem" : "1.25rem 0.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: sidebarOpen ? "space-between" : "center",
          minHeight: "64px"
        }}>
          {sidebarOpen && (
            <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <img src="/logo.png" alt="Logo" style={{ height: "32px", width: "auto" }} />
              <span style={{ fontSize: "1rem", fontWeight: "800", color: "white", letterSpacing: "-0.01em" }}>
                Admin
              </span>
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              color: "white",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        {/* User Info Card */}
        {sidebarOpen && user && (
          <div style={{
            padding: "1rem",
            margin: "0.75rem",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.08)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: "700", fontSize: "1rem", flexShrink: 0
              }}>
                {getInitial(user.name)}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{
                  fontWeight: "600", fontSize: "0.9rem",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                }}>
                  {user.name || "Admin"}
                </div>
                <div style={{
                  display: "inline-block", padding: "0.15rem 0.5rem",
                  background: "#10b981", color: "white", borderRadius: "4px",
                  fontSize: "0.65rem", fontWeight: "700", textTransform: "uppercase",
                  marginTop: "0.25rem"
                }}>
                  {isBusinessOwner ? "Owner" : isAdmin ? "Admin" : "Staff"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav style={{ flex: 1, padding: "0.5rem", overflowY: "auto" }}>
          {sidebarOpen && (
            <div style={{
              fontSize: "0.7rem", fontWeight: "700", color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase", letterSpacing: "0.08em",
              padding: "0.5rem 0.75rem", marginBottom: "0.25rem"
            }}>
              Menu
            </div>
          )}
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/admin/dashboard" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: sidebarOpen ? "0.75rem 1rem" : "0.75rem",
                  marginBottom: "0.25rem",
                  borderRadius: "10px",
                  textDecoration: "none",
                  color: isActive ? "white" : "rgba(255,255,255,0.65)",
                  background: isActive
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "transparent",
                  transition: "all 0.2s",
                  fontSize: "0.9rem",
                  fontWeight: isActive ? "600" : "500",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  boxShadow: isActive ? "0 4px 12px rgba(99,102,241,0.3)" : "none"
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.color = "white";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                  }
                }}
              >
                <span style={{
                  fontSize: "1.15rem",
                  marginRight: sidebarOpen ? "0.75rem" : "0",
                  minWidth: "24px",
                  textAlign: "center"
                }}>
                  {item.icon}
                </span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div style={{ padding: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={() => setLogoutDialogOpen(true)}
            style={{
              width: "100%",
              padding: sidebarOpen ? "0.75rem" : "0.75rem 0",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#fca5a5",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarOpen ? "center" : "center",
              fontSize: "0.9rem",
              transition: "all 0.2s",
              gap: "0.5rem"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
              e.currentTarget.style.color = "#fca5a5";
            }}
          >
            <span>🚪</span>
            {sidebarOpen && <span>{t("admin.logout") || "Logout"}</span>}
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div style={{
        flex: 1,
        marginLeft: sidebarOpen ? "260px" : "72px",
        transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh"
      }}>

        {/* Top Header Bar */}
        <header style={{
          background: "white",
          borderBottom: "1px solid #e2e8f0",
          padding: "0 1.5rem",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}>
          {/* Left: Mobile Menu + Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
            {isMobile && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
                style={{
                  background: "none", border: "none", fontSize: "1.5rem",
                  cursor: "pointer", color: "#475569", padding: "0.25rem"
                }}
              >
                ☰
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#64748b" }}>
              <Link to="/admin/dashboard" style={{ color: "#64748b", textDecoration: "none" }}>
                Admin
              </Link>
              {location.pathname !== "/admin/dashboard" && (
                <>
                  <span>›</span>
                  <span style={{ color: "#0f172a", fontWeight: "600" }}>
                    {location.pathname.split("/").pop().replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link
              to="/"
              target="_blank"
              style={{
                padding: "0.5rem 0.75rem",
                background: "#f1f5f9",
                color: "#475569",
                textDecoration: "none",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
            >
              🌐 <span style={{ display: "none" }}>View Store</span>
            </Link>

            <ThemeToggle />
            <NotificationBell />

            {/* User Menu */}
            <div style={{ position: "relative" }} ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.35rem 0.75rem 0.35rem 0.35rem",
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "999px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#cbd5e1"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
              >
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: "700", fontSize: "0.85rem"
                }}>
                  {getInitial(user?.name)}
                </div>
                {!isMobile && (
                  <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#1e293b" }}>
                    {user?.name?.split(" ")[0] || "Admin"}
                  </span>
                )}
              </button>

              {userMenuOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  width: "240px", background: "white",
                  borderRadius: "12px", boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                  border: "1px solid #e2e8f0", overflow: "hidden", zIndex: 200
                }}>
                  <div style={{ padding: "1rem", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "#0f172a" }}>
                      {user?.name}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem", wordBreak: "break-all" }}>
                      {user?.email}
                    </div>
                  </div>
                  <div style={{ padding: "0.4rem" }}>
                    <Link
                      to="/profile?tab=profile"
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        display: "block", padding: "0.6rem 0.8rem",
                        color: "#1e293b", textDecoration: "none",
                        borderRadius: "8px", fontSize: "0.9rem",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      👤 My Profile
                    </Link>
                    <Link
                      to="/"
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        display: "block", padding: "0.6rem 0.8rem",
                        color: "#1e293b", textDecoration: "none",
                        borderRadius: "8px", fontSize: "0.9rem",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      🌐 View Store
                    </Link>
                  </div>
                  <div style={{ borderTop: "1px solid #f1f5f9", padding: "0.4rem" }}>
                    <button
                      onClick={() => { setUserMenuOpen(false); setLogoutDialogOpen(true); }}
                      style={{
                        width: "100%", padding: "0.6rem 0.8rem",
                        background: "transparent", border: "none",
                        color: "#ef4444", fontWeight: "600", fontSize: "0.9rem",
                        cursor: "pointer", borderRadius: "8px", textAlign: "left",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{
          flex: 1,
          padding: "1.5rem",
          background: "#f5f6fa"
        }}>
          <Outlet />
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      {logoutDialogOpen && (
        <LogoutConfirmationDialog
          onCancel={() => setLogoutDialogOpen(false)}
          onConfirm={confirmLogout}
        />
      )}
    </div>
  );
}

export default AdminLayout;