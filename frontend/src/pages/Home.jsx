// ecommerce-app/src/pages/Home.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { products } from "../data/products";

function Home({ addToCart }) {
  const navigate = useNavigate();
  
  // State for filtering
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  // 🔹 Ethiopian categories with icons & slugs
  const ethiopianCategories = [
    { id: "All", name: "🏠 All", slug: "all" },
    { id: "Phone", name: "📱 Phones", slug: "phones" },
    { id: "Laptop", name: "💻 Laptops", slug: "laptops" },
    { id: "Audio", name: "🎧 Audio", slug: "audio" },
    { id: "Camera", name: "📷 Cameras", slug: "cameras" },
    { id: "Accessories", name: "⌚ Accessories", slug: "accessories" },
  ];

  // 🔹 Trust badges for Ethiopian customers
  const trustBadges = [
    { icon: "🚚", title: "Fast Delivery", desc: "Addis & nationwide" },
    { icon: "💳", title: "Secure Payment", desc: "Telebirr, Chapa, COD" },
    { icon: "🔄", title: "Easy Returns", desc: "7-day return policy" },
    { icon: "📞", title: "24/7 Support", desc: "Local customer service" },
  ];

  // 🔹 Filter products by search and category
  const filtered = products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  // 🔹 Get unique categories for dropdown
  const categories = ["All", ...new Set(products.map((p) => p.category))];

  // 🔹 Handle category button click
  const handleCategoryClick = (slug) => {
    if (slug === "all") {
      setCategory("All");
    } else {
      // Map slug to actual category name in your data
      const categoryMap = {
        phones: "Phone",
        laptops: "Laptop", 
        audio: "Audio",
        cameras: "Camera",
        accessories: "Accessories"
      };
      setCategory(categoryMap[slug] || "All");
    }
    // Scroll to product grid smoothly
    document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth" });
  };

  // 🔹 Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search)}`);
    }
  };

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

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* 🦸 HERO SECTION with Search */}
      <section style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "3rem 2rem",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
        
      }}>
        {/* Decorative element */}
        <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "200px", height: "00px", borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        
        <div style={{ position: "relative", zIndex: 1, maxWidth: "700px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "3rem", fontWeight: "800", marginBottom: "2rem", textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
           SOLOMON YENENEH
          </h1>
          <h1 style={{ fontSize: "2rem", fontWeight: "800", marginBottom: "1rem", textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
            🇪🇹 Ethiopia's Favorite Online Store
          </h1>
          <p style={{ fontSize: "1.1rem", marginBottom: "2rem", opacity: 0.95 }}>
            Shop phones, laptops & accessories with Telebirr, Chapa, or Cash on Delivery.
          </p>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} style={{
            display: "flex", maxWidth: "450px", margin: "0 auto",
            background: "white", borderRadius: "50px", overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
          }}>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, padding: "0.85rem 1.25rem", border: "none", fontSize: "1rem", outline: "none" }}
            />
            <button type="submit" style={{
              padding: "0.85rem 1.5rem", background: "#667eea", color: "white",
              border: "none", cursor: "pointer", fontWeight: "600"
            }}>
              🔍
            </button>
          </form>
        </div>
      </section>

      {/* 🏷️ QUICK CATEGORY BAR */}
      <section style={{ padding: "1.5rem 2rem", background: "#f8f9fa", borderBottom: "1px solid #eee" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", paddingBottom: "0.5rem", scrollbarWidth: "none" }}>
            {ethiopianCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                style={{
                  padding: "0.6rem 1.2rem",
                  background: category === cat.id ? "#667eea" : "white",
                  color: category === cat.id ? "white" : "#333",
                  border: `2px solid ${category === cat.id ? "#667eea" : "#ddd"}`,
                  borderRadius: "25px",
                  cursor: "pointer",
                  fontWeight: category === cat.id ? "600" : "400",
                  fontSize: "0.9rem",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => { if (category !== cat.id) { e.currentTarget.style.borderColor = "#667eea"; }}}
                onMouseOut={(e) => { if (category !== cat.id) { e.currentTarget.style.borderColor = "#ddd"; }}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 🔥 FEATURED PRODUCTS (First 4 from filtered) */}
      {filtered.length > 0 && (
        <section style={{ padding: "3rem 2rem", background: "white" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0, color: "#333", fontSize: "1.5rem" }}>
                {category === "All" ? "🔥 Featured Deals" : `📱 ${category} Products`}
              </h2>
              <Link to="/products" style={{ color: "#667eea", textDecoration: "none", fontWeight: "600" }}>
                View All →
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
              {filtered.slice(0, 4).map((p) => (
                <div key={p._id} style={{ position: "relative" }}>
                  <ProductCard product={p} addToCart={handleAddToCart} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 🛡️ TRUST BADGES */}
      <section style={{ padding: "2rem 2rem", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1.5rem", textAlign: "center" }}>
            {trustBadges.map((badge, idx) => (
              <div key={idx} style={{ padding: "1rem" }}>
                <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{badge.icon}</div>
                <h3 style={{ margin: "0 0 0.25rem 0", fontWeight: "600", fontSize: "1rem" }}>{badge.title}</h3>
                <p style={{ margin: 0, opacity: 0.9, fontSize: "0.85rem" }}>{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== YOUR EXISTING FILTER + PRODUCT GRID ===== */}
      <section style={{ padding: "2rem 2rem", background: "#f8f9fa" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <h2 style={{ margin: 0, color: "#333", fontSize: "1.5rem" }}>🏠 All Products</h2>
            
            {/* Filter Controls */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid #ddd", minWidth: "200px" }}
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid #ddd", background: "white" }}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
                ))}
              </select>
              {(search || category !== "All") && (
                <button
                  onClick={() => { setSearch(""); setCategory("All"); }}
                  style={{ padding: "0.6rem 1rem", background: "#6c757d", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
                >
                  🔄 Reset
                </button>
              )}
            </div>
          </div>

          {/* ===== Product Grid ===== */}
          <div id="product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.5rem" }}>
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <ProductCard key={p._id} product={p} addToCart={handleAddToCart} />
              ))
            ) : (
              <p style={{ gridColumn: "1/-1", textAlign: "center", color: "#666", padding: "3rem" }}>
                No products found 😕 Try adjusting your search or filters.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 🇪🇹 FOOTER CTA - "Start Shopping Now" goes to /products */}
      <section style={{ padding: "3rem 2rem", background: "#2c3e50", color: "white", textAlign: "center" }}>
        <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>🇪🇹 Ready to Shop?</h2>
        <p style={{ marginBottom: "1.5rem", opacity: 0.9, maxWidth: "600px", margin: "0 auto 1.5rem auto" }}>
          Browse our full catalog with nationwide delivery, local payments, and Amharic support.
        </p>
        <Link
          to="/products"  // ✅ This navigates to your Products page showing ALL products
          style={{
            display: "inline-block", padding: "0.75rem 2rem",
            background: "#28a745", color: "white", textDecoration: "none",
            borderRadius: "8px", fontWeight: "600", transition: "background 0.2s"
          }}
          onMouseOver={(e) => e.target.style.background = "#218838"}
          onMouseOut={(e) => e.target.style.background = "#28a745"}
        >
          Start Shopping Now →
        </Link>
      </section>
    </div>
  );
}

export default Home;