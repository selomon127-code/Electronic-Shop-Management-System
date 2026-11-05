import React, { useState } from "react";
import useAvailableCoupons from "../hooks/useAvailableCoupons";

export function CouponSelector({
  subtotal,
  onSelectCoupon,
  appliedCode = "",
  disabled = false,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { coupons: availableCoupons, loading: couponsLoading, error: couponsError } =
    useAvailableCoupons(subtotal !== undefined ? { subtotal } : undefined);

  const handleSelect = (code) => {
    if (disabled || code === appliedCode) return;
    onSelectCoupon(code);
  };

  return (
    <div className={`checkout-coupon-picker ${className}`}>
      <button
        type="button"
        className="checkout-coupon-toggle"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? "Hide available coupons" : "View available coupons"}
        {availableCoupons.length > 0 && (
          <span className="checkout-coupon-count-badge">
            {availableCoupons.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="checkout-coupon-options"
          aria-label="Available coupons"
          role="region"
        >
          {couponsLoading ? (
            <p role="status" className="checkout-coupon-status">
              Loading available coupons…
            </p>
          ) : couponsError ? (
            <p role="alert" className="checkout-coupon-status checkout-coupon-status--error">
              {couponsError}
            </p>
          ) : availableCoupons.length ? (
            availableCoupons.map((coupon) => {
              const isApplied = coupon.code === appliedCode;
              const discountText =
                coupon.type === "percentage"
                  ? `${coupon.value}% off`
                  : `${Number(coupon.value).toLocaleString()} ETB off`;
              const minText =
                Number(coupon.minimumSubtotal) > 0
                  ? ` · min. ${Number(coupon.minimumSubtotal).toLocaleString()} ETB`
                  : "";

              return (
                <button
                  type="button"
                  key={coupon.code}
                  disabled={disabled || isApplied}
                  onClick={() => handleSelect(coupon.code)}
                  className={`checkout-coupon-option ${
                    isApplied ? "checkout-coupon-option--applied" : ""
                  }`}
                  aria-label={`Select coupon ${coupon.code}: ${discountText}${minText}${
                    isApplied ? " (Already applied)" : ""
                  }`}
                >
                  <div className="checkout-coupon-option__info">
                    <strong className="checkout-coupon-option__code">{coupon.code}</strong>
                    <span className="checkout-coupon-option__desc">
                      {discountText}
                      {minText}
                    </span>
                  </div>
                  <span
                    className={`checkout-coupon-option__action ${
                      isApplied ? "checkout-coupon-option__action--applied" : ""
                    }`}
                  >
                    {isApplied ? "Applied ✓" : "Apply"}
                  </span>
                </button>
              );
            })
          ) : (
            <p className="checkout-coupon-status">No active coupons are available.</p>
          )}
        </div>
      )}

      <style>{`
        .checkout-coupon-picker {
          margin: -0.25rem 0 0.85rem;
          width: 100%;
          box-sizing: border-box;
        }
        .checkout-coupon-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          min-height: 36px;
          padding: 0.25rem 0;
          border: 0;
          background: transparent;
          color: var(--primary, #4f46e5);
          font: inherit;
          font-size: 0.88rem;
          font-weight: 700;
          text-decoration: underline;
          cursor: pointer;
        }
        .checkout-coupon-toggle:hover {
          color: #3730a3;
        }
        .checkout-coupon-count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 9999px;
          background: #e0e7ff;
          color: #3730a3;
          font-size: 0.72rem;
          font-weight: 800;
          text-decoration: none;
        }
        .checkout-coupon-options {
          display: grid;
          gap: 0.5rem;
          margin-top: 0.5rem;
          animation: coupon-picker-expand 0.2s ease-out;
        }
        .checkout-coupon-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          min-height: 44px;
          padding: 0.65rem 0.85rem;
          border: 1px solid var(--border, #cbd5e1);
          border-radius: 8px;
          background: var(--bg-card, #ffffff);
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
          width: 100%;
          box-sizing: border-box;
        }
        .checkout-coupon-option:hover:not(:disabled) {
          border-color: var(--primary, #4f46e5);
          background: #f8fafc;
        }
        .checkout-coupon-option:disabled {
          cursor: default;
        }
        .checkout-coupon-option--applied {
          background: #f0fdf4;
          border-color: #86efac;
        }
        .checkout-coupon-option__info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 0;
        }
        .checkout-coupon-option__code {
          color: var(--primary, #4f46e5);
          font-size: 0.92rem;
          letter-spacing: 0.04em;
        }
        .checkout-coupon-option--applied .checkout-coupon-option__code {
          color: #15803d;
        }
        .checkout-coupon-option__desc {
          color: var(--text-muted, #64748b);
          font-size: 0.82rem;
        }
        .checkout-coupon-option__action {
          display: inline-flex;
          align-items: center;
          padding: 0.3rem 0.65rem;
          border-radius: 6px;
          background: #eef2ff;
          color: #4338ca;
          font-size: 0.78rem;
          font-weight: 700;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }
        .checkout-coupon-option__action--applied {
          background: #d1fae5;
          color: #065f46;
        }
        .checkout-coupon-status {
          margin: 0.35rem 0;
          color: var(--text-muted, #64748b);
          font-size: 0.85rem;
        }
        .checkout-coupon-status--error {
          color: var(--danger, #ef4444);
        }
        @keyframes coupon-picker-expand {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 420px) {
          .checkout-coupon-option {
            align-items: flex-start;
            flex-direction: column;
          }
          .checkout-coupon-option__action {
            align-self: flex-end;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .checkout-coupon-options {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default CouponSelector;
