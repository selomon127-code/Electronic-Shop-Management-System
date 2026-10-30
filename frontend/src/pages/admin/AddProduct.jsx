// ecommerce-app/src/pages/admin/AddProduct.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { AdminStyles, Icon, PageHeader, useFeedback } from "./adminUi";

const CATEGORIES = [
  "Smartphones",
  "Laptops",
  "Audio",
  "TVs & Displays",
  "Wearables",
  "Gaming",
  "Accessories",
];

const LANGUAGES = [
  { field: "description", aiKey: "en", label: "English", placeholder: "Product description in English..." },
  { field: "descriptionAm", aiKey: "am", label: "Amharic / አማርኛ", placeholder: "የምርቱ መግለጫ በአማርኛ..." },
  { field: "descriptionOm", aiKey: "om", label: "Afaan Oromoo", placeholder: "Ibsa oomishaa Afaan Oromoon..." },
  { field: "descriptionTi", aiKey: "ti", label: "Tigrinya / ትግርኛ", placeholder: "ገለጻ ምርቲ ብትግርኛ..." },
];

const MAX_IMAGE_MB = 5;

const INITIAL_FORM = {
  name: "",
  description: "",
  descriptionAm: "",
  descriptionOm: "",
  descriptionTi: "",
  price: "",
  category: "",
  stock: "",
};

function AddProduct() {
  const navigate = useNavigate();
  const redirectTimer = useRef(null);
  const { toast, confirm, ui } = useFeedback();

  const [formData, setFormData] = useState(INITIAL_FORM);

  // Image is sent as a Base64 string inside the JSON payload (no FormData/multer needed)
  const [imageBase64, setImageBase64] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ---------- image ----------
  const processImage = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("error", "Please choose a valid image file.");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast("error", `Image is too large. Maximum size is ${MAX_IMAGE_MB} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImageBase64(reader.result);
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    processImage(e.target.files?.[0]);
    e.target.value = ""; // allow re-selecting the same file
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processImage(e.dataTransfer.files?.[0]);
  };

  // ---------- AI generation ----------
  const handleAIGenerate = async () => {
    if (!formData.name.trim() || !formData.category) {
      toast("error", "Enter the product name and category before generating.");
      return;
    }

    const hasExistingText = LANGUAGES.some((l) => formData[l.field].trim());
    if (hasExistingText) {
      const ok = await confirm({
        title: "Replace existing descriptions?",
        message: "Generating will overwrite the descriptions you have already written.",
        confirmLabel: "Replace",
      });
      if (!ok) return;
    }

    setAiLoading(true);

    try {
      const specs = [
        `Category: ${formData.category}`,
        formData.price && `Price: ${formData.price} ETB`,
        formData.stock && `Stock: ${formData.stock}`,
      ]
        .filter(Boolean)
        .join(", ");

      const { data } = await API.post("/ai/generate-product-description", {
        name: formData.name.trim(),
        category: formData.category,
        specs,
      });

      if (!data?.success) throw new Error("Unexpected response from AI service");

      setFormData((prev) => {
        const next = { ...prev };
        LANGUAGES.forEach(({ field, aiKey }) => {
          next[field] = data.descriptions?.[aiKey] || prev[field];
        });
        return next;
      });

      toast(
        "success",
        data.fallbackUsed
          ? "Descriptions generated locally (AI network unavailable). Please review before saving."
          : "Descriptions generated in all 4 languages. Please review them before saving.",
        6000
      );
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast("error", error.response?.data?.message || "Failed to generate descriptions. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  // ---------- submit ----------
  const validate = () => {
    if (Number(formData.price) <= 0) return "Price must be greater than 0.";
    if (!Number.isInteger(Number(formData.stock)) || Number(formData.stock) < 0) {
      return "Stock must be a whole number (0 or more).";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const problem = validate();
    if (problem) {
      toast("error", problem);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        descriptionAm: formData.descriptionAm.trim(),
        descriptionOm: formData.descriptionOm.trim(),
        descriptionTi: formData.descriptionTi.trim(),
        category: formData.category,
        price: Number(formData.price),
        stock: Number(formData.stock),
        image: imageBase64,
      };

      await API.post("/admin/products", payload);

      toast("success", "Product added successfully! Redirecting…");
      redirectTimer.current = setTimeout(() => navigate("/admin/products"), 1200);
    } catch (error) {
      console.error("Add product error:", error);
      toast("error", error.response?.data?.message || error.message || "Failed to add product.");
      setLoading(false);
    }
  };

  const busy = loading || aiLoading;

  return (
    <div className="ad" style={{ maxWidth: 1100 }}>
      <AdminStyles />

      <PageHeader title="Add product" subtitle="Create a new item in your catalog">
        <button type="button" className="ad-btn" onClick={() => navigate("/admin/products")}>
          <Icon name="arrowLeft" size={16} /> Back to products
        </button>
      </PageHeader>

      <form onSubmit={handleSubmit}>
        <div className="ad-form-grid">
          {/* ---------- Left column ---------- */}
          <div className="ad-stack">
            <div className="ad-card ad-panel">
              <h3 className="ad-panel-title">Basic information</h3>

              <div className="ad-field">
                <label htmlFor="name" className="ad-label">Product name *</label>
                <input id="name" className="ad-input" type="text" name="name" required
                  value={formData.name} onChange={handleChange} placeholder="e.g., iPhone 15 Pro Max" />
              </div>

              <div className="ad-grid3" style={{ marginBottom: 0 }}>
                <div className="ad-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="category" className="ad-label">Category *</label>
                  <select id="category" className="ad-input" name="category" required
                    value={formData.category} onChange={handleChange}>
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="ad-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="price" className="ad-label">Price (ETB) *</label>
                  <input id="price" className="ad-input" type="number" name="price" required min="1" step="any"
                    value={formData.price} onChange={handleChange} placeholder="e.g., 85000" />
                </div>
                <div className="ad-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="stock" className="ad-label">Stock *</label>
                  <input id="stock" className="ad-input" type="number" name="stock" required min="0" step="1"
                    value={formData.stock} onChange={handleChange} placeholder="e.g., 50" />
                </div>
              </div>
            </div>

            <div className="ad-card ad-panel">
              <h3 className="ad-panel-title">Descriptions</h3>

              <div className="ad-ai">
                <div>
                  <b>AI description generator</b>
                  <p>Fills in English, Amharic, Afaan Oromoo and Tigrinya from the name and category.</p>
                </div>
                <button type="button" className="ad-btn ai" onClick={handleAIGenerate} disabled={busy}>
                  {aiLoading ? (
                    <><span className="ad-spin"><Icon name="refresh" size={16} /></span> Generating…</>
                  ) : (
                    <><Icon name="sparkles" size={16} /> Generate with AI</>
                  )}
                </button>
              </div>

              {LANGUAGES.map(({ field, label, placeholder }, i) => (
                <div key={field} className="ad-field" style={i === LANGUAGES.length - 1 ? { marginBottom: 0 } : undefined}>
                  <label htmlFor={field} className="ad-label">{label} *</label>
                  <textarea id={field} name={field} className="ad-input" required rows={3}
                    value={formData[field]} onChange={handleChange} placeholder={placeholder} />
                </div>
              ))}
            </div>
          </div>

          {/* ---------- Right column ---------- */}
          <div className="ad-stack ad-sticky">
            <div className="ad-card ad-panel">
              <h3 className="ad-panel-title">
                Product image <span className="ad-muted ad-small" style={{ fontWeight: 400 }}>max {MAX_IMAGE_MB} MB</span>
              </h3>

              {imageBase64 ? (
                <div className="ad-preview">
                  <img src={imageBase64} alt="Product preview" />
                  <button type="button" className="ad-btn sm" onClick={() => setImageBase64(null)}>
                    <Icon name="trash" size={14} /> Remove
                  </button>
                </div>
              ) : (
                <>
                  <label
                    htmlFor="image"
                    className={`ad-drop ${dragOver ? "over" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <Icon name="upload" size={26} />
                    <span><b>Click to upload</b> or drag and drop</span>
                    <span className="ad-small">PNG, JPG or WebP</span>
                  </label>
                  <input id="image" className="ad-vh" type="file" accept="image/*" onChange={handleImageChange} />
                </>
              )}
            </div>

            <div className="ad-card ad-panel">
              <button type="submit" className="ad-btn primary block" disabled={busy}>
                {loading ? "Adding product…" : (<><Icon name="check" size={16} /> Add product</>)}
              </button>
              <button type="button" className="ad-btn block" style={{ marginTop: ".6rem" }}
                onClick={() => navigate("/admin/products")} disabled={loading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>

      {ui}
    </div>
  );
}

export default AddProduct;
