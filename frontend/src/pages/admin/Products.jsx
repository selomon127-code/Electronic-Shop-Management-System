// ecommerce-app/src/pages/admin/Products.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { adminApi } from "../../api/adminApi";
import {
  AdminStyles, Icon, Kpi, PageHeader, EmptyState, ErrorBanner,
  money, num, getNoImage, useDebounced, useFeedback,
} from "./adminUi";

const LOW_STOCK = 5;

function Products() {
  const { t } = useTranslation();
  const noImage = getNoImage(t("admin.no_image"));
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
      setError(err.response?.data?.message || err.message || t("admin.failed_load_products"));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [categoryFilter, debouncedSearch, t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (product) => {
    const ok = await confirm({
      title: t("admin.delete_product_title"),
      message: t("admin.delete_product_message", { name: product.name }),
      confirmLabel: t("admin.delete_product"),
      danger: true,
    });
    if (!ok) return;

    try {
      await adminApi.deleteProduct(product._id);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
      toast("success", t("admin.product_deleted", { name: product.name }));
    } catch (err) {
      toast("error", err.response?.data?.message || err.message || t("admin.failed_delete_product"));
    }
  };

  const outOfStock = products.filter((p) => (p.stock || 0) <= 0).length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK).length;
  const inStock = products.length - outOfStock;

  const stockBadge = (stock) => {
    if (!(stock > 0)) return { text: t("admin.out_of_stock"), bg: "#fee2e2", fg: "#991b1b" };
    if (stock <= LOW_STOCK) return { text: t("admin.low_stock"), bg: "#fef3c7", fg: "#92400e" };
    return null;
  };

  return (
    <div className="ad">
      <AdminStyles />

      <PageHeader title={t("nav.products")} subtitle={t("admin.manage_product_catalog")}>
        <button className="ad-btn" onClick={fetchProducts} disabled={loading}>
          <span className={loading ? "ad-spin" : ""}><Icon name="refresh" size={16} /></span>
          {t("admin.refresh")}
        </button>
        <Link to="/admin/add-product" className="ad-btn primary">
          <Icon name="plus" size={16} /> {t("admin.add_product")}
        </Link>
      </PageHeader>

      <div className="ad-kpis">
        <Kpi label={t("nav.products")} value={num(products.length)} icon="products" color="#4f46e5" bg="#e0e7ff" />
        <Kpi label={t("admin.in_stock")} value={num(inStock)} icon="check" color="#059669" bg="#d1fae5" />
        <Kpi label={t("admin.low_stock_count", { count: LOW_STOCK })} value={num(lowStock)} icon="alert" color="#d97706" bg="#fef3c7" />
        <Kpi label={t("admin.out_of_stock")} value={num(outOfStock)} icon="x" color="#dc2626" bg="#fee2e2" />
      </div>

      {/* Filters */}
      <div className="ad-card ad-toolbar">
        <div className="ad-search">
          <Icon name="search" size={16} />
          <input
            className="ad-input"
            type="text"
            placeholder={t("admin.search_products")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t("admin.search_products")}
          />
        </div>
        <select
          className="ad-input auto"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label={t("admin.filter_category")}
        >
          <option value="">{t("admin.all_categories")}</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{t(`admin.category_${cat.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`, { defaultValue: cat })}</option>
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
            title={t("admin.no_products_found")}
            text={search || categoryFilter ? t("admin.adjust_search_filters") : t("admin.add_first_product_prompt")}
          >
            <Link to="/admin/add-product" className="ad-btn primary">
              <Icon name="plus" size={16} /> {t("admin.add_first_product")}
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
                    src={product.image || noImage}
                    alt={product.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = noImage;
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
                        {t(`admin.category_${product.category.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`, { defaultValue: product.category })}
                      </span>
                    )}
                    <h3 className="ad-pname">{product.name}</h3>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: ".5rem" }}>
                    <span className="ad-pprice">{money(product.price)}</span>
                    <span className="ad-muted ad-small">{t("admin.stock_count", { count: num(product.stock) })}</span>
                  </div>

                  {product.description && <p className="ad-pdesc">{product.description}</p>}

                  <div className="ad-pfoot">
                    <Link to={`/admin/edit-product/${product._id}`} className="ad-btn sm">
                      <Icon name="edit" size={14} /> {t("admin.edit")}
                    </Link>
                    <button className="ad-btn sm" style={{ color: "#dc2626" }} onClick={() => handleDelete(product)}>
                      <Icon name="trash" size={14} /> {t("admin.delete")}
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
