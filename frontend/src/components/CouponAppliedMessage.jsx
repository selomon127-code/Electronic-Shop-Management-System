import React from "react";

export function CouponAppliedMessage({
  appliedCoupon,
  onRemove,
  showRemoveButton = false,
  className = "",
}) {
  if (!appliedCoupon?.coupon?.code) return null;

  const { coupon, couponDiscount } = appliedCoupon;
  const discountAmount = Number(couponDiscount || 0).toLocaleString();

  return (
    <div
      role="status"
      aria-live="polite"
      className={`coupon-applied-message ${className}`}
    >
      <div className="coupon-applied-message__content">
        <span className="coupon-applied-message__icon" aria-hidden="true">🎉</span>
        <div className="coupon-applied-message__text">
          <p className="coupon-applied-message__title">
            Coupon <strong>{coupon.code}</strong> applied!
          </p>
          <p className="coupon-applied-message__saving">
            You save <strong>{discountAmount} ETB</strong> on this order.
          </p>
        </div>
      </div>

      {showRemoveButton && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="coupon-applied-message__btn-remove"
        >
          Remove
        </button>
      )}

      <style>{`
        .coupon-applied-message {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: #f0fdf4;
          border: 1px solid #86efac;
          border-radius: 10px;
          margin-bottom: 0.75rem;
          box-sizing: border-box;
          animation: coupon-slide-in 0.25s ease-out;
        }
        .coupon-applied-message__content {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          min-width: 0;
        }
        .coupon-applied-message__icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }
        .coupon-applied-message__text {
          min-width: 0;
        }
        .coupon-applied-message__title {
          margin: 0;
          color: #14532d;
          font-size: 0.9rem;
          font-weight: 700;
        }
        .coupon-applied-message__title strong {
          color: #15803d;
          letter-spacing: 0.03em;
        }
        .coupon-applied-message__saving {
          margin: 0.15rem 0 0;
          color: #166534;
          font-size: 0.82rem;
        }
        .coupon-applied-message__btn-remove {
          padding: 0.35rem 0.65rem;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          background: #ffffff;
          color: #dc2626;
          font: inherit;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background-color 0.15s ease, border-color 0.15s ease;
        }
        .coupon-applied-message__btn-remove:hover {
          background: #fee2e2;
          border-color: #fca5a5;
        }
        @keyframes coupon-slide-in {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .coupon-applied-message {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default CouponAppliedMessage;
