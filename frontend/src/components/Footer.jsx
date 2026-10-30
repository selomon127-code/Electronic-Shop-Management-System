import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Footer() {
  const { t } = useTranslation();

  // Social Media Links
  const socialLinks = {
    facebook: "https://web.facebook.com/selomon127?_rdc=1&_rdr#",
    telegram: "https://t.me/Soleee7",
    linkedin: "https://www.linkedin.com/feed/",
    instagram: "https://instagram.com/selemon_yene21",
  };

  // SVG Icons for Social Media
  const icons = {
    facebook: (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "20px", height: "20px" }}>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    telegram: (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "20px", height: "20px" }}>
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    linkedin: (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "20px", height: "20px" }}>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    instagram: (
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "20px", height: "20px" }}>
        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
      </svg>
    ),
  };

  // Brand colors for hover effects
  const brandColors = {
    facebook: "#1877F2",
    telegram: "#0088cc",
    linkedin: "#0A66C2",
    instagram: "#E4405F",
  };

  return (
    <footer style={{ background: "#0f172a", color: "#cbd5e1", padding: "4rem 1.5rem 2rem", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "3rem", marginBottom: "3rem" }}>
          
          {/* About Section */}
          <div>
            
<Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", marginBottom: "1rem" }}>
  <img 
    src="/logo.png" 
    alt="E-Shop Ethiopia Logo" 
    style={{ 
      height: "95px", /* Adjust this to make your logo bigger or smaller */
      width: "auto", 
      objectFit: "contain" 
    }} 
  />
</Link>
            <p style={{ lineHeight: "1.6", fontSize: "0.95rem", color: "#94a3b8" }}>
              {t("footer.about_text") || "Your trusted online electronics store in Ethiopia. Quality products, fast delivery, and excellent customer service."}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{ color: "white", marginBottom: "1.2rem", fontSize: "1.1rem" }}>{t("footer.quick_links") || "Quick Links"}</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <li><Link to="/" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#fff"} onMouseLeave={(e) => e.target.style.color = "#94a3b8"}>{t("footer.home") || "Home"}</Link></li>
              <li><Link to="/products" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#fff"} onMouseLeave={(e) => e.target.style.color = "#94a3b8"}>{t("footer.products") || "Products"}</Link></li>
              <li><Link to="/cart" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#fff"} onMouseLeave={(e) => e.target.style.color = "#94a3b8"}>{t("footer.cart") || "Cart"}</Link></li>
              <li><Link to="/wishlist" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.target.style.color = "#fff"} onMouseLeave={(e) => e.target.style.color = "#94a3b8"}>{t("footer.wishlist") || "Wishlist"}</Link></li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 style={{ color: "white", marginBottom: "1.2rem", fontSize: "1.1rem" }}>{t("footer.contact_us") || "Contact Us"}</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", color: "#94a3b8" }}>
                <span style={{ fontSize: "1.2rem" }}>📍</span>
                <span>{t("footer.address") || "Addis Ababa, Ethiopia"}</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#94a3b8" }}>
                <span style={{ fontSize: "1.2rem" }}></span>
                <span>{t("footer.phone") || "+251 911 234 567"}</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#94a3b8" }}>
                <span style={{ fontSize: "1.2rem" }}>✉️</span>
                <a href="mailto:selomon127@gmail.com" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.2s" }}
                   onMouseEnter={(e) => e.target.style.color = "#60a5fa"}
                   onMouseLeave={(e) => e.target.style.color = "#94a3b8"}>
                  selomon127@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 style={{ color: "white", marginBottom: "1.2rem", fontSize: "1.1rem" }}>{t("footer.follow_us") || "Follow Us"}</h3>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {Object.entries(icons).map(([platform, icon]) => (
                <a 
                  key={platform} 
                  href={socialLinks[platform]} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    width: "42px", height: "42px", borderRadius: "50%", 
                    background: "rgba(255,255,255,0.08)", display: "flex", 
                    alignItems: "center", justifyContent: "center", 
                    textDecoration: "none", color: "white",
                    transition: "all 0.3s ease",
                    border: "1px solid rgba(255,255,255,0.1)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = brandColors[platform];
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = `0 4px 12px ${brandColors[platform]}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  title={`Follow us on ${platform}`}
                >
                  {icon}
                </a>
              ))}
            </div>
            <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#64748b" }}>
              Stay connected for updates & deals
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "2rem", marginTop: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.9rem" }}>
          <p style={{ margin: 0 }}>
            {t("footer.copyright") || "© 2024 E-Shop Ethiopia. All rights reserved."}
          </p>
          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.8rem" }}>
            Designed with ❤️ in Ethiopia
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;