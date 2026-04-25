// ecommerce-app/src/pages/AdminAddProduct.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { productApi } from "../api/productApi";

function AdminAddProduct() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", price: "", category: "Phone",
    description: "", image: "", stock: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const categories = ["Phone", "Laptop", "Audio", "Camera", "Tablet", "Accessories"];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0
      };

      console.log("🚀 Sending:", productData);

      const response = await productApi.create(productData);
      console.log("✅ Response:", response.data);

      setSuccess("✅ Product added successfully!");
      
      setFormData({
        name: "", price: "", category: "Phone",
        description: "", image: "", stock: ""
      });
      
      setTimeout(() => navigate("/admin/products"), 2000);

    } catch (err) {
      console.error("❌ Add product error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      setError(err.response?.data?.message || "Failed to add product. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>➕ Add New Product</h1>
      
      {error && <p style={{ color: "#dc3545", background: "#ffe6e6", padding: "0.75rem", borderRadius: "6px" }}>❌ {error}</p>}
      {success && <p style={{ color: "#28a745", background: "#d4edda", padding: "0.75rem", borderRadius: "6px" }}>{success}</p>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <input name="name" placeholder="Product Name *" value={formData.name} onChange={handleChange} required style={{ padding: "0.75rem", borderRadius: "6px", border: "1px solid #ddd" }} />
        <input name="price" type="number" placeholder="Price *" value={formData.price} onChange={handleChange} required min="0" step="0.01" style={{ padding: "0.75rem", borderRadius: "6px", border: "1px solid #ddd" }} />
        <select name="category" value={formData.category} onChange={handleChange} style={{ padding: "0.75rem", borderRadius: "6px", border: "1px solid #ddd" }}>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} rows="3" style={{ padding: "0.75rem", borderRadius: "6px", border: "1px solid #ddd" }} />
        <input name="image" placeholder="Image URL (optional)" value={formData.image} onChange={handleChange} style={{ padding: "0.75rem", borderRadius: "6px", border: "1px solid #ddd" }} />
        <input name="stock" type="number" placeholder="Stock" value={formData.stock} onChange={handleChange} min="0" style={{ padding: "0.75rem", borderRadius: "6px", border: "1px solid #ddd" }} />
        <button type="submit" disabled={isLoading || !formData.name || !formData.price} style={{ padding: "1rem", background: isLoading ? "#ccc" : "#28a745", color: "white", border: "none", borderRadius: "8px", cursor: isLoading ? "not-allowed" : "pointer" }}>
          {isLoading ? "Adding... 🔄" : "➕ Add Product"}
        </button>
      </form>
    </div>
  );
}

export default AdminAddProduct;