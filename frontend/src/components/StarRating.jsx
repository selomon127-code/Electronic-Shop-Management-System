// ecommerce-app/src/components/StarRating.jsx
import React from "react";

function StarRating({ rating, setRating, interactive = false, size = "1.5rem" }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div style={{ display: "flex", gap: "0.2rem" }}>
      {stars.map((star) => (
        <span
          key={star}
          onClick={(e) => {
            e.preventDefault(); // Prevent any parent form/link interference
            e.stopPropagation();
            if (interactive && setRating) {
              console.log("⭐ Star clicked:", star); // Debug log
              setRating(star);
            }
          }}
          style={{
            color: star <= rating ? "#fbbf24" : "#d1d5db",
            fontSize: size,
            cursor: interactive ? "pointer" : "default",
            transition: "all 0.2s ease",
            transform: interactive && star <= rating ? "scale(1.2)" : "scale(1)",
            userSelect: "none" // Prevents text selection when clicking fast
          }}
          onMouseEnter={(e) => {
            if (interactive) e.currentTarget.style.transform = "scale(1.3)";
          }}
          onMouseLeave={(e) => {
            if (interactive) e.currentTarget.style.transform = star <= rating ? "scale(1.2)" : "scale(1)";
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default StarRating;