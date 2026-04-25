// ecommerce-app/src/components/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";

function ProductCard({ product, addToCart }) {
  // 🔹 Format price in Ethiopian Birr
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price || 0);
  };

  // 🔹 Get stock status with color & message
  const getStockStatus = (stock) => {
    if (stock > 10) return { color: "#28a745", text: "✅ In Stock", badge: "In Stock" };
    if (stock > 0) return { color: "#ffc107", text: `⚠️ Only ${stock} left`, badge: "Low Stock" };
    return { color: "#dc3545", text: "❌ Out of Stock", badge: "Out of Stock" };
  };

  const stock = getStockStatus(product.stock);

  // 🔹 Handle image error with fallback
  const handleImageError = (e) => {
    e.target.src = "https://via.placeholder.com/300x300/cccccc/666666?text=No+Image";
    e.target.onerror = null; // Prevent infinite loop
  };

  // 🔹 Handle add to cart with visual feedback
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.stock <= 0) return; // Prevent adding out-of-stock items
    
    addToCart(product);
    
    // Visual feedback on button
    const btn = e.currentTarget;
    const originalText = btn.innerHTML;
    const originalBg = btn.style.background;
    
    btn.innerHTML = "✅ Added!";
    btn.style.background = "#28a745";
    btn.disabled = true;
    
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = originalBg;
      btn.disabled = false;
    }, 1500);
  };

  return (
    <Link
  to={`/product/${product._id}`}
  className="product-card"  // ✅ Add class for CSS targeting
  style={{
    // ✅ Use CSS variables instead of hardcoded colors:
    background: "var(--card-bg)",
    color: "var(--text-primary)",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "var(--card-shadow)",
    textDecoration: "none",
    transition: "transform 0.2s, box-shadow 0.2s",
    position: "relative",
    height: "100%",
    display: "flex",
    flexDirection: "column"
  }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.15)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "";
      }}
      onClick={(e) => {
        // Allow link navigation, but prevent Add button click from navigating
        if (e.target.closest("button")) {
          e.preventDefault();
        }
      }}
    >
      {/* 🔹 Product Image Container */}
 <div style={{ 
  position: "relative", 
  paddingTop: "100%",
  background: "var(--bg-tertiary)",  // ✅ Use CSS variable
  overflow: "hidden"
}}>
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onError={handleImageError}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.3s"
          }}
        />
        
        {/* 🔹 Stock Badge */}
        <span style={{
          position: "absolute",
          top: "0.75rem",
          right: "0.75rem",
          padding: "0.25rem 0.6rem",
          background: stock.color,
          color: "white",
          borderRadius: "20px",
          fontSize: "0.75rem",
          fontWeight: "600",
          textTransform: "uppercase",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
        }}>
          {stock.badge}
        </span>
        
        {/* 🔹 Quick Add Button */}
        <button
          id={`btn-${product._id}`}
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
          style={{
            position: "absolute",
            bottom: "0.75rem",
            right: "0.75rem",
            padding: "0.5rem 1rem",
            background: product.stock > 0 ? "var(--button-primary)" : "var(--border-color)",  // ✅ Use CSS variable
    color: "white",
            border: "none",
            borderRadius: "20px",
            cursor: product.stock > 0 ? "pointer" : "not-allowed",
            fontWeight: "600",
            fontSize: "0.85rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            transition: "all 0.2s",
            opacity: 0.95,
            zIndex: 1
          }}
          onMouseOver={(e) => {
            if (product.stock > 0) {
              e.currentTarget.style.background = "#5568d3";
              e.currentTarget.style.transform = "scale(1.05)";
            }
          }}
          onMouseOut={(e) => {
            if (product.stock > 0) {
              e.currentTarget.style.background = "#667eea";
              e.currentTarget.style.transform = "";
            }
          }}
        >
          🛒 Add
        </button>
      </div>
      
      {/* 🔹 Product Info */}
     <div style={{ 
  padding: "1.25rem", 
  flex: 1, 
  display: "flex",
  flexDirection: "column" 
}}>
        {/* Category Tag */}
        <span style={{ 
           fontSize: "0.8rem", 
    color: "var(--accent-color)",  // ✅ Use CSS variable
    fontWeight: "600",
          textTransform: "uppercase", 
          marginBottom: "0.25rem",
          letterSpacing: "0.5px"
        }}>
          {product.category}
        </span>
        
        {/* Product Name */}
        <h3 style={{ 
          margin: "0 0 0.5rem 0", 
    color: "var(--text-primary)", 
          fontSize: "1.1rem",
          fontWeight: "600", 
          lineHeight: "1.4",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
        }}>
          {product.name}
        </h3>
        
        {/* Description (truncated) */}
        <p style={{ 
          margin: "0 0 1rem 0", 
    color: "var(--text-secondary)",
          fontSize: "0.9rem",
          lineHeight: "1.5",
          flex: 1,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
        }}>
          {product.description}
        </p>
        
        {/* Price & Stock Row */}
        <div style={{ 
    display: "flex",
    justifyContent: "space-between", 
    alignItems: "center",
    marginTop: "auto",
    paddingTop: "0.75rem",
    borderTop: `1px solid var(--border-color)`  // ✅ Use CSS variable
  }}>
          {/* Price in ETB */}
            <span style={{ 
      fontSize: "1.25rem", 
      fontWeight: "700", 
      color: "var(--button-success)"  // ✅ Use CSS variable
    }}>
            {formatPrice(product.price)}
          </span>
          
          {/* Stock Text */}
         <span style={{ 
      fontSize: "0.8rem", 
      color: stock.color,  // ✅ Keep dynamic color
      fontWeight: "600"
    }}>
            {stock.text}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;