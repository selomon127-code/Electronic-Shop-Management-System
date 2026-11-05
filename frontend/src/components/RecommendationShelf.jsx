import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import API from "../api/axios";
import ProductCard from "./ProductCard";
import { getRecentlyViewedProducts } from "../utils/recentlyViewed";

function RecommendationShelf({ productIds = [], addToCart, user }) {
  const { t } = useTranslation();
  const [result, setResult] = useState({ key: "", data: null, error: "" });
  const productIdKey = productIds.filter(Boolean).map(String).join(",");

  useEffect(() => {
    let active = true;
    const recentlyViewed = getRecentlyViewedProducts().map((product) => product._id);
    API.get("/ai/recommendations", {
      params: {
        productIds: productIdKey,
        recentlyViewed: recentlyViewed.join(","),
      },
    }).then(({ data }) => {
      if (active) setResult({ key: productIdKey, data, error: "" });
    }).catch((requestError) => {
      console.error("Failed to load product recommendations:", requestError);
      if (active) setResult({ key: productIdKey, data: null, error: t("ai.recommendations_error") });
    });

    return () => {
      active = false;
    };
  }, [productIdKey, t]);

  const recommendations = result.key === productIdKey ? result.data : null;
  const error = result.key === productIdKey ? result.error : "";
  if (error) return <p role="status" className="ai-recommendations-error">{error}</p>;
  if (!recommendations) return null;

  const shelves = [
    ["frequentlyBoughtTogether", t("ai.frequently_bought_together")],
    ["similarProducts", t("ai.similar_products")],
    ["personalized", t("ai.recommended_for_you")],
  ].filter(([key]) => recommendations[key]?.length);

  if (!shelves.length) return null;

  return (
    <section className="ai-recommendations" aria-label={t("ai.recommendations")}>
      <style>{`
        .ai-recommendations { display: grid; gap: 1.5rem; margin: 2rem auto; max-width: 1200px; }
        .ai-recommendations h2 { margin: 0 0 .85rem; color: var(--text-main, #0f172a); font-size: 1.25rem; }
        .ai-recommendations__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); gap: 1rem; }
        .ai-recommendations-error { margin: 1rem auto; max-width: 1200px; color: #b91c1c; }
      `}</style>
      {shelves.map(([key, title]) => (
        <div key={key}>
          <h2>{title}</h2>
          <div className="ai-recommendations__grid">
            {recommendations[key].map((product) => (
              <ProductCard key={`${key}-${product._id}`} product={product} addToCart={addToCart} user={user} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export default RecommendationShelf;
