// ecommerce-app/src/pages/admin/EditProduct.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { productApi } from "../../api/productApi";

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "", 
    price: "", 
    category: "", 
    description: "", 
    stock: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(""); 
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState("");

  const categories = ["Phone", "Laptop", "Audio", "Camera", "Tablet", "Accessories", "Electronics", "Clothing"];

  // ✅ Fetch existing product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await productApi.getById(id);
        setFormData({
          name: data.name || "",
          price: data.price || "",
          category: data.category || "",
          description: data.description || "",
          stock: data.stock || ""
        });
        setCurrentImage(data.image || "");
      } catch (err) {
        console.error("❌ Failed to load product:", err);
        setError("Could not load product details");
      }
    };
    
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("price", parseFloat(formData.price));
      data.append("category", formData.category);
      data.append("description", formData.description);
      data.append("stock", parseInt(formData.stock) || 0);
      
      // Only append new image if one was selected
      if (imageFile) {
        data.append("imageFile", imageFile);
      }

      await productApi.update(id, data);

      setSuccess("✅ Product updated successfully!");
      setTimeout(() => navigate("/admin/products"), 2000);

    } catch (err) {
      console.error("❌ Update product error:", err);
      setError(err.response?.data?.message || "Failed to update product.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "2rem", color: "#1e293b", fontWeight: "700" }}>
          ✏️ Edit Product
        </h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: "1rem" }}>
          Update product information
        </p>
      </div>
      
      {error && <p style={{ color: "#dc3545", background: "#ffe6e6", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>❌ {error}</p>}
      {success && <p style={{ color: "#28a745", background: "#d4edda", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>{success}</p>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem", background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>Product Name *</label>
          <input name="name" placeholder="Enter product name" value={formData.name} onChange={handleChange} required style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box" }} />
        </div>
        
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>Description</label>
          <textarea name="description" placeholder="Enter product description" value={formData.description} onChange={handleChange} rows="4" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box", resize: "vertical" }} />
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>Price (ETB) *</label>
            <input name="price" type="number" placeholder="0.00" value={formData.price} onChange={handleChange} required min="0" step="0.01" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>Stock</label>
            <input name="stock" type="number" placeholder="0" value={formData.stock} onChange={handleChange} min="0" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>Category</label>
          <select name="category" value={formData.category} onChange={handleChange} style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box" }}>
            <option value="">Select a category</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>Product Image</label>
          
          {/* Show current image if no new one selected */}
          {currentImage && !previewUrl && (
            <div style={{ marginBottom: "0.75rem" }}>
              <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>Current Image:</p>
              <img src={currentImage} alt="Current" style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px", border: "2px solid #e2e8f0" }} />
            </div>
          )}
          
          <input type="file" accept="image/*" onChange={handleFileChange} style={{ padding: "0.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box" }} />
          <small style={{ color: "#64748b", fontSize: "0.85rem", display: "block", marginTop: "0.25rem" }}>
            Leave empty to keep current image
          </small>
          
          {/* Show preview of new image */}
          {previewUrl && (
            <div style={{ marginTop: "0.75rem" }}>
              <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>New Image Preview:</p>
              <img src={previewUrl} alt="Preview" style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px", border: "2px solid #e2e8f0" }} />
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button 
            type="submit" 
            disabled={isLoading || !formData.name || !formData.price} 
            style={{ 
              flex: 1, 
              padding: "1rem", 
              background: isLoading ? "#94a3b8" : "#6366f1", 
              color: "white", 
              border: "none", 
              borderRadius: "8px", 
              cursor: isLoading ? "not-allowed" : "pointer", 
              fontWeight: "600",
              fontSize: "1rem"
            }}
          >
            {isLoading ? "Updating... 🔄" : "💾 Update Product"}
          </button>
          
          <button 
            type="button" 
            onClick={() => navigate("/admin/products")}
            style={{ 
              padding: "1rem 2rem", 
              background: "#64748b", 
              color: "white", 
              border: "none", 
              borderRadius: "8px", 
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "1rem"
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProduct;