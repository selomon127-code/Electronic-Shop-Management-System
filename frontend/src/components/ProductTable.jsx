// src/components/ProductTable.jsx
import React, { useState, useEffect, useMemo } from "react";
import { productApi } from "../api/productApi";
import "./ProductTable.css";

function ProductTable({ onEdit, onDelete }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productApi.getAll();
        setProducts(response.data);
      } catch (err) {
        console.error(err);
        setError("Could not load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [products, searchTerm, categoryFilter, sortConfig]);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))];
    return ["All", ...cats.sort()];
  }, [products]);

  if (loading) return <div className="table-loading">Loading products... 🔄</div>;
  if (error) return <div className="table-error">❌ {error}</div>;
  if (!products.length) return <div className="table-empty">No products found 😕</div>;

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>📦 Product Inventory</h2>
        <p className="table-count">
          Showing {filteredAndSortedProducts.length} of {products.length} products
        </p>
      </div>

      {/* Filters */}
      <div className="table-filters">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>
              ✕
            </button>
          )}
        </div>

        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === "All" ? "All Categories" : cat}
            </option>
          ))}
        </select>

        {(searchTerm || categoryFilter !== "All") && (
          <button
            className="clear-filters"
            onClick={() => { setSearchTerm(""); setCategoryFilter("All"); }}
          >
            🔄 Reset Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th className="col-image">🖼️</th>
              <th className="col-name" onClick={() => requestSort("name")}>
                Name {sortConfig.key === "name" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
              </th>
              <th className="col-category" onClick={() => requestSort("category")}>
                Category {sortConfig.key === "category" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
              </th>
              <th className="col-price" onClick={() => requestSort("price")}>
                Price {sortConfig.key === "price" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
              </th>
              <th className="col-stock">Stock</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedProducts.length ? (
              filteredAndSortedProducts.map(product => (
                <tr key={product._id}>
                  <td className="col-image">
                    <img
                      src={product.image || "/no-image.png"}
                      alt={product.name}
                      className="product-thumb"
                      onError={(e) => { e.target.onerror = null; e.target.src = "/no-image.png"; }}
                    />
                  </td>
                  <td className="col-name">
                    <strong>{product.name}</strong><br/>
                    <small className="text-muted">{product.description}</small>
                  </td>
                  <td className="col-category">{product.category}</td>
                  <td className="col-price">${product.price.toLocaleString()}</td>
                  <td className="col-stock">
                    <span className={`stock-badge ${product.stock < 5 ? 'low' : 'in-stock'}`}>
                      {product.stock} {product.stock < 5 ? "⚠️ Low" : "✅ In Stock"}
                    </span>
                  </td>
                  <td className="col-actions">
                    <button className="btn-edit" onClick={() => onEdit(product)}>✏️</button>
                    <button className="btn-delete" onClick={() => onDelete(product._id)}>🗑️</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-results">
                  😕 No products match your filters.
                  <button className="btn-reset" onClick={() => { setSearchTerm(""); setCategoryFilter("All"); }}>
                    Clear filters
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductTable;
