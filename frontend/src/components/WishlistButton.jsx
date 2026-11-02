import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { wishlistApi } from "../api/adminApi";

function WishlistButton({ product, user, className = "" }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    if (saved || saving) return;

    setSaving(true);
    setError("");
    try {
      await wishlistApi.addToWishlist(product);
      setSaved(true);
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message === "Product already in wishlist") {
        setSaved(true);
      } else {
        setError(err.response?.data?.message || t("wishlist.save_failed"));
        console.error("Failed to add product to wishlist:", err);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={saving || saved}
      aria-label={saved ? `${product.name} ${t("wishlist.saved")}` : `${t("wishlist.add")} ${product.name}`}
      aria-pressed={saved}
      title={error || (saved ? t("wishlist.saved") : t("wishlist.add"))}
    >
      {saving ? "…" : saved ? "♥" : "♡"}
      {error && <span className="wishlist-button-error" role="status">{error}</span>}
    </button>
  );
}

export default WishlistButton;
