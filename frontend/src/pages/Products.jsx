/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
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

  const searchQuery = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "all";
  const sortBy = searchParams.get("sort") || "newest";
  const maxPrice = searchParams.get("maxPrice") || "100000";

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, categoryFilter, sortBy, maxPrice]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/products");
      let fetched = Array.isArray(data) ? data : data.products || [];

      if (searchQuery) fetched = fetched.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
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
  };

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    value === "all" || value === "" ? newParams.delete(key) : newParams.set(key, value);
    setSearchParams(newParams);
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
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "240px 1fr", gap: "1.5rem" }}>
        
        {/* Compact Sidebar */}
        <aside style={{ background: "var(--bg-card)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)", height: "fit-content", position: "sticky", top: "80px" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: "700" }}>{t("products.filters")}</h3>
          
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
        </aside>

        {/* Product Grid */}
        <main>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              {products.map((product) => <ProductCard key={product._id} product={product} addToCart={addToCart} user={user} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Products;