// ecommerce-app/src/pages/Products.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { products } from "../data/products";

function Products({ addToCart }) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 🔹 State for filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "All");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // Professional: 12 items per page

  // 🔹 Ethiopian categories with icons
  const categories = [
    "All", "Phone", "Laptop", "Audio", "Camera", "Accessories"
  ];

  // 🔹 Sort options
  const sortOptions = [
    { value: "newest", label: "🆕 Newest" },
    { value: "price-low", label: "💰 Price: Low to High" },
    { value: "price-high", label: "💰 Price: High to Low" },
    { value: "name", label: "🔤 Name: A-Z" },
  ];

  // 🔹 Filter and sort products (memoized for performance)
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description?.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== "All") {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Filter by price range
    result = result.filter(p => 
      p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Filter by stock
    if (inStockOnly) {
      result = result.filter(p => p.stock > 0);
    }

    // Sort products
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
      default:
        // Assuming products have createdAt or use _id as proxy
        result.sort((a, b) => new Date(b._id || 0) - new Date(a._id || 0));
        break;
    }

    return result;
  }, [searchQuery, selectedCategory, sortBy, priceRange, inStockOnly]);

  // 🔹 Pagination logic
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 🔹 Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery);
    if (selectedCategory !== "All") params.set("category", selectedCategory);
    setSearchParams(params);
  }, [searchQuery, selectedCategory, setSearchParams]);

  // 🔹 Reset to page 1 when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy, priceRange, inStockOnly]);

  // 🔹 Handle add to cart with visual feedback
  const handleAddToCart = (product) => {
    addToCart(product);
    const btn = document.getElementById(`btn-${product._id}`);
    if (btn) {
      const original = btn.innerHTML;
      btn.innerHTML = "✅ Added!";
      btn.style.background = "#28a745";
      setTimeout(() => {
        btn.innerHTML = original;
        btn.style.background = "";
      }, 1500);
    }
  };

  // 🔹 Handle price range change
  const handlePriceChange = (e) => {
    const value = parseInt(e.target.value);
    setPriceRange([0, value]);
  };

  // 🔹 Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSortBy("newest");
    setPriceRange([0, 10000]);
    setInStockOnly(false);
    setSearchParams({});
  };

  // 🔹 Active filters count for badge
  const activeFiltersCount = [
    searchQuery.trim(),
    selectedCategory !== "All",
    priceRange[1] < 10000,
    inStockOnly
  ].filter(Boolean).length;

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: "#f8f9fa", minHeight: "100vh" }}>
      
      {/* 🦸 Page Header */}
      <header style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "2rem 2rem 1rem 2rem",
        textAlign: "center"
      }}>
        <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "1.8rem", fontWeight: "800" }}>
          🛍️ All Products
        </h1>
        <p style={{ margin: 0, opacity: 0.95, fontSize: "1rem" }}>
          {filteredAndSortedProducts.length} products found • Prices in ETB
        </p>
        
        {/* Quick Search Bar */}
        <form onSubmit={(e) => e.preventDefault()} style={{
          maxWidth: "500px", margin: "1.5rem auto 0 auto",
          display: "flex", background: "white", borderRadius: "50px", overflow: "hidden"
        }}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, padding: "0.85rem 1.25rem", border: "none", fontSize: "1rem", outline: "none" }}
          />
          <button type="submit" style={{
            padding: "0.85rem 1.5rem", background: "#667eea", color: "white",
            border: "none", cursor: "pointer", fontWeight: "600"
          }}>
            🔍
          </button>
        </form>
      </header>

      {/* 🎛️ Filter & Sort Bar */}
      <section style={{
        background: "white", padding: "1rem 2rem", borderBottom: "1px solid #eee",
        position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          
          {/* Category Filter */}
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem", scrollbarWidth: "none" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "0.5rem 1rem",
                  background: selectedCategory === cat ? "#667eea" : "#f1f3f5",
                  color: selectedCategory === cat ? "white" : "#333",
                  border: "none", borderRadius: "20px", cursor: "pointer",
                  fontWeight: selectedCategory === cat ? "600" : "400",
                  fontSize: "0.85rem", whiteSpace: "nowrap",
                  transition: "all 0.2s"
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort & Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #ddd",
                background: "white", fontSize: "0.9rem", cursor: "pointer"
              }}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Stock Filter */}
            <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.9rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              In Stock Only
            </label>

            {/* Price Range */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
              <span>Max:</span>
              <input
                type="range"
                min="0"
                max="10000"
                step="100"
                value={priceRange[1]}
                onChange={handlePriceChange}
                style={{ width: "100px", cursor: "pointer" }}
              />
              <span style={{ fontWeight: "600", minWidth: "60px" }}>{priceRange[1]} ETB</span>
            </div>

            {/* Active Filters Badge */}
            {activeFiltersCount > 0 && (
              <span style={{
                background: "#ffc107", color: "#333", padding: "0.25rem 0.75rem",
                borderRadius: "20px", fontSize: "0.8rem", fontWeight: "600"
              }}>
                {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""} active
              </span>
            )}

            {/* Clear Filters Button */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                style={{
                  padding: "0.5rem 1rem", background: "#6c757d", color: "white",
                  border: "none", borderRadius: "8px", cursor: "pointer",
                  fontSize: "0.9rem", fontWeight: "500"
                }}
              >
                🔄 Clear All
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 📦 Products Grid */}
      <main style={{ padding: "2rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Results Count */}
        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <p style={{ margin: 0, color: "#666", fontSize: "0.95rem" }}>
            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredAndSortedProducts.length)} of {filteredAndSortedProducts.length} products
          </p>
          <Link to="/" style={{ color: "#667eea", textDecoration: "none", fontWeight: "600", fontSize: "0.9rem" }}>
            ← Back to Home
          </Link>
        </div>

        {/* Product Grid */}
        {paginatedProducts.length > 0 ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1.5rem"
          }}>
            {paginatedProducts.map((product) => (
              <ProductCard 
                key={product._id} 
                product={product} 
                addToCart={handleAddToCart} 
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#666" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
            <h3 style={{ margin: "0 0 0.5rem 0", color: "#333" }}>No products found</h3>
            <p style={{ margin: "0 0 1.5rem 0" }}>Try adjusting your filters or search terms.</p>
            <button
              onClick={clearFilters}
              style={{
                padding: "0.75rem 1.5rem", background: "#667eea", color: "white",
                border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600"
              }}
            >
              🔄 Reset All Filters
            </button>
          </div>
        )}

        {/* 🔢 Pagination */}
        {totalPages > 1 && (
          <div style={{ marginTop: "3rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "0.5rem 1rem", background: currentPage === 1 ? "#ddd" : "#667eea",
                color: "white", border: "none", borderRadius: "8px", cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontWeight: "600"
              }}
            >
              ← Prev
            </button>
            
            {/* Page Numbers */}
            <div style={{ display: "flex", gap: "0.25rem" }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    background: currentPage === page ? "#667eea" : "white",
                    color: currentPage === page ? "white" : "#333",
                    border: `2px solid ${currentPage === page ? "#667eea" : "#ddd"}`,
                    borderRadius: "6px", cursor: "pointer", fontWeight: currentPage === page ? "600" : "400",
                    minWidth: "40px"
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "0.5rem 1rem", background: currentPage === totalPages ? "#ddd" : "#667eea",
                color: "white", border: "none", borderRadius: "8px", cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontWeight: "600"
              }}
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {/* 🇪🇹 Ethiopian Footer CTA */}
      <footer style={{
        padding: "2.5rem 2rem", background: "#2c3e50", color: "white",
        textAlign: "center", marginTop: "3rem"
      }}>
        <h3 style={{ marginBottom: "1rem", fontSize: "1.3rem" }}>🇪🇹 Shopping from Ethiopia?</h3>
        <p style={{ marginBottom: "1.5rem", opacity: 0.9, maxWidth: "500px", margin: "0 auto 1.5rem auto" }}>
          Nationwide delivery • Telebirr/Chapa/COD • Local support
        </p>
        <Link
          to="/"
          style={{
            display: "inline-block", padding: "0.7rem 1.75rem",
            background: "#28a745", color: "white", textDecoration: "none",
            borderRadius: "8px", fontWeight: "600"
          }}
        >
          ← Back to Home
        </Link>
      </footer>
    </div>
  );
}

export default Products;