import React from "react";

export function CouponErrorMessage({ message, onDismiss, className = "" }) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`coupon-error-message ${className}`}
    >
      <div className="coupon-error-message__content">
        <span className="coupon-error-message__icon" aria-hidden="true">⚠️</span>
        <p className="coupon-error-message__text">{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="coupon-error-message__dismiss"
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}

      <style>{`
        .coupon-error-message {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding: 0.65rem 0.85rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          margin-bottom: 0.75rem;
          color: #991b1b;
          font-size: 0.86rem;
          box-sizing: border-box;
          animation: coupon-error-fade 0.2s ease-out;
        }
        .coupon-error-message__content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 0;
        }
        .coupon-error-message__icon {
          font-size: 1rem;
          flex-shrink: 0;
        }
        .coupon-error-message__text {
          margin: 0;
          line-height: 1.35;
          word-break: break-word;
        }
        .coupon-error-message__dismiss {
          border: 0;
          background: transparent;
          color: #991b1b;
          cursor: pointer;
          font-size: 0.85rem;
          padding: 0.2rem;
          line-height: 1;
        }
        @keyframes coupon-error-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default CouponErrorMessage;
