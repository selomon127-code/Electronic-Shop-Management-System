// ecommerce-app/src/pages/Products.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import API from "../api/axios";
import ProductCard from "../components/ProductCard";
import "../styles/products.css";

const CATEGORY_KEYS = [
  { key: "all", i18n: "products.all", fallback: "All" },
  { key: "audio", i18n: "categories.audio", fallback: "Audio" },
  { key: "camera", i18n: "categories.camera", fallback: "Cameras" },
  { key: "phone", i18n: "categories.smartphones", fallback: "Smartphones" },
  { key: "laptop", i18n: "categories.laptops", fallback: "Laptops" },
  { key: "tablet", i18n: "categories.tablets", fallback: "Tablets" },
  { key: "accessories", i18n: "categories.accessories", fallback: "Accessories" },
  { key: "electronics", i18n: "categories.electronics", fallback: "Electronics" },
];

const SORT_PARAMS = {
  newest: "createdAt_desc",
  "price-low": "price_asc",
  "price-high": "price_desc",
};

const SKELETON_COUNT = 8;

// Small debounce hook so we don't filter on every keystroke
function useDebounced(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function ProductSkeleton() {
  return (
    <div className="pr-skeleton" aria-hidden="true">
      <div className="pr-skeleton-img" />
      <div className="pr-skeleton-body">
        <div className="pr-skeleton-line" />
        <div className="pr-skeleton-line pr-skeleton-line--short" />
      </div>
    </div>
  );
}

function Products({ addToCart }) {
  const { t } = useTranslation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounced(searchQuery);

  const categories = useMemo(
    () =>
      CATEGORY_KEYS.map(({ key, i18n, fallback }) => ({
        key,
        label: t(i18n, { defaultValue: fallback }),
      })),
    [t],
  );

  // Fetch whenever category / sort changes (or the user presses "Retry").
  // AbortController prevents an older, slower response from overwriting a
  // newer one when the user switches filters quickly.
  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const params = { sort: SORT_PARAMS[sortBy] };
        if (selectedCategory !== "all") params.category = selectedCategory;

        const { data } = await API.get("/products", {
          params,
          signal: controller.signal,
        });

        setProducts(Array.isArray(data) ? data : data?.products || []);
      } catch (err) {
        if (err.code === "ERR_CANCELED" || err.name === "CanceledError") return;
        console.error("Failed to fetch products:", err);
        setError(
          err.response?.data?.message ||
            t("products.load_error", {
              defaultValue: "We couldn't load the products. Please try again.",
            }),
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchProducts();
    return () => controller.abort();
  }, [selectedCategory, sortBy, reloadKey, t]);

  // Client-side search over the fetched list
  const visibleProducts = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return products;

    return products.filter((p) =>
      [p.name, p.title, p.brand, p.category, p.description]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    );
  }, [products, debouncedSearch]);

  const resetFilters = useCallback(() => {
    setSelectedCategory("all");
    setSearchQuery("");
    setSortBy("newest");
  }, []);

  const hasActiveFilters =
    selectedCategory !== "all" || searchQuery.trim() !== "";

  const isInitialLoad = loading && products.length === 0;

  return (
    <div className="pr-page">
      {/* Hero */}
      <header className="pr-hero">
        <div className="pr-badge">
          🛍️{" "}
          {t("products.our_collection", { defaultValue: "Our Collection" })}
        </div>
        <h1 className="pr-title">
          {t("products.all_products", { defaultValue: "All Products" })}
        </h1>
        <p className="pr-meta" aria-live="polite">
          {loading && products.length === 0
            ? t("common.loading", { defaultValue: "Loading..." })
            : `${visibleProducts.length} ${t("products.products_found", {
                defaultValue: "products found",
              })} • ${t("products.prices_in_etb", {
                defaultValue: "Prices in ETB",
              })}`}
        </p>
      </header>

      {/* Toolbar */}
      <section
        className="pr-toolbar"
        aria-label={t("products.filters", { defaultValue: "Filters" })}
      >
        <div className="pr-toolbar-inner">
          <div className="pr-toolbar-top">
            <div className="pr-search">
              <span className="pr-search-icon" aria-hidden="true">
                🔍
              </span>
              <input
                type="search"
                className="pr-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("products.search_placeholder", {
                  defaultValue: "Search products...",
                })}
                aria-label={t("products.search_placeholder", {
                  defaultValue: "Search products...",
                })}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="pr-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label={t("products.clear_search", {
                    defaultValue: "Clear search",
                  })}
                >
                  ×
                </button>
              )}
            </div>

            <select
              className="pr-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label={t("products.sort_by", { defaultValue: "Sort by" })}
            >
              <option value="newest">
                {t("products.newest", { defaultValue: "Newest" })}
              </option>
              <option value="price-low">
                {t("products.price_low_high", {
                  defaultValue: "Price: Low to High",
                })}
              </option>
              <option value="price-high">
                {t("products.price_high_low", {
                  defaultValue: "Price: High to Low",
                })}
              </option>
            </select>
          </div>

          <div
            className="pr-chips"
            role="group"
            aria-label={t("products.categories", { defaultValue: "Categories" })}
          >
            {categories.map((cat) => {
              const active = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  className={`pr-chip${active ? " pr-chip--active" : ""}`}
                  aria-pressed={active}
                  onClick={() => setSelectedCategory(cat.key)}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="pr-content">
        <div className="pr-content-inner">
          {error ? (
            <div className="pr-state" role="alert">
              <div className="pr-state-icon">⚠️</div>
              <h3>
                {t("products.error_title", {
                  defaultValue: "Something went wrong",
                })}
              </h3>
              <p>{error}</p>
              <button
                type="button"
                className="pr-btn"
                onClick={() => setReloadKey((k) => k + 1)}
              >
                {t("common.retry", { defaultValue: "Try again" })}
              </button>
            </div>
          ) : isInitialLoad ? (
            <div className="pr-grid" aria-busy="true">
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="pr-state">
              <div className="pr-state-icon">📦</div>
              <h3>
                {t("products.no_products_found", {
                  defaultValue: "No products found",
                })}
              </h3>
              <p>
                {t("products.try_different_category", {
                  defaultValue:
                    "Try a different category or search term.",
                })}
              </p>
              {hasActiveFilters && (
                <button type="button" className="pr-btn" onClick={resetFilters}>
                  {t("products.clear_filters", {
                    defaultValue: "Clear filters",
                  })}
                </button>
              )}
            </div>
          ) : (
            <div
              className={`pr-grid${loading ? " pr-grid--busy" : ""}`}
              aria-busy={loading}
            >
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  addToCart={addToCart}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Products;
