// ecommerce-app/src/pages/admin/EditProduct.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { productApi } from "../../api/productApi";

function EditProduct() {
  const { t } = useTranslation();
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

  const categories = [
    "Smartphones",
    "Laptops",
    "TVs & Displays",
    "Wearables",
    "Gaming",
    "Audio",
    "Camera",
    "Tablet",
    "Accessories",
    "Electronics",
    
  ];

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
        setError(t("admin.failed_load_product_details"));
      }
    };
    
    if (id) {
      fetchProduct();
    }
  }, [id, t]);

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

      setSuccess(`✅ ${t("admin.product_updated")}`);
      setTimeout(() => navigate("/admin/products"), 2000);

    } catch (err) {
      console.error("❌ Update product error:", err);
      setError(err.response?.data?.message || t("admin.failed_update_product"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "2rem", color: "#1e293b", fontWeight: "700" }}>
          ✏️ {t("admin.edit_product")}
        </h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: "1rem" }}>
          {t("admin.update_product_information")}
        </p>
      </div>
      
      {error && <p style={{ color: "#dc3545", background: "#ffe6e6", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>❌ {error}</p>}
      {success && <p style={{ color: "#28a745", background: "#d4edda", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>{success}</p>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem", background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>{t("admin.product_name")} *</label>
          <input name="name" placeholder={t("admin.enter_product_name")} value={formData.name} onChange={handleChange} required style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box" }} />
        </div>
        
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>{t("admin.description")}</label>
          <textarea name="description" placeholder={t("admin.enter_product_description")} value={formData.description} onChange={handleChange} rows="4" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box", resize: "vertical" }} />
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>{t("admin.price_etb")} *</label>
            <input name="price" type="number" placeholder="0.00" value={formData.price} onChange={handleChange} required min="0" step="0.01" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>{t("admin.stock")}</label>
            <input name="stock" type="number" placeholder="0" value={formData.stock} onChange={handleChange} min="0" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>{t("admin.category")}</label>
          <select name="category" value={formData.category} onChange={handleChange} style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box" }}>
            <option value="">{t("admin.select_category")}</option>
            {categories.map(cat => <option key={cat} value={cat}>{t(`admin.category_${cat.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`, { defaultValue: cat })}</option>)}
          </select>
        </div>
        
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>{t("admin.product_image")}</label>
          
          {/* Show current image if no new one selected */}
          {currentImage && !previewUrl && (
            <div style={{ marginBottom: "0.75rem" }}>
              <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>{t("admin.current_image")}</p>
              <img src={currentImage} alt={t("admin.current_image")} style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px", border: "2px solid #e2e8f0" }} />
            </div>
          )}
          
          <input type="file" accept="image/*" onChange={handleFileChange} style={{ padding: "0.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box" }} />
          <small style={{ color: "#64748b", fontSize: "0.85rem", display: "block", marginTop: "0.25rem" }}>
            {t("admin.keep_current_image_help")}
          </small>
          
          {/* Show preview of new image */}
          {previewUrl && (
            <div style={{ marginTop: "0.75rem" }}>
              <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>{t("admin.new_image_preview")}</p>
              <img src={previewUrl} alt={t("admin.new_image_preview")} style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px", border: "2px solid #e2e8f0" }} />
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
            {isLoading ? t("admin.updating") : `💾 ${t("admin.update_product")}`}
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
            {t("admin.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProduct;