import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import WishlistButton from "./WishlistButton";

function ProductCard({ product, addToCart, user }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const discount = product.discount || 0;
  const finalPrice = product.price - (product.price * discount) / 100;
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    addToCart(product);
  };

  return (
    <Link to={`/product/${product._id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{
        background: "var(--bg-card)", borderRadius: "10px", overflow: "hidden",
        border: "1px solid var(--border)", display: "flex", flexDirection: "column",
        height: "100%", position: "relative", transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.08)";
        e.currentTarget.style.borderColor = "var(--primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "var(--border)";
      }}>
        <WishlistButton
          product={product}
          user={user}
          className="product-card-wishlist"
        />
        
        {discount > 0 && (
          <span style={{ position: "absolute", top: "8px", left: "8px", zIndex: 2, background: "var(--danger)", color: "white", padding: "3px 8px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "700" }}>
            -{discount}%
          </span>
        )}
        
        {isOutOfStock && (
          <span style={{ position: "absolute", top: "8px", left: "8px", zIndex: 2, background: "#64748b", color: "white", padding: "3px 8px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "700" }}>
            {t("products.out_of_stock")}
          </span>
        )}

        <div style={{ width: "100%", aspectRatio: "1/1", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "0.75rem" }}>
          <img src={product.image || "https://via.placeholder.com/300"} alt={product.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain", transition: "transform 0.3s" }} 
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"} 
          />
        </div>

        <div style={{ padding: "0.75rem", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
            {product.category || "Electronics"}
          </div>
          <h3 style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-main)", margin: "0 0 0.4rem 0", lineHeight: "1.3", flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {product.name}
          </h3>
          
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "auto" }}>
            <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-main)" }}>{finalPrice.toLocaleString()} ETB</span>
            {discount > 0 && <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textDecoration: "line-through" }}>{product.price.toLocaleString()}</span>}
          </div>

          {addToCart && (
            <button 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              style={{ 
                width: "100%", marginTop: "0.75rem", padding: "0.6rem", 
                background: isOutOfStock ? "#cbd5e1" : "var(--primary)", 
                color: "white", border: "none", borderRadius: "8px", 
                fontWeight: "600", fontSize: "0.85rem", cursor: isOutOfStock ? "not-allowed" : "pointer" 
              }}
            >
              {isOutOfStock ? t("products.out_of_stock") : `🛒 ${t("products.add_to_cart")}`}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;