/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API from "../api/axios";
import StarRating from "../components/StarRating";
import WishlistButton from "../components/WishlistButton";

function ProductDetail({ addToCart, user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, revRes] = await Promise.all([
          API.get(`/products/${id}`),
          API.get(`/reviews/${id}`).catch(() => ({ data: [] }))
        ]);
        setProduct(prodRes.data);
        setReviews(Array.isArray(revRes.data) ? revRes.data : []);
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div style={{ padding: "4rem", textAlign: "center" }}>Loading... 🔄</div>;
  if (!product) return <div style={{ padding: "4rem", textAlign: "center" }}><h2>Product not found</h2><button onClick={() => navigate("/products")} style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>← Back to Products</button></div>;

  const handleAddToCart = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    addToCart(product);
    navigate("/cart");
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 0;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Product Info Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2.5rem", marginBottom: "3rem", background: "var(--bg-card)", padding: "2rem", borderRadius: "16px", border: "1px solid var(--border)" }}>
        <div style={{ width: "100%", aspectRatio: "1/1", background: "#f1f5f9", borderRadius: "12px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "1rem" }} onError={(e) => { e.target.src = "https://via.placeholder.com/400?text=No+Image"; }} />
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{ display: "inline-block", padding: "0.3rem 0.8rem", background: "#eef2ff", color: "var(--primary)", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "600", width: "fit-content", marginBottom: "0.75rem" }}>{product.category}</span>
          <h1 style={{ margin: "0 0 0.75rem 0", fontSize: "1.75rem", fontWeight: "800" }}>{product.name}</h1>
          
          {reviews.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <StarRating rating={Math.round(avgRating)} size="1.1rem" />
              <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{avgRating.toFixed(1)} ({reviews.length} reviews)</span>
            </div>
          )}
          
          <p style={{ color: "var(--text-muted)", lineHeight: "1.6", marginBottom: "1.5rem", fontSize: "0.95rem" }}>{product.description}</p>
          
          <h2 style={{ margin: "0 0 1rem 0", color: "var(--success)", fontSize: "1.8rem", fontWeight: "800" }}>{product.price.toLocaleString()} ETB</h2>
          
          <p style={{ marginBottom: "1.5rem", color: product.stock > 0 ? "var(--success)" : "var(--danger)", fontWeight: "600", fontSize: "0.95rem" }}>
            {product.stock > 0 ? `✅ In Stock (${product.stock} available)` : `❌ Out of Stock`}
          </p>
          
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
            <button onClick={handleAddToCart} disabled={product.stock <= 0} style={{ padding: "0.85rem 1.5rem", background: product.stock > 0 ? "var(--primary)" : "#cbd5e1", color: "white", border: "none", borderRadius: "8px", cursor: product.stock > 0 ? "pointer" : "not-allowed", fontWeight: "700", fontSize: "1rem", transition: "transform 0.2s" }}
              onMouseEnter={(e) => { if (product.stock > 0) e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              🛒 Add to Cart
            </button>
            <WishlistButton product={product} user={user} className="product-detail-wishlist" />
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
        <h2 style={{ marginBottom: "1.5rem", fontSize: "1.35rem" }}>Customer Reviews ({reviews.length})</h2>
        
        {user && (
          <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "12px", marginBottom: "2rem", border: "1px solid var(--border)" }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem" }}>Write a Review</h3>
            {/* Add your review form here, keeping inputs compact with padding: 0.5rem */}
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Review submission form goes here (keep it compact).</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {reviews.length > 0 ? reviews.map((review) => (
            <div key={review._id} style={{ padding: "1.25rem", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: "var(--primary)", fontSize: "0.9rem" }}>
                    {review.user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <strong style={{ color: "var(--text-main)", fontSize: "0.95rem" }}>{review.user?.name || "Anonymous"}</strong>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{new Date(review.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <StarRating rating={review.rating} size="0.9rem" />
              </div>
              <p style={{ color: "var(--text-muted)", lineHeight: "1.5", margin: 0, fontSize: "0.95rem" }}>{review.comment}</p>
            </div>
          )) : (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", background: "#f8fafc", borderRadius: "12px" }}>
              <p>No reviews yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;