import React, { useState, useEffect, useRef } from "react";

export function describeCoupon(coupon) {
  if (!coupon) return "";
  const discount =
    coupon.type === "percentage"
      ? `${coupon.value}% off`
      : `${Number(coupon.value).toLocaleString()} ETB off`;
  const minimum =
    Number(coupon.minimumSubtotal) > 0
      ? ` on orders over ${Number(coupon.minimumSubtotal).toLocaleString()} ETB`
      : "";
  return `${discount}${minimum}`;
}

export async function copyCouponCode(code) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(code);
    return;
  }

  const input = document.createElement("textarea");
  input.value = code;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error("Clipboard access is unavailable.");
}

export function CouponCard({
  coupon,
  onApply,
  isApplied = false,
  compact = false,
  showApplyButton = false,
  showCopy = true,
  className = "",
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async (e) => {
    e?.stopPropagation();
    try {
      await copyCouponCode(coupon.code);
      setCopied(true);
      setCopyError(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch {
      setCopyError(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setCopyError(false);
      }, 2500);
    }
  };

  const discountBadge =
    coupon.type === "percentage"
      ? `${coupon.value}% OFF`
      : `${Number(coupon.value).toLocaleString()} ETB OFF`;

  return (
    <article
      className={`coupon-card ${compact ? "coupon-card--compact" : ""} ${
        isApplied ? "coupon-card--applied" : ""
      } ${className}`}
      data-code={coupon.code}
    >
      <div className="coupon-card__badge-strip">
        <span className="coupon-card__badge">{discountBadge}</span>
        {coupon.maxDiscount && (
          <span className="coupon-card__sub-badge">
            Up to {Number(coupon.maxDiscount).toLocaleString()} ETB
          </span>
        )}
      </div>

      <div className="coupon-card__body">
        <p className="coupon-card__desc">{describeCoupon(coupon)}</p>
        {coupon.description && coupon.description !== describeCoupon(coupon) && (
          <p className="coupon-card__details">{coupon.description}</p>
        )}
        <div className="coupon-card__code-wrap">
          <code className="coupon-card__code">{coupon.code}</code>
        </div>
      </div>

      <div className="coupon-card__actions">
        {showCopy && (
          <button
            type="button"
            className={`coupon-card__btn-copy ${
              copied ? "coupon-card__btn-copy--success" : ""
            } ${copyError ? "coupon-card__btn-copy--error" : ""}`}
            onClick={handleCopy}
          >
            {copied ? "Copied!" : copyError ? "Copy failed" : "Copy code"}
          </button>
        )}

        {showApplyButton && (
          <button
            type="button"
            className={`coupon-card__btn-apply ${
              isApplied ? "coupon-card__btn-apply--applied" : ""
            }`}
            onClick={() => onApply && onApply(coupon.code)}
            disabled={isApplied}
          >
            {isApplied ? "Applied ✓" : "Apply"}
          </button>
        )}
      </div>

      <style>{`
        .coupon-card {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1rem;
          background: #ffffff;
          border: 1px solid #e0e7ff;
          border-left: 4px solid #4f46e5;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          min-width: 240px;
          box-sizing: border-box;
        }
        .coupon-card:hover {
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.12);
          border-color: #c7d2fe;
          transform: translateY(-2px);
        }
        .coupon-card--applied {
          border-left-color: #10b981;
          background: #f0fdf4;
          border-color: #a7f3d0;
        }
        .coupon-card--compact {
          padding: 0.75rem 0.85rem;
          min-width: 0;
        }
        .coupon-card__badge-strip {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 0.4rem;
        }
        .coupon-card__badge {
          display: inline-flex;
          align-items: center;
          padding: 0.2rem 0.55rem;
          border-radius: 6px;
          background: #eef2ff;
          color: #4338ca;
          font-weight: 800;
          font-size: 0.75rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .coupon-card--applied .coupon-card__badge {
          background: #d1fae5;
          color: #065f46;
        }
        .coupon-card__sub-badge {
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .coupon-card__body {
          margin-bottom: 0.75rem;
        }
        .coupon-card__desc {
          margin: 0 0 0.35rem;
          color: #1e293b;
          font-size: 0.9rem;
          font-weight: 600;
          line-height: 1.35;
        }
        .coupon-card__details {
          margin: 0 0 0.35rem;
          color: #64748b;
          font-size: 0.8rem;
          line-height: 1.3;
        }
        .coupon-card__code-wrap {
          display: inline-block;
          margin-top: 0.25rem;
        }
        .coupon-card__code {
          display: inline-block;
          padding: 0.25rem 0.55rem;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 6px;
          color: #4338ca;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.05em;
        }
        .coupon-card__actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: auto;
          flex-wrap: wrap;
        }
        .coupon-card__btn-copy,
        .coupon-card__btn-apply {
          min-height: 38px;
          padding: 0.45rem 0.85rem;
          border: 0;
          border-radius: 8px;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 0.15s ease, transform 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }
        .coupon-card__btn-copy {
          background: #4f46e5;
          color: #ffffff;
        }
        .coupon-card__btn-copy:hover {
          background: #4338ca;
        }
        .coupon-card__btn-copy:focus-visible,
        .coupon-card__btn-apply:focus-visible {
          outline: 2px solid #4f46e5;
          outline-offset: 2px;
        }
        .coupon-card__btn-copy--success {
          background: #10b981;
          color: #ffffff;
        }
        .coupon-card__btn-copy--success:hover {
          background: #059669;
        }
        .coupon-card__btn-copy--error {
          background: #ef4444;
          color: #ffffff;
        }
        .coupon-card__btn-apply {
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #cbd5e1;
        }
        .coupon-card__btn-apply:hover:not(:disabled) {
          background: #e2e8f0;
          color: #0f172a;
        }
        .coupon-card__btn-apply--applied {
          background: #d1fae5;
          color: #065f46;
          border-color: #6ee7b7;
          cursor: default;
        }
        @media (prefers-reduced-motion: reduce) {
          .coupon-card,
          .coupon-card__btn-copy,
          .coupon-card__btn-apply {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </article>
  );
}

export default CouponCard;
