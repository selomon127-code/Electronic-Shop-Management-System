/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API from "../api/axios";
import { reviewApi } from "../api/adminApi";
import StarRating from "../components/StarRating";
import WishlistButton from "../components/WishlistButton";
import RecommendationShelf from "../components/RecommendationShelf";
import { getDiscountedPrice } from "../utils/productPricing";
import { trackRecentlyViewedProduct } from "../utils/recentlyViewed";

function ProductDetail({ addToCart, user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewSort, setReviewSort] = useState("newest");
  const [reviewRatingFilter, setReviewRatingFilter] = useState("");
  const [reviewRefresh, setReviewRefresh] = useState(0);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    let active = true;
    const fetchProduct = async () => {
      try {
        const { data } = await API.get(`/products/${id}`);
        if (active) setProduct(data);
      } catch (err) {
        console.error("Failed to fetch product:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (product && String(product._id) === String(id)) {
      trackRecentlyViewedProduct(product);
    }
  }, [id, product]);

  useEffect(() => {
    let active = true;
    const params = { sort: reviewSort };
    if (reviewRatingFilter) params.rating = reviewRatingFilter;

    reviewApi.getProductReviews(id, params)
      .then(({ data }) => {
        if (active) setReviews(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) {
          setReviews([]);
          setReviewMessage(
            err.response?.data?.message || "Could not load product reviews.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [id, reviewSort, reviewRatingFilter, reviewRefresh]);

  useEffect(() => {
    const previews = reviewImages.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setReviewImagePreviews(previews);

    return () => {
      previews.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, [reviewImages]);

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

  const handleReviewImagesChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";

    if (selectedFiles.length + reviewImages.length > 5) {
      setReviewMessage("You can attach up to 5 photos to a review.");
      return;
    }

    const oversizedImage = selectedFiles.find(
      (file) => file.size > 5 * 1024 * 1024,
    );
    if (oversizedImage) {
      setReviewMessage("Each review photo must be 5 MB or smaller.");
      return;
    }

    setReviewMessage("");
    setReviewImages((current) => [...current, ...selectedFiles]);
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    if (!newRating || !newComment.trim()) {
      setReviewMessage("Select a star rating and enter a comment.");
      return;
    }

    const formData = new FormData();
    formData.append("productId", product._id);
    formData.append("rating", String(newRating));
    formData.append("comment", newComment.trim());
    reviewImages.forEach((file) => formData.append("images", file));

    setReviewSubmitting(true);
    setReviewMessage("");
    try {
      await reviewApi.createReview(formData);
      setNewRating(0);
      setNewComment("");
      setReviewImages([]);
      setReviewMessage("Your review was submitted.");
      setReviewRefresh((current) => current + 1);
    } catch (err) {
      setReviewMessage(
        err.response?.data?.message || "Failed to submit your review.",
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 0;
  const discount = Number(product.discount) || 0;
  const discountedPrice = getDiscountedPrice(product);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Product Info Grid */}
      <div className="product-detail-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2.5rem", marginBottom: "3rem", background: "var(--bg-card)", padding: "2rem", borderRadius: "16px", border: "1px solid var(--border)" }}>
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
          
          <div style={{ display: "flex", alignItems: "baseline", gap: ".75rem", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0, color: "var(--success)", fontSize: "1.8rem", fontWeight: "800" }}>{discountedPrice.toLocaleString()} ETB</h2>
            {discount > 0 && (
              <>
                <span style={{ color: "var(--text-muted)", textDecoration: "line-through" }}>{Number(product.price).toLocaleString()} ETB</span>
                <span style={{ color: "var(--danger)", fontWeight: 700 }}>{discount}% OFF</span>
              </>
            )}
          </div>
          
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

      <RecommendationShelf productIds={[product._id]} addToCart={addToCart} user={user} />

      {/* Reviews Section */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
        <h2 style={{ marginBottom: "1.5rem", fontSize: "1.35rem" }}>
          Customer Reviews ({reviews.length})
        </h2>
        
        {user ? (
          <form
            onSubmit={handleSubmitReview}
            style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "12px", marginBottom: "2rem", border: "1px solid var(--border)" }}
          >
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem" }}>Write a Review</h3>
            <label style={{ display: "block", marginBottom: ".5rem", fontWeight: 600 }}>
              Your rating
            </label>
            <StarRating
              rating={newRating}
              setRating={setNewRating}
              interactive
              size="2rem"
            />
            <label
              htmlFor="review-comment"
              style={{ display: "block", margin: "1rem 0 .5rem", fontWeight: 600 }}
            >
              Your review
            </label>
            <textarea
              id="review-comment"
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              maxLength={2000}
              required
              rows={4}
              placeholder="Share your experience with this product..."
              style={{ width: "100%", boxSizing: "border-box", padding: ".75rem", borderRadius: "8px", border: "1px solid var(--border)", font: "inherit" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: ".8rem" }}>
              <span>{newComment.length}/2000</span>
              <span>Optional: add up to 5 photos (5 MB each)</span>
            </div>
            <label
              htmlFor="review-images"
              style={{ display: "block", margin: "1rem 0 .5rem", fontWeight: 600 }}
            >
              Photos
            </label>
            <input
              id="review-images"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              disabled={reviewSubmitting || reviewImages.length >= 5}
              onChange={handleReviewImagesChange}
            />
            {reviewImagePreviews.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem", marginTop: ".75rem" }}>
                {reviewImagePreviews.map(({ file, url }, index) => (
                  <div key={`${file.name}-${file.lastModified}-${index}`} style={{ position: "relative" }}>
                    <img
                      src={url}
                      alt={`Review upload preview ${index + 1}`}
                      style={{ width: "88px", height: "88px", objectFit: "cover", borderRadius: "8px" }}
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => setReviewImages((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                      style={{ display: "block", width: "100%", marginTop: ".25rem" }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            {reviewMessage && (
              <p role="status" style={{ color: reviewMessage === "Your review was submitted." ? "var(--success)" : "var(--danger)", margin: "1rem 0 0" }}>
                {reviewMessage}
              </p>
            )}
            <button
              type="submit"
              disabled={reviewSubmitting}
              style={{ display: "block", marginTop: "1rem", padding: ".7rem 1.2rem", background: "var(--primary)", color: "white", border: 0, borderRadius: "8px", fontWeight: 700, cursor: reviewSubmitting ? "wait" : "pointer" }}
            >
              {reviewSubmitting ? "Submitting..." : "Submit review"}
            </button>
          </form>
        ) : (
          <p style={{ marginBottom: "1.5rem", color: "var(--text-muted)" }}>
            <button type="button" onClick={() => navigate("/login")}>Log in</button> to write a review.
          </p>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <label>
            Sort by{" "}
            <select value={reviewSort} onChange={(event) => setReviewSort(event.target.value)}>
              <option value="newest">Newest</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
            </select>
          </label>
          <label>
            Filter by rating{" "}
            <select value={reviewRatingFilter} onChange={(event) => setReviewRatingFilter(event.target.value)}>
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>{rating} stars</option>
              ))}
            </select>
          </label>
        </div>

        {reviewMessage && !user && (
          <p role="status" style={{ color: "var(--danger)" }}>{reviewMessage}</p>
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
              {Array.isArray(review.images) && review.images.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: ".6rem", marginTop: "1rem" }}>
                  {review.images.map((image, index) => {
                    const imageUrl = typeof image === "string" ? image : image.url;
                    if (!imageUrl) return null;
                    return (
                      <a key={`${imageUrl}-${index}`} href={imageUrl} target="_blank" rel="noreferrer">
                        <img
                          src={imageUrl}
                          alt={`Photo ${index + 1} in ${review.user?.name || "customer"}'s review`}
                          loading="lazy"
                          style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }}
                        />
                      </a>
                    );
                  })}
                </div>
              )}
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