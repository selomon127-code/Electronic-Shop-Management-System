// ecommerce-app/src/pages/admin/Products.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import {
  AdminStyles, Icon, Kpi, PageHeader, EmptyState, ErrorBanner,
  money, num, NO_IMAGE, useDebounced, useFeedback,
} from "./adminUi";

const LOW_STOCK = 5;

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const debouncedSearch = useDebounced(search);
  const { toast, confirm, ui } = useFeedback();
  const requestId = useRef(0);

  const fetchProducts = useCallback(async () => {
    const id = ++requestId.current;
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await adminApi.getProducts(params);
      if (id !== requestId.current) return;
      setProducts(data.products || []);
      setCategories(data.categories || []);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err.response?.data?.message || err.message || "Failed to load products");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [categoryFilter, debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (product) => {
    const ok = await confirm({
      title: "Delete product?",
      message: `"${product.name}" will be permanently removed from your catalog. This cannot be undone.`,
      confirmLabel: "Delete product",
      danger: true,
    });
    if (!ok) return;

    try {
      await adminApi.deleteProduct(product._id);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
      toast("success", `"${product.name}" deleted`);
    } catch (err) {
      toast("error", err.response?.data?.message || err.message || "Failed to delete product");
    }
  };

  const outOfStock = products.filter((p) => (p.stock || 0) <= 0).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK).length;
  const inStock = products.length - outOfStock;

  const stockBadge = (stock) => {
    if (!(stock > 0)) return { text: "Out of stock", bg: "#fee2e2", fg: "#991b1b" };
    if (stock <= LOW_STOCK) return { text: "Low stock", bg: "#fef3c7", fg: "#92400e" };
    return null;
  };

  return (
    <div className="ad">
      <AdminStyles />

      <PageHeader title="Products" subtitle="Manage your product catalog">
        <button className="ad-btn" onClick={fetchProducts} disabled={loading}>
          <span className={loading ? "ad-spin" : ""}><Icon name="refresh" size={16} /></span>
          Refresh
        </button>
        <Link to="/admin/add-product" className="ad-btn primary">
          <Icon name="plus" size={16} /> Add product
        </Link>
      </PageHeader>

      <div className="ad-kpis">
        <Kpi label="Products" value={num(products.length)} icon="products" color="#4f46e5" bg="#e0e7ff" />
        <Kpi label="In stock" value={num(inStock)} icon="check" color="#059669" bg="#d1fae5" />
        <Kpi label={`Low stock (≤${LOW_STOCK})`} value={num(lowStock)} icon="alert" color="#d97706" bg="#fef3c7" />
        <Kpi label="Out of stock" value={num(outOfStock)} icon="x" color="#dc2626" bg="#fee2e2" />
      </div>

      {/* Filters */}
      <div className="ad-card ad-toolbar">
        <div className="ad-search">
          <Icon name="search" size={16} />
          <input
            className="ad-input"
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
          />
        </div>
        <select
          className="ad-input auto"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchProducts} />}

      {loading && products.length === 0 ? (
        <div className="ad-pgrid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="ad-skel" style={{ height: 340, borderRadius: 14 }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="ad-card">
          <EmptyState
            icon="products"
            title="No products found"
            text={search || categoryFilter ? "Try adjusting your search or filters." : "Get started by adding your first product."}
          >
            <Link to="/admin/add-product" className="ad-btn primary">
              <Icon name="plus" size={16} /> Add your first product
            </Link>
          </EmptyState>
        </div>
      ) : (
        <div className="ad-pgrid" style={{ opacity: loading ? 0.6 : 1, transition: "opacity .15s" }}>
          {products.map((product) => {
            const badge = stockBadge(product.stock);
            return (
              <div key={product._id} className="ad-card ad-pcard">
                <div className="ad-pimg">
                  <img
                    src={product.image || NO_IMAGE}
                    alt={product.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = NO_IMAGE;
                    }}
                  />
                  {badge && (
                    <span className="ad-badge" style={{ background: badge.bg, color: badge.fg }}>
                      <i />{badge.text}
                    </span>
                  )}
                </div>

                <div className="ad-pbody">
                  <div>
                    {product.category && (
                      <span className="ad-badge" style={{ background: "#eef2ff", color: "#4338ca", marginBottom: ".5rem" }}>
                        {product.category}
                      </span>
                    )}
                    <h3 className="ad-pname">{product.name}</h3>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: ".5rem" }}>
                    <span className="ad-pprice">{money(product.price)}</span>
                    <span className="ad-muted ad-small">{num(product.stock)} in stock</span>
                  </div>

                  {product.description && <p className="ad-pdesc">{product.description}</p>}

                  <div className="ad-pfoot">
                    <Link to={`/admin/edit-product/${product._id}`} className="ad-btn sm">
                      <Icon name="edit" size={14} /> Edit
                    </Link>
                    <button className="ad-btn sm" style={{ color: "#dc2626" }} onClick={() => handleDelete(product)}>
                      <Icon name="trash" size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ui}
    </div>
  );
}

export default Products;
