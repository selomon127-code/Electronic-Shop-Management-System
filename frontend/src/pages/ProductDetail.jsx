/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API from "../api/axios";
import StarRating from "../components/StarRating";

function ProductDetail({ addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(); // ✅ Initialize translation

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => {
    const fetchReviews = async () => {
      if (!product) return;
      try {
        const { data } = await API.get(`/reviews/${product._id}`);
        setReviews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("⚠️ Could not load reviews:", err.message);
        setReviews([]);
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
        <h2>❌ {t("products.not_found")}</h2>
        <button 
          onClick={() => navigate("/products")} 
          style={{ 
            marginTop: "1rem", 
            padding: "0.75rem 1.5rem", 
            background: "#6366f1", 
            color: "white", 
            border: "none", 
            borderRadius: "8px", 
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          ← {t("products.back_to_products")}
        </button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product);
    navigate("/cart");
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : "0";

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
        gap: "3rem", 
        marginBottom: "3rem",
        background: "white",
        padding: "2.5rem",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
      }}>
        {/* Product Image */}
        <div style={{ 
          width: "100%", 
          aspectRatio: "1/1", 
          background: "#f8fafc", 
          borderRadius: "16px", 
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <img 
            src={product.image} 
            alt={product.name} 
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
            onError={(e) => { 
              e.target.src = "https://via.placeholder.com/400?text=No+Image"; 
            }}
          />
        </div>

        {/* Product Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <span style={{ 
              display: "inline-block", 
              padding: "0.4rem 1rem", 
              background: "#eef2ff", 
              color: "#6366f1", 
              borderRadius: "20px", 
              fontSize: "0.85rem", 
              fontWeight: "600",
              marginBottom: "1rem"
            }}>
              {product.category}
            </span>
            
            <h1 style={{ 
              margin: "0.5rem 0", 
              color: "#1e293b", 
              fontSize: "2.2rem",
              fontWeight: "800"
            }}>
              {product.name}
            </h1>

            {reviews.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <StarRating rating={Math.round(avgRating)} size="1.4rem" />
                <span style={{ color: "#64748b", fontSize: "1rem" }}>
                  {avgRating} ({reviews.length} {reviews.length === 1 ? t("products.review") : t("products.reviews")})
                </span>
              </div>
            )}
          </div>

          <p style={{ 
            color: "#475569", 
            lineHeight: "1.7", 
            fontSize: "1.05rem",
            margin: "0"
          }}>
            {product.description}
          </p>

          <div style={{ 
            fontSize: "2.5rem", 
            color: "#10b981", 
            fontWeight: "800",
            margin: "0.5rem 0"
          }}>
            {new Intl.NumberFormat("en-ET", { 
              style: "currency", 
              currency: "ETB" 
            }).format(product.price)}
          </div>

          <p style={{ 
            fontSize: "1.1rem", 
            fontWeight: "600",
            color: product.stock > 0 ? "#10b981" : "#ef4444",
            margin: "0"
          }}>
            {product.stock > 0 
              ? `✅ ${t("products.in_stock")} (${product.stock} ${t("products.available")})` 
              : ` ${t("products.out_of_stock")}`
            }
          </p>

          <button 
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            style={{ 
              padding: "1.1rem 2rem",
              background: product.stock > 0 
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)" 
                : "#cbd5e1",
              color: "white", 
              border: "none", 
              borderRadius: "12px", 
              cursor: product.stock > 0 ? "pointer" : "not-allowed", 
              fontWeight: "700", 
              fontSize: "1.1rem",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: product.stock > 0 ? "0 4px 15px rgba(99,102,241,0.4)" : "none"
            }}
            onMouseEnter={(e) => {
              if (product.stock > 0) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(99,102,241,0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (product.stock > 0) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 15px rgba(99,102,241,0.4)";
              }
            }}
          >
            🛒 {t("products.add_to_cart")}
          </button>
        </div>
      </div>

      {/* Reviews Section */}
      <div style={{ 
        borderTop: "2px solid #e2e8f0", 
        paddingTop: "2.5rem",
        marginTop: "2rem"
      }}>
        <h2 style={{ 
          marginBottom: "2rem", 
          color: "#1e293b",
          fontSize: "1.8rem",
          fontWeight: "700"
        }}>
          {t("products.customer_reviews")} ({reviews.length})
        </h2>

        {reviews.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {reviews.map((review) => (
              <div 
                key={review._id} 
                style={{ 
                  padding: "1.75rem", 
                  background: "white", 
                  borderRadius: "12px", 
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                }}
              >
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  marginBottom: "1rem" 
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{
                      width: "48px", 
                      height: "48px", 
                      borderRadius: "50%", 
                      background: "linear-gradient(135deg, #6366f1, #ec4899)",
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      fontWeight: "700", 
                      color: "white",
                      fontSize: "1.2rem"
                    }}>
                      {review.user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <strong style={{ color: "#1e293b", fontSize: "1.05rem" }}>
                        {review.user?.name || t("products.anonymous")}
                      </strong>
                      <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                        {new Date(review.createdAt).toLocaleDateString(
                          t("locale") || "en-US", 
                          { year: "numeric", month: "short", day: "numeric" }
                        )}
                      </div>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size="1.2rem" />
                </div>
                <p style={{ 
                  color: "#475569", 
                  lineHeight: "1.6", 
                  margin: 0,
                  fontSize: "1rem"
                }}>
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: "center", 
            padding: "3rem", 
            color: "#64748b", 
            background: "#f8fafc", 
            borderRadius: "12px",
            border: "2px dashed #e2e8f0"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💬</div>
            <p style={{ fontSize: "1.1rem", margin: 0 }}>
              {t("products.no_reviews_yet")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetail;