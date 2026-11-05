import React, { useRef, useState, useEffect } from "react";
import useAvailableCoupons from "../hooks/useAvailableCoupons";
import { CouponCard } from "./CouponCard";

export function PromotionalBanner({ compact = false, subtotal, className = "" }) {
  const { coupons, loading, error } = useAvailableCoupons(
    subtotal !== undefined ? { subtotal } : undefined,
  );
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll, { passive: true });
    }
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [coupons]);

  const handleScroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.75, 260);
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <aside
        className={`promotional-banner promotional-banner--loading ${
          compact ? "promotional-banner--compact" : ""
        } ${className}`}
        aria-label="Available promotions loading"
        aria-busy="true"
      >
        <div className="promotional-banner__header">
          <div className="promo-skeleton promo-skeleton--title" />
        </div>
        <div className="promotional-banner__strip">
          <div className="promo-skeleton promo-skeleton--card" />
          <div className="promo-skeleton promo-skeleton--card" />
        </div>
        <style>{styles}</style>
      </aside>
    );
  }

  if (error) {
    return (
      <aside
        className={`promotional-banner promotional-banner--error ${
          compact ? "promotional-banner--compact" : ""
        } ${className}`}
        aria-label="Available promotions"
        aria-live="polite"
      >
        <p className="coupon-promo-error" role="status">
          {error}
        </p>
        <style>{styles}</style>
      </aside>
    );
  }

  if (!coupons || coupons.length === 0) {
    return null;
  }

  return (
    <aside
      className={`promotional-banner ${
        compact ? "promotional-banner--compact" : ""
      } ${className}`}
      aria-label="Available promotions"
      aria-live="polite"
    >
      <div className="promotional-banner__header">
        <div className="promotional-banner__title-group">
          <span className="promotional-banner__icon" aria-hidden="true">🎉</span>
          <strong className="promotional-banner__title">
            {compact ? "Available offers" : "Exclusive Deals & Promotions"}
          </strong>
          <span className="promotional-banner__badge">
            {coupons.length} active {coupons.length === 1 ? "offer" : "offers"}
          </span>
        </div>

        {coupons.length > 1 && (
          <div className="promotional-banner__controls" aria-hidden="true">
            <button
              type="button"
              className="promotional-banner__nav-btn"
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              aria-label="Previous promotion"
              tabIndex={-1}
            >
              ‹
            </button>
            <button
              type="button"
              className="promotional-banner__nav-btn"
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              aria-label="Next promotion"
              tabIndex={-1}
            >
              ›
            </button>
          </div>
        )}
      </div>

      <div
        className="promotional-banner__strip coupon-promo-list"
        ref={scrollRef}
        role="region"
        aria-label="Promotion cards"
      >
        {coupons.map((coupon) => (
          <div key={coupon.code} className="promotional-banner__card-wrapper">
            <CouponCard coupon={coupon} compact={compact} showCopy />
          </div>
        ))}
      </div>

      <style>{styles}</style>
    </aside>
  );
}

const styles = `
.promotional-banner {
  position: relative;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 1.15rem 1.25rem;
  color: #1e1b4b;
  background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #fdf2f8 100%);
  border: 1px solid #c7d2fe;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
  overflow: hidden;
  margin: 0 0 1.25rem;
}
.promotional-banner--compact {
  padding: 0.85rem 1rem;
  border-radius: 12px;
}
.promotional-banner__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}
.promotional-banner__title-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.promotional-banner__icon {
  font-size: 1.25rem;
}
.promotional-banner__title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #312e81;
  letter-spacing: -0.01em;
}
.promotional-banner--compact .promotional-banner__title {
  font-size: 0.95rem;
}
.promotional-banner__badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  background: #e0e7ff;
  color: #3730a3;
  font-size: 0.75rem;
  font-weight: 700;
}
.promotional-banner__controls {
  display: flex;
  gap: 0.35rem;
}
.promotional-banner__nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #c7d2fe;
  border-radius: 50%;
  background: #ffffff;
  color: #4338ca;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  transition: all 0.15s ease;
}
.promotional-banner__nav-btn:hover:not(:disabled) {
  background: #4f46e5;
  color: #ffffff;
  border-color: #4f46e5;
}
.promotional-banner__nav-btn:disabled {
  opacity: 0.35;
  cursor: default;
}
.promotional-banner__strip {
  display: flex;
  gap: 0.85rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
  padding-bottom: 0.35rem;
}
.promotional-banner__strip::-webkit-scrollbar {
  height: 6px;
}
.promotional-banner__strip::-webkit-scrollbar-track {
  background: transparent;
}
.promotional-banner__strip::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.promotional-banner__card-wrapper {
  flex: 1 0 280px;
  max-width: 360px;
  scroll-snap-align: start;
  min-width: 0;
}
.promotional-banner--compact .promotional-banner__card-wrapper {
  flex: 1 0 250px;
  max-width: 320px;
}
.promotional-banner--error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}
.coupon-promo-error {
  margin: 0;
  color: #991b1b;
  font-size: 0.9rem;
  font-weight: 600;
}
.promo-skeleton {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: promo-shimmer 1.5s infinite;
  border-radius: 8px;
}
.promo-skeleton--title {
  width: 180px;
  height: 22px;
}
.promo-skeleton--card {
  height: 120px;
  flex: 1 0 260px;
  border-radius: 12px;
}
@keyframes promo-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@media (max-width: 480px) {
  .promotional-banner {
    padding: 0.85rem;
    border-radius: 12px;
  }
  .promotional-banner__card-wrapper {
    flex: 1 0 100%;
    max-width: 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .promo-skeleton {
    animation: none !important;
  }
  .promotional-banner__strip {
    scroll-behavior: auto !important;
  }
}
`;

export default PromotionalBanner;
