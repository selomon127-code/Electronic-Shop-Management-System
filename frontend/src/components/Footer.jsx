import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Footer() {
  const { t } = useTranslation();

  return (
    <footer style={{ background: "#0f172a", color: "#cbd5e1", padding: "4rem 1.5rem 2rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "3rem", marginBottom: "3rem" }}>
          
          {/* About Section */}
          <div>
            <Link to="/" style={{ textDecoration: "none", color: "white", fontSize: "1.5rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <span style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)", width: "32px", height: "32px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>⚡</span>
              E-Shop <span style={{ color: "#a5b4fc" }}>Ethiopia</span>
            </Link>
            <p style={{ lineHeight: "1.6", fontSize: "0.95rem", color: "#94a3b8" }}>
              {t("footer.about_text")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{ color: "white", marginBottom: "1.2rem", fontSize: "1.1rem" }}>{t("footer.quick_links")}</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <li><Link to="/" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#fff"} onMouseLeave={(e) => e.target.style.color = "#94a3b8"}>{t("footer.home")}</Link></li>
              <li><Link to="/products" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#fff"} onMouseLeave={(e) => e.target.style.color = "#94a3b8"}>{t("footer.products")}</Link></li>
              <li><Link to="/cart" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#fff"} onMouseLeave={(e) => e.target.style.color = "#94a3b8"}>{t("footer.cart")}</Link></li>
              <li><Link to="/wishlist" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#fff"} onMouseLeave={(e) => e.target.style.color = "#94a3b8"}>{t("footer.wishlist")}</Link></li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 style={{ color: "white", marginBottom: "1.2rem", fontSize: "1.1rem" }}>{t("footer.contact_us")}</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#94a3b8" }}> {t("footer.address")}</li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#94a3b8" }}>📞 {t("footer.phone")}</li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#94a3b8" }}>✉️ {t("footer.email")}</li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 style={{ color: "white", marginBottom: "1.2rem", fontSize: "1.1rem" }}>{t("footer.follow_us")}</h3>
            <div style={{ display: "flex", gap: "1rem" }}>
              {["Facebook", "Telegram", "Instagram", "TikTok"].map((social) => (
                <a 
                  key={social} 
                  href="#" 
                  style={{ 
                    width: "40px", height: "40px", borderRadius: "50%", 
                    background: "rgba(255,255,255,0.1)", display: "flex", 
                    alignItems: "center", justifyContent: "center", 
                    textDecoration: "none", color: "white", fontSize: "1.2rem",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => e.target.style.background = "#6366f1"}
                  onMouseLeave={(e) => e.target.style.background = "rgba(255,255,255,0.1)"}
                  title={social}
                >
                  {social === "Facebook" && "f"}
                  {social === "Telegram" && "✈️"}
                  {social === "Instagram" && "📷"}
                  {social === "TikTok" && ""}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.9rem" }}>
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}

export default Footer;