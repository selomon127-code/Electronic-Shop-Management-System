// ecommerce-app/src/components/StarRating.jsx
import React from "react";

function StarRating({ rating, setRating, interactive = false, size = "1.5rem" }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div style={{ display: "flex", gap: "0.2rem" }}>
      {stars.map((star) =>
        interactive ? (
          <button
            key={star}
            type="button"
            aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
            aria-pressed={star === rating}
            onClick={() => setRating?.(star)}
            style={{
              color: star <= rating ? "#fbbf24" : "#d1d5db",
              fontSize: size,
              cursor: "pointer",
              transition: "all 0.2s ease",
              transform: star <= rating ? "scale(1.2)" : "scale(1)",
              userSelect: "none",
              border: 0,
              background: "transparent",
              padding: 0,
            }}
          >
            ★
          </button>
        ) : (
          <span
            key={star}
            aria-hidden="true"
            style={{
              color: star <= rating ? "#fbbf24" : "#d1d5db",
              fontSize: size,
              userSelect: "none",
            }}
          >
            ★
          </span>
        ),
      )}
    </div>
  );
}

export default StarRating;