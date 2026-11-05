import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import WishlistButton from "./WishlistButton";
import { getDiscountedPrice } from "../utils/productPricing";
import StarRating from "./StarRating"; // Assuming you have this component
import { trackRecentlyViewedProduct } from "../utils/recentlyViewed";

function ProductCard({ product, addToCart, user }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);

  const discount = product.discount || 0;
  const finalPrice = getDiscountedPrice(product);
  const isOutOfStock = product.stock <= 0;
  
  // ✅ Robust image fallback
  const imageUrl = product.image || "https://placehold.co/400x400/f1f5f9/64748b?text=No+Image";

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      // Redirect to login, but remember where they came from
      navigate("/login", { state: { from: `/product/${product._id}` } });
      return;
    }

    setIsAdding(true);
    addToCart(product);
    
    // Reset button state after 1.5s for visual feedback
    setTimeout(() => setIsAdding(false), 1500);
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = "https://placehold.co/400x400/f1f5f9/64748b?text=No+Image";
  };

  return (
    <Link
      to={`/product/${product._id}`}
      onClick={(event) => {
        if (!event.defaultPrevented) {
          trackRecentlyViewedProduct(product);
        }
      }}
      style={{ textDecoration: "none", color: "inherit", display: "flex", height: "100%" }}
    >
      <div 
        style={{
          background: "var(--bg-card, #ffffff)",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid var(--border, #e2e8f0)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          position: "relative",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-6px)";
          e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
          e.currentTarget.style.borderColor = "var(--primary, #6366f1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = "var(--border, #e2e8f0)";
        }}
      >
        {/* ✅ Badges Container */}
        <div style={{ position: "absolute", top: "12px", left: "12px", zIndex: 10, display: "flex", flexDirection: "column", gap: "6px" }}>
          {discount > 0 && (
            <span style={{ 
              background: "linear-gradient(135deg, #ef4444, #dc2626)", 
              color: "white", 
              padding: "4px 10px", 
              borderRadius: "6px", 
              fontSize: "0.75rem", 
              fontWeight: "700",
              boxShadow: "0 2px 4px rgba(239, 68, 68, 0.3)"
            }}>
              -{discount}%
            </span>
          )}
          {isOutOfStock && (
            <span style={{ 
              background: "#64748b", 
              color: "white", 
              padding: "4px 10px", 
              borderRadius: "6px", 
              fontSize: "0.75rem", 
              fontWeight: "700" 
            }}>
              {t("products.out_of_stock")}
            </span>
          )}
        </div>

        {/* ✅ Wishlist Button */}
        <div style={{ position: "absolute", top: "12px", right: "12px", zIndex: 10 }}>
          <WishlistButton product={product} user={user} />
        </div>

        {/* ✅ Image Container */}
        <div style={{ 
          width: "100%", 
          aspectRatio: "1/1", 
          background: "#f8fafc", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          overflow: "hidden",
          padding: "1rem"
        }}>
          <img 
            src={imageUrl} 
            alt={product.name} 
            loading="lazy" 
            onError={handleImageError}
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "contain", 
              transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)" 
            }} 
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"} 
          />
        </div>

        {/* ✅ Content Section */}
        <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column" }}>
          
          {/* Category Tag */}
          <div style={{ 
            fontSize: "0.7rem", 
            color: "var(--primary, #6366f1)", 
            fontWeight: "700", 
            textTransform: "uppercase", 
            letterSpacing: "0.05em", 
            marginBottom: "0.4rem" 
          }}>
            {product.category || t("products.electronics")}
          </div>

          {/* Product Name (Clamped to 2 lines) */}
          <h3 style={{ 
            fontSize: "0.95rem", 
            fontWeight: "600", 
            color: "var(--text-main, #0f172a)", 
            margin: "0 0 0.5rem 0", 
            lineHeight: "1.4", 
            flex: 1, 
            display: "-webkit-box", 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: "vertical", 
            overflow: "hidden" 
          }}>
            {product.name}
          </h3>

          {/* Star Rating (If available in your data) */}
          {product.averageRating > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
              <StarRating rating={Math.round(product.averageRating)} size="0.85rem" />
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted, #64748b)" }}>
                ({product.numReviews || 0})
              </span>
            </div>
          )}
          
          {/* Price Section */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "auto", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--text-main, #0f172a)" }}>
              {finalPrice.toLocaleString()} ETB
            </span>
            {discount > 0 && (
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted, #94a3b8)", textDecoration: "line-through" }}>
                {Number(product.price).toLocaleString()}
              </span>
            )}
          </div>

          {/* ✅ Add to Cart Button with Visual Feedback */}
          {addToCart && (
            <button 
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
              aria-label={isOutOfStock ? t("products.out_of_stock") : t("products.add_to_cart")}
              style={{ 
                width: "100%", 
                padding: "0.75rem", 
                background: isOutOfStock ? "#cbd5e1" : (isAdding ? "#10b981" : "var(--primary, #6366f1)"), 
                color: "white", 
                border: "none", 
                borderRadius: "8px", 
                fontWeight: "700", 
                fontSize: "0.9rem", 
                cursor: isOutOfStock ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem"
              }}
              onMouseEnter={(e) => {
                if (!isOutOfStock && !isAdding) {
                  e.currentTarget.style.background = "var(--primary-hover, #4f46e5)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isOutOfStock && !isAdding) {
                  e.currentTarget.style.background = "var(--primary, #6366f1)";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              {isOutOfStock ? (
                t("products.out_of_stock")
              ) : isAdding ? (
                <>
                  <span>✓</span> {t("products.added_to_cart", "Added!")}
                </>
              ) : (
                <>
                  <span>🛒</span> {t("products.add_to_cart")}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;