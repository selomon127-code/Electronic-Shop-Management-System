// ecommerce-app/src/pages/AdminProducts.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { productApi } from "../api/productApi";

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await productApi.getAll();
      setProducts(data);
    } catch (err) {
      console.error("❌ Fetch products error:", err);
      setError("Could not load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await productApi.delete(id);
      setProducts(products.filter(p => p._id !== id));
      alert("✅ Product deleted successfully");
    } catch (err) {
      console.error("❌ Delete error:", err);
      alert("❌ Failed to delete product");
    }
  };

  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading products... 🔄</div>;
  if (error) return <div style={{ padding: "2rem", color: "#dc3545" }}>❌ {error}</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "2rem",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <h1 style={{ margin: 0, color: "#333" }}>🛍️ Admin: Product Management</h1>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button 
            onClick={() => navigate("/admin/add-product")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            ➕ Add New Product
          </button>
          <button 
            onClick={() => navigate("/admin/orders")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            📦 Manage Orders
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "1.5rem"
      }}>
        {products.map((product) => (
          <div 
            key={product._id}
            style={{
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {/* Product Image */}
            <img 
              src={product.image || "https://via.placeholder.com/300x200?text=No+Image"} 
              alt={product.name}
              style={{
                width: "100%",
                height: "180px",
                objectFit: "cover",
                background: "#f8f9fa"
              }}
            />
            
            {/* Product Info */}
            <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column" }}>
              <h3 style={{ margin: "0 0 0.5rem 0", color: "#333", fontSize: "1.1rem" }}>
                {product.name}
              </h3>
              <p style={{ margin: "0 0 0.5rem 0", color: "#666", fontSize: "0.9rem" }}>
                {product.category}
              </p>
              <p style={{ margin: "0 0 1rem 0", color: "#666", fontSize: "0.85rem", flex: 1 }}>
                {product.description?.slice(0, 80)}{product.description?.length > 80 ? "..." : ""}
              </p>
              
              {/* Price & Stock */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <span style={{ fontSize: "1.25rem", fontWeight: "700", color: "#28a745" }}>
                  ${product.price?.toFixed(2)}
                </span>
                <span style={{ fontSize: "0.85rem", color: "#666" }}>
                  Stock: {product.stock || 0}
                </span>
              </div>
              
              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => navigate(`/admin/edit-product/${product._id}`, { state: { product } })}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "0.9rem"
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(product._id)}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "0.9rem"
                  }}
                >
                  ❌ Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminProducts;