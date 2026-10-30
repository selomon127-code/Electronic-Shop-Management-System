import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API from "../api/axios"; // ✅ Use the main API instance
import StarRating from "../components/StarRating";

function ProductDetail({ addToCart, user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ✅ Fetch REAL product from backend
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await API.get(`/products/${id}`);
        setProduct(data);
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // ✅ Fetch reviews when product loads
  useEffect(() => {
    const fetchReviews = async () => {
      if (!product) return;
      try {
        // ✅ FIXED: Try the standard endpoint. 
        // If your backend uses '/product/:id', change this to `/reviews/product/${product._id}`
        const { data } = await API.get(`/reviews/${product._id}`);
        setReviews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("⚠️ Could not load reviews (endpoint might differ or no reviews yet):", err.message);
        setReviews([]); // ✅ Gracefully fallback to empty array so the page doesn't break
      }
    };
    
    fetchReviews();
  }, [product]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔄</div>
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <h2>❌ {t("products.not_found") || "Product not found"}</h2>
        <button onClick={() => navigate("/products")} style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#6366f1", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          ← {t("products.back_to_products") || "Back to Products"}
        </button>
      </div>
    );
  }

  function handleAddToCart() {
    addToCart(product);
    navigate("/cart");
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newRating || !newComment.trim()) {
      alert(t("products.rating_comment_required") || "Please provide both a rating and a comment.");
      return;
    }
    
    setSubmitting(true);
    try {
      await API.post("/reviews", { 
        productId: product._id, 
        rating: newRating, 
        comment: newComment 
      });
      
      alert(t("common.success") + "!");
      setNewRating(0);
      setNewComment("");
      
      // Refresh reviews
      const { data } = await API.get(`/reviews/${product._id}`);
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      alert(err.response?.data?.message || (t("products.review_failed") || "Failed to submit review. Are you logged in?"));
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 0;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
      {/* Product Details Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", marginBottom: "3rem", background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <div style={{ width: "100%", aspectRatio: "1/1", background: "#f8fafc", borderRadius: "12px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.src = "https://via.placeholder.com/400/cccccc/666666?text=No+Image"; }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{ display: "inline-block", padding: "0.25rem 0.75rem", background: "#eef2ff", color: "#6366f1", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "600", width: "fit-content", marginBottom: "0.5rem" }}>
            {product.category}
          </span>
          
          <h1 style={{ margin: "0 0 1rem 0", color: "#1e293b", fontSize: "2rem" }}>{product.name}</h1>
          
          {reviews.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <StarRating rating={Math.round(avgRating)} size="1.2rem" />
              <span style={{ color: "#64748b", fontSize: "0.9rem", fontWeight: "500" }}>
                {avgRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? (t("products.review") || "review") : (t("products.reviews") || "reviews")})
              </span>
            </div>
          )}

          <p style={{ color: "#475569", lineHeight: "1.6", marginBottom: "1.5rem" }}>{product.description}</p>
          
          <h2 style={{ margin: "0 0 1.5rem 0", color: "#10b981", fontSize: "1.8rem" }}>
            {new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB" }).format(product.price)}
          </h2>
          
          <p style={{ marginBottom: "1.5rem", color: product.stock > 0 ? "#10b981" : "#ef4444", fontWeight: "600" }}>
            {product.stock > 0 ? `✅ ${t("products.in_stock")} (${product.stock} ${t("products.available") || "available"})` : `❌ ${t("products.out_of_stock")}`}
          </p>
          
          <button onClick={handleAddToCart} disabled={product.stock <= 0} style={{ padding: "0.85rem 1.5rem", background: product.stock > 0 ? "#6366f1" : "#cbd5e1", color: "white", border: "none", borderRadius: "8px", cursor: product.stock > 0 ? "pointer" : "not-allowed", fontWeight: "600", fontSize: "1rem", transition: "background 0.2s" }}>
            🛒 {t("products.add_to_cart")}
          </button>
        </div>
      </div>

      {/* Reviews Section */}
      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "2rem" }}>
        <h2 style={{ marginBottom: "1.5rem", color: "#1e293b" }}>
          {t("products.customer_reviews") || "Customer Reviews"} ({reviews.length})
        </h2>
        
        {user ? (
          <form onSubmit={handleSubmitReview} style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "12px", marginBottom: "2rem", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: "0 0 1rem 0", color: "#1e293b" }}>{t("products.write_review") || "Write a Review"}</h3>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>{t("products.rating") || "Rating"}</label>
              <StarRating rating={newRating} setRating={setNewRating} interactive={true} size="2rem" />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>{t("products.comment") || "Comment"}</label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows="4"
                placeholder={t("products.share_experience") || "Share your experience with this product..."}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", boxSizing: "border-box" }}
              />
            </div>
            <button type="submit" disabled={submitting} style={{ padding: "0.75rem 1.5rem", background: submitting ? "#94a3b8" : "#6366f1", color: "white", border: "none", borderRadius: "8px", cursor: submitting ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "0.95rem" }}>
              {submitting ? (t("common.loading") || "Submitting...") : (t("products.submit_review") || "Submit Review")}
            </button>
          </form>
        ) : (
          <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "12px", marginBottom: "2rem", border: "1px solid #e2e8f0", textAlign: "center" }}>
            <p style={{ color: "#64748b", marginBottom: "1rem" }}>{t("products.login_to_review") || "Please log in to write a review."}</p>
            <button onClick={() => navigate("/login")} style={{ padding: "0.6rem 1.2rem", background: "#6366f1", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
              {t("nav.login")}
            </button>
          </div>
        )}

        {reviews.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {reviews.map((review) => (
              <div key={review._id} style={{ padding: "1.5rem", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: "#6366f1" }}>
                      {review.user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <strong style={{ color: "#1e293b" }}>{review.user?.name || "Anonymous"}</strong>
                      <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        {new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size="1rem" />
                </div>
                <p style={{ color: "#475569", lineHeight: "1.6", margin: 0 }}>{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "2rem", color: "#64748b", background: "#f8fafc", borderRadius: "12px" }}>
            <p>{t("products.no_reviews_yet") || "No reviews yet. Be the first to share your thoughts!"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetail;