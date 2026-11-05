/* eslint-disable react-hooks/set-state-in-effect */
// ecommerce-app/src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { NavLink, Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import LogoutConfirmationDialog from "./LogoutConfirmationDialog";

function Navbar({ cartCount, user, handleLogout }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [mobile, setMobile] = useState(window.innerWidth < 900);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [bump, setBump] = useState(false);

  const profileMenuRef = useRef(null);
  const prevCount = useRef(cartCount);

  /* Responsive */
  useEffect(() => {
    const handleResize = () => setMobile(window.innerWidth < 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* Shadow after scrolling */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close profile dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Keep search box in sync with URL */
  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  /* Close menus on route change */
  useEffect(() => {
    setMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  /* Cart badge "pop" when the count changes */
  useEffect(() => {
    if (prevCount.current !== cartCount) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 450);
      prevCount.current = cartCount;
      return () => clearTimeout(t);
    }
  }, [cartCount]);

  const logout = () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    handleLogout();
    navigate("/", { replace: true });
    setMenuOpen(false);
    setProfileMenuOpen(false);
    setLogoutDialogOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setMenuOpen(false);
    }
  };

  const initial = (user?.name || user?.email || "U").charAt(0).toUpperCase();
  const isManagementUser = ["business_owner", "system_admin"].includes(user?.role);
  const managementPath = user?.role === "system_admin" ? "/admin/system" : "/admin/dashboard";

  const navClass = ({ isActive }) => `nb-link ${isActive ? "active" : ""}`;

  const SearchForm = (
    <form onSubmit={handleSearchSubmit} className="nb-search" role="search">
      <span className="nb-search-icon">🔍</span>
      <input
        type="text"
        placeholder={t("common.search_placeholder")}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        aria-label="Search products"
      />
      <button type="submit" className="nb-search-btn" aria-label="Search">→</button>
    </form>
  );

  return (
    <header className={`nb ${scrolled ? "nb-scrolled" : ""}`}>
      <style>{css}</style>

      <div className="nb-inner">
        {/* Logo */}
        <Link to="/" className="nb-logo">
          <img className="nb-logo-image" src="/electronic-shop-logo.svg" alt="Electronic Shop Ethiopia" />
        </Link>

        {/* Desktop search */}
        {!mobile && SearchForm}

        {/* Right side */}
        <div className="nb-right">
          {!mobile && <LanguageSwitcher />}
          <ThemeToggle />

          {/* Cart icon always visible for customers (also on mobile) */}
          {user && !isManagementUser && mobile && (
            <button className="nb-cart" onClick={() => navigate("/cart")} aria-label="Cart">
              🛒
              {cartCount > 0 && <span className={`nb-badge ${bump ? "pop" : ""}`}>{cartCount}</span>}
            </button>
          )}

          {mobile && (
            <button
              className={`nb-burger ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
            >
              <span />
              <span />
              <span />
            </button>
          )}

          {!mobile && (
            <nav className="nb-links">
              {user && !isManagementUser && (
                <>
                  <NavLink to="/" end className={navClass}>{t("nav.home")}</NavLink>
                  <NavLink to="/products" className={navClass}>{t("nav.products")}</NavLink>
                  <NavLink to="/wishlist" className={navClass}>❤️ {t("nav.wishlist")}</NavLink>

                  <button className="nb-cart-pill" onClick={() => navigate("/cart")}>
                    🛒 {t("nav.cart")}
                    <span className={`nb-badge inline ${bump ? "pop" : ""}`}>{cartCount}</span>
                  </button>

                  <div className="nb-profile" ref={profileMenuRef}>
                    <button
                      className={`nb-avatar-btn ${profileMenuOpen ? "open" : ""}`}
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                      aria-haspopup="true"
                      aria-expanded={profileMenuOpen}
                    >
                      <span className="nb-avatar">{initial}</span>
                      <span className="nb-caret">▾</span>
                    </button>

                    {profileMenuOpen && (
                      <div className="nb-dropdown">
                        <div className="nb-dd-head">
                          <span className="nb-avatar lg">{initial}</span>
                          <div>
                            <div className="nb-dd-name">{user?.name}</div>
                            <div className="nb-dd-email">{user?.email}</div>
                          </div>
                        </div>
                        <div className="nb-dd-body">
                          <Link to="/profile?tab=profile" className="nb-dd-link">👤 {t("nav.profile")}</Link>
                          <Link to="/profile?tab=orders" className="nb-dd-link">📦 {t("nav.orders")}</Link>
                          <Link to="/profile?tab=addresses" className="nb-dd-link">📍 {t("nav.saved_addresses")}</Link>
                          <Link to="/profile?tab=password" className="nb-dd-link">🔐 {t("nav.change_password")}</Link>
                        </div>
                        <div className="nb-dd-foot">
                          <button onClick={logout} className="nb-dd-logout">🚪 {t("nav.logout")}</button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {isManagementUser && (
                <>
                  <NavLink to={managementPath} className={navClass}>
                    {user.role === "system_admin" ? `🖥️ ${t("admin.system_health")}` : `📊 ${t("nav.dashboard")}`}
                  </NavLink>
                  {user.role === "business_owner" && (
                    <>
                      <NavLink to="/admin/products" className={navClass}>🛍️ {t("nav.products")}</NavLink>
                      <NavLink to="/admin/orders" className={navClass}>🛠️ {t("nav.orders")}</NavLink>
                      <NavLink to="/admin/coupons" className={navClass}>🏷️ {t("admin.coupons")}</NavLink>
                      <NavLink to="/admin/reports" className={navClass}>📈 {t("admin.reports")}</NavLink>
                    </>
                  )}
                  {user.role === "system_admin" && (
                    <NavLink to="/admin/users" className={navClass}>👥 {t("admin.users")}</NavLink>
                  )}
                  <button onClick={logout} className="nb-btn nb-btn-danger">{t("nav.logout")}</button>
                </>
              )}

              {!user && (
                <>
                  <NavLink to="/" end className={navClass}>{t("nav.home")}</NavLink>
                  <NavLink to="/products" className={navClass}>{t("nav.products")}</NavLink>
                  <NavLink to="/login" className={navClass}>{t("nav.login")}</NavLink>
                  <Link to="/signup" className="nb-btn nb-btn-primary">{t("nav.signup")}</Link>
                </>
              )}
            </nav>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobile && (
        <>
        <button
          type="button"
          className={`nb-mobile-backdrop ${menuOpen ? "show" : ""}`}
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation menu"
          tabIndex={menuOpen ? 0 : -1}
        />
        <nav id="mobile-navigation" className={`nb-mobile ${menuOpen ? "show" : ""}`} aria-hidden={!menuOpen}>
          <div className="nb-mobile-inner" inert={!menuOpen}>
            <LanguageSwitcher />
            {SearchForm}

            {user && !isManagementUser && (
              <>
                <NavLink to="/" end className="nb-m-link">🏠 {t("nav.home")}</NavLink>
                <NavLink to="/products" className="nb-m-link">🛍️ {t("nav.products")}</NavLink>
                <NavLink to="/cart" className="nb-m-link">
                  🛒 {t("nav.cart")} <span className="nb-badge inline">{cartCount}</span>
                </NavLink>
                <NavLink to="/wishlist" className="nb-m-link">❤️ {t("nav.wishlist")}</NavLink>
                <div className="nb-m-divider" />
                <Link to="/profile?tab=profile" className="nb-m-link">👤 {t("nav.profile")}</Link>
                <Link to="/profile?tab=orders" className="nb-m-link">📦 {t("nav.orders")}</Link>
                <Link to="/profile?tab=addresses" className="nb-m-link">📍 {t("nav.saved_addresses")}</Link>
                <Link to="/profile?tab=password" className="nb-m-link">🔐 {t("nav.change_password")}</Link>
                <button onClick={logout} className="nb-btn nb-btn-danger block">🚪 {t("nav.logout")}</button>
              </>
            )}

            {isManagementUser && (
              <>
                <NavLink to={managementPath} className="nb-m-link">
                  {user.role === "system_admin" ? `🖥️ ${t("admin.system_health")}` : `📊 ${t("nav.dashboard")}`}
                </NavLink>
                {user.role === "business_owner" && (
                  <>
                    <NavLink to="/admin/products" className="nb-m-link">🛍️ {t("nav.products")}</NavLink>
                    <NavLink to="/admin/orders" className="nb-m-link">🛠️ {t("nav.orders")}</NavLink>
                    <NavLink to="/admin/coupons" className="nb-m-link">🏷️ {t("admin.coupons")}</NavLink>
                    <NavLink to="/admin/reports" className="nb-m-link">📈 {t("admin.reports")}</NavLink>
                  </>
                )}
                {user.role === "system_admin" && (
                  <NavLink to="/admin/users" className="nb-m-link">👥 {t("admin.users")}</NavLink>
                )}
                <button onClick={logout} className="nb-btn nb-btn-danger block">🚪 {t("nav.logout")}</button>
              </>
            )}

            {!user && (
              <>
                <NavLink to="/login" className="nb-m-link">{t("nav.login")}</NavLink>
                <Link to="/signup" className="nb-btn nb-btn-primary block">{t("nav.signup")}</Link>
              </>
            )}

            <div className="nb-m-theme"><ThemeToggle /></div>
          </div>
        </nav>
        </>
      )}
      {logoutDialogOpen && (
        <LogoutConfirmationDialog
          onCancel={() => setLogoutDialogOpen(false)}
          onConfirm={confirmLogout}
        />
      )}
    </header>
  );
}

const css = `
.nb { position: sticky; top: 0; z-index: 1000; background: rgba(15,23,42,.92); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid rgba(255,255,255,.06); color: #fff; font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif; transition: box-shadow .3s ease, background .3s ease; animation: nbDrop .6s cubic-bezier(.2,.8,.2,1) both; }
.nb * { box-sizing: border-box; }
.nb-scrolled { box-shadow: 0 8px 30px rgba(0,0,0,.28); background: rgba(15,23,42,.97); }
@keyframes nbDrop { from { transform: translateY(-100%); opacity: 0; } to { transform: none; opacity: 1; } }

.nb-inner { max-width: 1400px; margin: 0 auto; padding: .8rem 1.5rem; display: flex; align-items: center; gap: 1.5rem; }

/* Logo */
.nb-logo { display: flex; align-items: center; text-decoration: none; flex: 0 0 auto; }
.nb-logo-image { display: block; width: 220px; height: auto; }
.nb-logo:hover .nb-logo-image { filter: brightness(1.08); }

/* Search */
.nb-search { position: relative; display: flex; align-items: center; flex: 1; max-width: 460px; }
.nb-search input { width: 100%; padding: .65rem 2.8rem .65rem 2.6rem; border-radius: 999px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.08); color: #fff; font-size: .92rem; outline: none; transition: background .25s, border-color .25s, box-shadow .25s; }
.nb-search input::placeholder { color: rgba(255,255,255,.5); }
.nb-search input:focus { background: rgba(255,255,255,.14); border-color: #818cf8; box-shadow: 0 0 0 4px rgba(129,140,248,.22); }
.nb-search-icon { position: absolute; left: 1rem; font-size: .85rem; opacity: .7; pointer-events: none; }
.nb-search-btn { position: absolute; right: 5px; width: 32px; height: 32px; border: none; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; cursor: pointer; font-size: 1rem; transition: transform .25s; }
.nb-search-btn:hover { transform: translateX(3px) scale(1.08); }

/* Right side */
.nb-right { display: flex; align-items: center; gap: .8rem; margin-left: auto; }
.nb-links { display: flex; align-items: center; gap: .4rem; }

/* Links with animated underline */
.nb-link { position: relative; padding: .5rem .85rem; color: rgba(255,255,255,.82); text-decoration: none; font-size: .95rem; font-weight: 500; border-radius: 10px; transition: color .25s, background .25s; }
.nb-link::after { content: ""; position: absolute; left: 50%; bottom: 3px; width: 0; height: 2px; border-radius: 2px; background: linear-gradient(90deg, #818cf8, #f0abfc); transition: width .3s ease, left .3s ease; }
.nb-link:hover { color: #fff; background: rgba(255,255,255,.06); }
.nb-link:hover::after, .nb-link.active::after { width: 60%; left: 20%; }
.nb-link.active { color: #fff; font-weight: 600; }

/* Buttons */
.nb-btn { border: none; cursor: pointer; padding: .55rem 1.2rem; border-radius: 999px; font-weight: 700; font-size: .9rem; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; transition: transform .25s ease, box-shadow .25s ease; color: #fff; }
.nb-btn:hover { transform: translateY(-2px); }
.nb-btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 6px 18px rgba(99,102,241,.4); }
.nb-btn-primary:hover { box-shadow: 0 10px 24px rgba(99,102,241,.55); }
.nb-btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); box-shadow: 0 6px 16px rgba(239,68,68,.3); }
.nb-btn.block { width: 100%; margin-top: .6rem; padding: .8rem; }

/* Cart */
.nb-cart-pill { display: inline-flex; align-items: center; gap: .5rem; padding: .5rem 1rem; border-radius: 999px; border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.08); color: #fff; cursor: pointer; font-size: .92rem; font-weight: 600; transition: background .25s, transform .25s, border-color .25s; }
.nb-cart-pill:hover { background: rgba(255,255,255,.16); border-color: rgba(255,255,255,.35); transform: translateY(-2px); }
.nb-cart { position: relative; width: 42px; height: 42px; border-radius: 12px; border: 1px solid rgba(255,255,255,.15); background: rgba(255,255,255,.08); color: #fff; font-size: 1.15rem; cursor: pointer; }
.nb-badge { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: linear-gradient(135deg, #ec4899, #f43f5e); color: #fff; font-size: .72rem; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; }
.nb-cart .nb-badge { position: absolute; top: -6px; right: -6px; }
.nb-badge.pop { animation: nbPop .45s cubic-bezier(.2,.8,.2,1); }
@keyframes nbPop { 0% { transform: scale(1); } 40% { transform: scale(1.6); } 100% { transform: scale(1); } }

/* Profile */
.nb-profile { position: relative; }
.nb-avatar-btn { display: flex; align-items: center; gap: .35rem; padding: 3px 10px 3px 3px; border-radius: 999px; border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.08); color: #fff; cursor: pointer; transition: background .25s, border-color .25s; }
.nb-avatar-btn:hover, .nb-avatar-btn.open { background: rgba(255,255,255,.16); border-color: rgba(255,255,255,.35); }
.nb-avatar { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #ec4899); font-weight: 800; font-size: .95rem; color: #fff; flex-shrink: 0; }
.nb-avatar.lg { width: 44px; height: 44px; font-size: 1.1rem; }
.nb-caret { font-size: .8rem; transition: transform .3s ease; }
.nb-avatar-btn.open .nb-caret { transform: rotate(180deg); }

.nb-dropdown { position: absolute; top: calc(100% + 12px); right: 0; width: 270px; background: #fff; color: #0f172a; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(15,23,42,.35); transform-origin: top right; animation: nbMenu .25s cubic-bezier(.2,.8,.2,1) both; z-index: 1001; }
@keyframes nbMenu { from { opacity: 0; transform: translateY(-8px) scale(.95); } to { opacity: 1; transform: none; } }
.nb-dd-head { display: flex; align-items: center; gap: .8rem; padding: 1rem; background: linear-gradient(135deg, #eef2ff, #fdf4ff); border-bottom: 1px solid #e2e8f0; }
.nb-dd-name { font-weight: 700; font-size: .95rem; }
.nb-dd-email { font-size: .78rem; color: #64748b; word-break: break-all; }
.nb-dd-body { padding: .4rem; }
.nb-dd-link { display: block; padding: .65rem .8rem; border-radius: 10px; color: #1e293b; text-decoration: none; font-size: .9rem; transition: background .2s, padding-left .2s, color .2s; }
.nb-dd-link:hover { background: #eef2ff; color: #4338ca; padding-left: 1.1rem; }
.nb-dd-foot { border-top: 1px solid #e2e8f0; padding: .4rem; }
.nb-dd-logout { width: 100%; text-align: left; padding: .65rem .8rem; border: none; background: transparent; border-radius: 10px; color: #ef4444; font-weight: 700; font-size: .9rem; cursor: pointer; transition: background .2s; }
.nb-dd-logout:hover { background: #fef2f2; }

/* Burger */
.nb-burger { width: 42px; height: 42px; border-radius: 12px; border: 1px solid rgba(255,255,255,.15); background: rgba(255,255,255,.08); cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; }
.nb-burger span { width: 20px; height: 2px; border-radius: 2px; background: #fff; transition: transform .3s ease, opacity .3s ease; }
.nb-burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.nb-burger.open span:nth-child(2) { opacity: 0; }
.nb-burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* Mobile navigation drawer */
.nb-mobile-backdrop { position: fixed; inset: 0; z-index: 999; width: 100%; height: 100%; border: 0; padding: 0; background: rgba(15,23,42,.58); opacity: 0; visibility: hidden; transition: opacity .25s ease, visibility .25s ease; }
.nb-mobile-backdrop.show { opacity: 1; visibility: visible; }
.nb-mobile { position: fixed; z-index: 1001; top: 0; right: 0; bottom: 0; width: min(88vw, 380px); overflow-y: auto; overscroll-behavior: contain; background: #0f172a; box-shadow: -16px 0 40px rgba(0,0,0,.24); clip-path: inset(0 0 0 100%); visibility: hidden; transition: clip-path .3s cubic-bezier(.2,.8,.2,1), visibility 0s linear .3s; }
.nb-mobile.show { clip-path: inset(0); visibility: visible; transition: clip-path .3s cubic-bezier(.2,.8,.2,1), visibility 0s; border-left: 1px solid rgba(255,255,255,.08); }
.nb-mobile-inner { min-height: 100%; padding: 1.2rem; }
.nb-mobile .nb-search { max-width: none; margin-bottom: .8rem; }
.nb-m-link { display: flex; align-items: center; justify-content: space-between; min-height: 44px; padding: .8rem .9rem; border-radius: 12px; color: rgba(255,255,255,.88); text-decoration: none; font-size: 1rem; transition: background .2s, padding-left .2s; }
.nb-m-link:hover, .nb-m-link.active { background: rgba(255,255,255,.08); padding-left: 1.2rem; color: #fff; }
.nb-m-link.active { border-left: 3px solid #818cf8; }
.nb-m-divider { height: 1px; background: rgba(255,255,255,.1); margin: .6rem 0; }
.nb-m-theme { margin-top: .8rem; }

@media (prefers-reduced-motion: reduce) {
  .nb, .nb *, .nb-dropdown { animation: none !important; transition: none !important; }
}

@media (max-width: 480px) {
  .nb-inner { padding: .65rem .85rem; gap: .6rem; }
  .nb-logo-image { width: min(48vw, 190px); }
  .nb-right { gap: .45rem; }
  .nb-burger, .nb-cart { width: 44px; height: 44px; }
}
`;

export default Navbar;
