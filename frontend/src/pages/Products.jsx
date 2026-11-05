/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API from "../api/axios";
import ProductCard from "../components/ProductCard";

function Products({ addToCart, user }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResults, setAiResults] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setMobile(isMobile);
      if (!isMobile) setFiltersOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const searchQuery = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "all";
  const sortBy = searchParams.get("sort") || "newest";
  const maxPrice = searchParams.get("maxPrice") || "100000";

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let fetched;
      if (searchQuery.trim()) {
        try {
          const { data } = await API.post("/ai/search", { query: searchQuery.trim() });
          fetched = Array.isArray(data.products) ? data.products : [];
        } catch (searchError) {
          console.error("Natural-language catalog search failed; using keyword fallback:", searchError);
          const { data } = await API.get("/products");
          const allProducts = Array.isArray(data) ? data : data.products || [];
          const terms = searchQuery.toLowerCase().split(/[^a-z0-9]+/).filter((term) =>
            term.length > 1 && !["under", "below", "less", "than", "etb", "birr", "for", "with", "the"].includes(term),
          );
          fetched = allProducts.filter((product) => {
            const searchable = `${product.name} ${product.category} ${product.brand || ""} ${product.tags?.join(" ") || ""} ${product.description || ""}`.toLowerCase();
            return terms.some((term) => searchable.includes(term));
          });
        }
      } else {
        const { data } = await API.get("/products");
        fetched = Array.isArray(data) ? data : data.products || [];
      }

      if (categoryFilter !== "all") fetched = fetched.filter((p) => p.category?.toLowerCase() === categoryFilter.toLowerCase());
      fetched = fetched.filter((p) => p.price <= parseInt(maxPrice));

      if (sortBy === "price-asc") fetched.sort((a, b) => a.price - b.price);
      else if (sortBy === "price-desc") fetched.sort((a, b) => b.price - a.price);
      else fetched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setProducts(fetched);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, maxPrice, sortBy]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, searchQuery.trim() ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchProducts, searchQuery]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    value === "all" || value === "" ? newParams.delete(key) : newParams.set(key, value);
    setSearchParams(newParams);
  };

  const searchWithAI = async (event) => {
    event.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiError("");
    try {
      const { data } = await API.post("/ai/search", { query: aiQuery.trim() });
      setAiResults(Array.isArray(data.products) ? data.products : []);
    } catch (error) {
      console.error("AI product search failed:", error);
      setAiError(error.response?.data?.message || t("ai.search_error"));
      setAiResults(null);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>{t("common.loading")} 🔄</div>;

  const categories = [
    ["Smartphones", "smartphones"], ["Laptops", "laptops"], ["Audio", "audio"],
    ["TVs & Displays", "tvs_displays"], ["Wearables", "wearables"], ["Gaming", "gaming"],
    ["Accessories", "accessories"], ["Camera", "camera"], ["Tablet", "tablet"],
    ["Electronics", "electronics"],
  ];

  return (
    <div style={{ background: "var(--bg-main)", minHeight: "100vh", padding: "1.5rem" }}>
      <form
        onSubmit={searchWithAI}
        style={{ maxWidth: "1200px", margin: "0 auto 1.5rem", padding: "1.25rem", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--bg-card)" }}
      >
        <label htmlFor="ai-product-search" style={{ display: "block", marginBottom: ".5rem", fontWeight: 700 }}>
          ✨ {t("ai.search_title")}
        </label>
        <div style={{ display: "flex", gap: ".65rem" }}>
          <input
            id="ai-product-search"
            value={aiQuery}
            onChange={(event) => setAiQuery(event.target.value)}
            maxLength={300}
            placeholder={t("ai.search_placeholder")}
            style={{ flex: 1, minWidth: 0, padding: ".75rem", border: "1px solid var(--border)", borderRadius: "8px", font: "inherit" }}
          />
          <button type="submit" disabled={aiLoading || !aiQuery.trim()} style={{ padding: ".7rem 1rem", border: 0, borderRadius: "8px", color: "white", background: "var(--primary)", fontWeight: 700 }}>
            {aiLoading ? t("ai.searching") : t("products.search")}
          </button>
        </div>
        {aiError && <p role="alert" style={{ color: "var(--danger)", marginBottom: 0 }}>{aiError}</p>}
        {aiResults && (
          <section aria-live="polite" style={{ marginTop: "1.25rem" }}>
            <h2 style={{ fontSize: "1.1rem" }}>{t("ai.search_results")} ({aiResults.length})</h2>
            {aiResults.length ? (
              <div className="catalog-product-grid catalog-ai-results">
                {aiResults.map((product) => <ProductCard key={product._id} product={product} addToCart={addToCart} user={user} />)}
              </div>
            ) : <p>{t("ai.no_search_results")}</p>}
          </section>
        )}
      </form>
      <div className="catalog-layout" style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "240px minmax(0, 1fr)", gap: "1.5rem" }}>
        
        {/* Compact Sidebar */}
        <details
          className="catalog-filter-panel"
          open={!mobile || filtersOpen}
          onToggle={(event) => {
            if (mobile) setFiltersOpen(event.currentTarget.open);
          }}
          style={{ background: "var(--bg-card)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)", height: "fit-content", position: "sticky", top: "80px" }}
        >
          <summary>{t("products.filters")}</summary>
          <div className="catalog-filter-content">
          <h3 className="catalog-filter-heading">{t("products.filters")}</h3>
          
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "0.4rem" }}>{t("products.search")}</label>
            <input type="text" placeholder={t("products.search_placeholder")} value={searchQuery} onChange={(e) => updateFilter("search", e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border)", outline: "none" }} />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "0.4rem" }}>{t("products.category")}</label>
            <select value={categoryFilter} onChange={(e) => updateFilter("category", e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border)", outline: "none", background: "white" }}>
              <option value="all">{t("products.all_categories")}</option>
              {categories.map(([value, key]) => (
                <option key={value} value={value}>{t(`categories.${key}`, { defaultValue: value })}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "0.4rem" }}>{t("products.max_price")}: {Number(maxPrice).toLocaleString(i18n.language)} ETB</label>
            <input type="range" min="0" max="100000" step="500" value={maxPrice} onChange={(e) => updateFilter("maxPrice", e.target.value)} style={{ width: "100%" }} />
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "0.4rem" }}>{t("products.sort_by")}</label>
            <select value={sortBy} onChange={(e) => updateFilter("sort", e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border)", outline: "none", background: "white" }}>
              <option value="newest">{t("products.newest_arrivals")}</option>
              <option value="price-asc">{t("products.price_low_high")}</option>
              <option value="price-desc">{t("products.price_high_low")}</option>
            </select>
          </div>
          </div>
        </details>

        {/* Product Grid */}
        <main className="catalog-results">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700" }}>
              {categoryFilter === "all"
                ? t("products.all_products")
                : t(`categories.${categories.find(([value]) => value.toLowerCase() === categoryFilter.toLowerCase())?.[1]}`, { defaultValue: categoryFilter })}
              <span style={{ fontSize: "0.85rem", fontWeight: "400", color: "var(--text-muted)", marginLeft: "0.5rem" }}>({products.length} {t("products.items")})</span>
            </h2>
          </div>

          {products.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
              <h3>{t("products.no_products_found")}</h3>
              <p style={{ color: "var(--text-muted)" }}>{t("products.adjust_filters")}</p>
            </div>
          ) : (
            <div className="catalog-product-grid">
              {products.map((product) => <ProductCard key={product._id} product={product} addToCart={addToCart} user={user} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Products;