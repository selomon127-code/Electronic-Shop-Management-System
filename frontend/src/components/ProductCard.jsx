// ecommerce-app/src/components/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import StarRating from "./StarRating";

function ProductCard({ product, addToCart, isInWishlist, onToggleWishlist }) {
  if (!product) return null;

  // Accept BOTH 'stock' and 'quantity' from the database
  const availableStock = product.stock ?? product.quantity ?? 0;
  
  // Use the database image directly
  const imageUrl = product.image || "https://placehold.co/300x300/e2e8f0/64748b?text=No+Image";

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (addToCart) addToCart(product);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWishlist) onToggleWishlist(product);
  };

  return (
    <Link 
      to={`/product/${product._id || product.id}`} 
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div style={{
        background: "white",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        transition: "transform 0.2s, box-shadow 0.2s",
        display: "flex",
        flexDirection: "column",
        height: "100%"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
      }}
      >
        {/* Image Container */}
        <div style={{ 
          position: "relative", 
          width: "100%", 
          paddingTop: "100%", 
          background: "#f8fafc",
          overflow: "hidden"
        }}>
          <img
            src={imageUrl}
            alt={product.name}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.3s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          />
          
          {/* Wishlist Button */}
          {onToggleWishlist && (
            <button
              onClick={handleWishlist}
              style={{
                position: "absolute",
                top: "0.75rem",
                right: "0.75rem",
                background: "white",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                fontSize: "1.2rem",
                transition: "transform 0.2s",
                zIndex: 10
              }}
            >
              {isInWishlist ? "❤️" : "🤍"}
            </button>
          )}

          {/* Stock Badge */}
          {availableStock <= 0 && (
            <div style={{
              position: "absolute",
              top: "0.75rem",
              left: "0.75rem",
              background: "#ef4444",
              color: "white",
              padding: "0.25rem 0.6rem",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: "600",
              zIndex: 10
            }}>
              Out of Stock
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ 
            fontSize: "0.75rem", 
            color: "#6366f1", 
            fontWeight: "600", 
            textTransform: "uppercase", 
            marginBottom: "0.25rem" 
          }}>
            {product.category}
          </div>
          
          <h3 style={{ 
            margin: "0 0 0.5rem 0", 
            fontSize: "1rem", 
            fontWeight: "600", 
            color: "#1e293b",
            lineHeight: "1.4",
            display: "-webkit-box",
            WebkitLineClamp: 1, // Keep name to 1 line
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}>
            {product.name}
          </h3>

          {/* ✅ NEW: Description Section (Shows up to 3 lines) */}
          {product.description && (
            <p style={{ 
              margin: "0 0 0.75rem 0", 
              fontSize: "0.85rem", 
              color: "#64748b", 
              lineHeight: "1.5",
              display: "-webkit-box",
              WebkitLineClamp: 3, // ✅ Change this number to show more/less lines (e.g., 4 or 5)
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              {product.description}
            </p>
          )}

          {/* Rating Display */}
          {product.averageRating > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
              <StarRating rating={Math.round(product.averageRating)} size="0.85rem" />
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                ({product.numReviews})
              </span>
            </div>
          )}

          <div style={{ 
            marginTop: "auto", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            paddingTop: "0.75rem"
          }}>
            <span style={{ 
              fontSize: "1.2rem", 
              fontWeight: "700", 
              color: "#10b981" 
            }}>
              {product.price?.toLocaleString()} ETB
            </span>
            
            <button
              onClick={handleAddToCart}
              disabled={availableStock <= 0}
              style={{
                background: availableStock > 0 ? "#6366f1" : "#cbd5e1",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "0.5rem 0.85rem",
                cursor: availableStock > 0 ? "pointer" : "not-allowed",
                fontSize: "0.85rem",
                fontWeight: "600",
                transition: "background 0.2s"
              }}
            >
              {availableStock > 0 ? "🛒 Add" : "Sold Out"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;