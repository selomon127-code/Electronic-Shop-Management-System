import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { adminApi } from "../../api/adminApi";

// Helper to safely parse numbers, fallback to 0 if empty/invalid
const safeNumber = (val, fallback = 0) => {
  if (val === "" || val === null || val === undefined) return fallback;
  const num = Number(val);
  return isNaN(num) ? fallback : num;
};

const readImageAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read selected image."));
    reader.readAsDataURL(file);
  });

function EditProduct() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  
  // ✅ 1. Initialize with correct types (Numbers for numeric fields)
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    costPrice: "",
    discount: 0, // ✅ Number, not string
    category: "",
    brand: "",
    tags: "",
    description: "",
    stock: 0     // ✅ Number, not string
  });

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState("");

  const categories = [
    "Smartphones", "Laptops", "TVs & Displays", "Wearables",
    "Gaming", "Audio", "Camera", "Tablet", "Accessories", "Electronics"
  ];

  // ✅ 2. Fetch existing product data with SAFE parsing
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await adminApi.getProduct(id);
        setFormData({
          name: data.name || "",
          price: data.price !== undefined && data.price !== null ? data.price : "",
          costPrice: data.costPrice !== undefined && data.costPrice !== null ? Number(data.costPrice) : "",
          // ✅ CRITICAL FIX: Explicitly parse as number, fallback to 0
          discount: data.discount !== undefined && data.discount !== null ? Number(data.discount) : 0,
          category: data.category || "",
          brand: data.brand || "",
          tags: Array.isArray(data.tags) ? data.tags.join(", ") : "",
          description: data.description || "",
          stock: data.stock !== undefined && data.stock !== null ? Number(data.stock) : 0
        });
        setCurrentImage(data.image || "");
      } catch (err) {
        console.error("❌ Failed to load product:", err);
        setError(t("admin.failed_load_product_details") || "Failed to load product details.");
      }
    };

    if (id) fetchProduct();
  }, [id, t]);

  // ✅ 3. Smart Change Handler for Numeric Inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "price" || name === "costPrice" || name === "discount" || name === "stock") {
      setFormData((prev) => ({
        ...prev,
        // Allow empty string while typing (so user can backspace), otherwise convert to Number
        [name]: value === "" ? "" : Number(value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // ✅ 4. Bulletproof Submission Payload
  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalDiscount = safeNumber(formData.discount, 0);
    if (!Number.isInteger(finalDiscount) || finalDiscount < 0 || finalDiscount > 100) {
      setError(t("admin.discount_range") || "Discount must be a whole number from 0 to 100.");
      return;
    }
    if (formData.costPrice !== "" && (!Number.isFinite(Number(formData.costPrice)) || Number(formData.costPrice) < 0)) {
      setError(t("admin.cost_price_invalid", { defaultValue: "Cost price must be zero or greater." }));
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // ✅ CRITICAL FIX: Explicitly cast to Number with fallbacks so backend NEVER receives undefined/null
      const productData = {
        name: formData.name.trim(),
        price: safeNumber(formData.price, 0),
        costPrice: formData.costPrice === "" ? null : safeNumber(formData.costPrice, 0),
        discount: finalDiscount,
        category: formData.category,
        brand: formData.brand.trim(),
        tags: formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20),
        description: formData.description.trim(),
        stock: safeNumber(formData.stock, 0),
      };

      if (imageFile) {
        productData.image = await readImageAsDataUrl(imageFile);
      }

      await adminApi.updateProduct(id, productData);
      const { data } = await adminApi.getProduct(id);
      const savedProduct = data.product || data;
      const savedDiscount =
        savedProduct.discount === undefined || savedProduct.discount === null
          ? Number.NaN
          : Number(savedProduct.discount);
      if (savedDiscount !== finalDiscount) {
        const actualDiscount = Number.isFinite(savedDiscount)
          ? `the API returned ${savedDiscount}%`
          : "the API response has no discount field";
        throw new Error(
          `Requested ${finalDiscount}%, but ${actualDiscount}. Stop any old backend using port 5000, then start the backend from this project's backend folder.`,
        );
      }

      setSuccess(`✅ ${t("admin.product_updated") || "Product updated successfully!"} (${finalDiscount}% discount saved)`);
      setTimeout(() => navigate("/admin/products"), 1500);

    } catch (err) {
      console.error("❌ Update product error:", err);
      setError(err.response?.data?.message || err.message || t("admin.failed_update_product") || "Failed to update product.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate live preview of discounted price
  const priceNum = safeNumber(formData.price, 0);
  const discountNum = safeNumber(formData.discount, 0);
  const discountedPrice = priceNum - (priceNum * discountNum) / 100;

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "2rem", color: "#1e293b", fontWeight: "700" }}>
          ✏️ {t("admin.edit_product") || "Edit Product"}
        </h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: "1rem" }}>
          {t("admin.update_product_information") || "Update product information and save changes."}
        </p>
      </div>
      
      {error && <p style={{ color: "#dc3545", background: "#ffe6e6", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>❌ {error}</p>}
      {success && <p style={{ color: "#28a745", background: "#d4edda", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>{success}</p>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem", background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>{t("admin.product_name") || "Product Name"} *</label>
          <input name="name" placeholder={t("admin.enter_product_name") || "Enter product name"} value={formData.name} onChange={handleChange} required style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box", outline: "none" }} onFocus={(e) => e.currentTarget.style.borderColor = "#6366f1"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
        </div>
        
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>{t("admin.description") || "Description"}</label>
          <textarea name="description" placeholder={t("admin.enter_product_description") || "Enter product description"} value={formData.description} onChange={handleChange} rows="4" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box", resize: "vertical", outline: "none", fontFamily: "inherit" }} onFocus={(e) => e.currentTarget.style.borderColor = "#6366f1"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>{t("admin.price_etb") || "Price (ETB)"} *</label>
            <input name="price" type="number" placeholder="0.00" value={formData.price} onChange={handleChange} required min="0" step="0.01" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box", outline: "none" }} onFocus={(e) => e.currentTarget.style.borderColor = "#6366f1"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>{t("admin.stock") || "Stock Quantity"}</label>
            <input name="stock" type="number" placeholder="0" value={formData.stock} onChange={handleChange} min="0" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box", outline: "none" }} onFocus={(e) => e.currentTarget.style.borderColor = "#6366f1"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
          </div>
        </div>

        <div>
          <label htmlFor="costPrice" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>
            {t("admin.cost_price", { defaultValue: "Cost price (ETB)" })}
          </label>
          <input id="costPrice" name="costPrice" type="number" min="0" step="0.01" value={formData.costPrice}
            onChange={handleChange} style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box", outline: "none" }} />
          <small style={{ color: "#64748b" }}>
            {t("admin.cost_price_help", { defaultValue: "Used for profit and inventory reports." })}
          </small>
        </div>

        <div>
          <label htmlFor="discount" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>
            {t("admin.discount_percent") || "Discount (%)"}
          </label>
          <input id="discount" name="discount" type="number" value={formData.discount} onChange={handleChange} min="0" max="100" step="1" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box", outline: "none" }} onFocus={(e) => e.currentTarget.style.borderColor = "#6366f1"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"} />
          <p style={{ margin: "0.5rem 0 0", color: "#475569", fontSize: "0.9rem" }}>
            {t("admin.sale_price") || "Sale price:"} <strong style={{ color: "#10b981" }}>{discountedPrice.toLocaleString()} ETB</strong>
            {discountNum > 0 && (
              <> <span style={{ textDecoration: "line-through", color: "#94a3b8", marginLeft: "0.5rem" }}>{priceNum.toLocaleString()} ETB</span> <span style={{ color: "#ef4444", fontWeight: "600" }}>(-{discountNum}%)</span></>
            )}
          </p>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>{t("admin.category") || "Category"}</label>
          <select name="category" value={formData.category} onChange={handleChange} style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box", background: "white", outline: "none" }} onFocus={(e) => e.currentTarget.style.borderColor = "#6366f1"} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
            <option value="">{t("admin.select_category") || "Select a category"}</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
          <div>
            <label htmlFor="brand" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>
              {t("admin.brand", { defaultValue: "Brand" })}
            </label>
            <input id="brand" name="brand" value={formData.brand} onChange={handleChange} maxLength={80}
              style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box" }} />
          </div>
          <div>
            <label htmlFor="tags" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>
              {t("admin.search_tags", { defaultValue: "Search tags (comma-separated)" })}
            </label>
            <input id="tags" name="tags" value={formData.tags} onChange={handleChange} maxLength={800}
              placeholder="programming, lightweight, USB-C"
              style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box" }} />
          </div>
        </div>
        
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#475569" }}>{t("admin.product_image") || "Product Image"}</label>
          
          {currentImage && !previewUrl && (
            <div style={{ marginBottom: "0.75rem" }}>
              <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>{t("admin.current_image") || "Current Image"}</p>
              <img src={currentImage} alt="Current" style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px", border: "2px solid #e2e8f0" }} />
            </div>
          )}
          
          <input type="file" accept="image/*" onChange={handleFileChange} style={{ padding: "0.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box" }} />
          <small style={{ color: "#64748b", fontSize: "0.85rem", display: "block", marginTop: "0.25rem" }}>
            {t("admin.keep_current_image_help") || "Leave empty to keep the current image."}
          </small>
          
          {previewUrl && (
            <div style={{ marginTop: "0.75rem" }}>
              <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>{t("admin.new_image_preview") || "New Image Preview"}</p>
              <img src={previewUrl} alt="Preview" style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px", border: "2px solid #6366f1" }} />
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button 
            type="submit" 
            disabled={isLoading || !formData.name || formData.price === ""}
            style={{ 
              flex: 1, 
              padding: "1rem", 
              background: isLoading ? "#94a3b8" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "white", 
              border: "none", 
              borderRadius: "8px", 
              cursor: isLoading ? "not-allowed" : "pointer", 
              fontWeight: "700",
              fontSize: "1rem",
              boxShadow: isLoading ? "none" : "0 4px 15px rgba(99, 102, 241, 0.3)",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {isLoading ? (t("admin.updating") || "Updating...") : `💾 ${t("admin.update_product") || "Save Changes"}`}
          </button>
          
          <button 
            type="button" 
            onClick={() => navigate("/admin/products")}
            style={{ 
              padding: "1rem 2rem", 
              background: "#f1f5f9",
              color: "#475569",
              border: "1px solid #e2e8f0",
              borderRadius: "8px", 
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "1rem",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
          >
            {t("admin.cancel") || "Cancel"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProduct;