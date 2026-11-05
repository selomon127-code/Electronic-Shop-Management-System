import React from "react";

export function PromoCodeInput({
  value,
  onChange,
  onApply,
  onRemove,
  appliedCoupon,
  loading = false,
  disabled = false,
  placeholder = "Promo code",
  className = "",
}) {
  const isApplied = Boolean(appliedCoupon);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!isApplied && value?.trim() && !loading && !disabled) {
        onApply();
      }
    }
  };

  return (
    <div
      role="group"
      aria-label="Apply promo code"
      className={`promo-code-input-group ${className}`}
    >
      <label htmlFor="coupon-code" className="promo-code-input__sr-label">
        Promo code
      </label>

      <div className="promo-code-input__wrapper">
        <input
          id="coupon-code"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading || isApplied || disabled}
          className="promo-code-input__control"
          autoComplete="off"
          spellCheck="false"
        />

        {value && !isApplied && !loading && (
          <button
            type="button"
            className="promo-code-input__clear"
            onClick={() => onChange("")}
            aria-label="Clear promo code"
          >
            ✕
          </button>
        )}
      </div>

      {isApplied ? (
        <button
          type="button"
          onClick={onRemove}
          className="promo-code-input__btn promo-code-input__btn--remove"
        >
          Remove
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onApply()}
          disabled={loading || !value?.trim() || disabled}
          className="promo-code-input__btn promo-code-input__btn--apply"
        >
          {loading ? "Checking..." : "Apply"}
        </button>
      )}

      <style>{`
        .promo-code-input-group {
          display: flex;
          align-items: stretch;
          gap: 0.5rem;
          margin: 1rem 0;
          width: 100%;
          box-sizing: border-box;
        }
        .promo-code-input__sr-label {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
        .promo-code-input__wrapper {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
          min-width: 0;
        }
        .promo-code-input__control {
          width: 100%;
          min-width: 0;
          padding: 0.65rem 0.75rem;
          padding-right: 2rem;
          border: 1px solid var(--border, #cbd5e1);
          border-radius: 8px;
          font-family: inherit;
          font-size: 0.92rem;
          text-transform: uppercase;
          background: #ffffff;
          color: #0f172a;
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .promo-code-input__control:focus {
          outline: none;
          border-color: var(--primary, #4f46e5);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
        }
        .promo-code-input__control:disabled {
          background: #f1f5f9;
          color: #64748b;
          cursor: not-allowed;
        }
        .promo-code-input__clear {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: #e2e8f0;
          color: #64748b;
          font-size: 0.75rem;
          cursor: pointer;
        }
        .promo-code-input__clear:hover {
          background: #cbd5e1;
          color: #1e293b;
        }
        .promo-code-input__btn {
          padding: 0.65rem 1rem;
          border-radius: 8px;
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 700;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          box-sizing: border-box;
        }
        .promo-code-input__btn--apply {
          border: 0;
          background: var(--primary, #4f46e5);
          color: #ffffff;
        }
        .promo-code-input__btn--apply:hover:not(:disabled) {
          background: #4338ca;
        }
        .promo-code-input__btn--apply:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .promo-code-input__btn--remove {
          border: 1px solid var(--border, #cbd5e1);
          background: var(--bg-card, #ffffff);
          color: #ef4444;
        }
        .promo-code-input__btn--remove:hover {
          background: #fef2f2;
          border-color: #fca5a5;
        }
      `}</style>
    </div>
  );
}

export default PromoCodeInput;
