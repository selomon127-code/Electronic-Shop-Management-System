// ecommerce-app/src/pages/admin/AddProduct.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  "Camera",
  "Phone",
  "Laptop",
  "Tablet",
  "Electronics",
];

const LANGUAGES = [
  { field: "description", aiKey: "en", labelKey: "english", placeholderKey: "english_description_placeholder" },
  { field: "descriptionAm", aiKey: "am", labelKey: "amharic", placeholder: "የምርቱ መግለጫ በአማርኛ..." },
  { field: "descriptionOm", aiKey: "om", labelKey: "afaan_oromoo", placeholder: "Ibsa oomishaa Afaan Oromoon..." },
  { field: "descriptionTi", aiKey: "ti", labelKey: "tigrinya", placeholder: "ገለጻ ምርቲ ብትግርኛ..." },
];

const MAX_IMAGE_MB = 5;

const INITIAL_FORM = {
  name: "",
  description: "",
  descriptionAm: "",
  descriptionOm: "",
  descriptionTi: "",
  price: "",
  costPrice: "",
  discount: "0",
  category: "",
  brand: "",
  tags: "",
  stock: "",
};

function AddProduct() {
  const { t } = useTranslation();
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
      toast("error", t("admin.valid_image_required"));
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast("error", t("admin.image_too_large", { size: MAX_IMAGE_MB }));
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
      toast("error", t("admin.enter_product_category"));
      return;
    }

    const hasExistingText = LANGUAGES.some((l) => formData[l.field].trim());
    if (hasExistingText) {
      const ok = await confirm({
        title: t("admin.replace_descriptions_title"),
        message: t("admin.replace_descriptions_message"),
        confirmLabel: t("admin.replace"),
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

      if (!data?.success) throw new Error(t("admin.ai_unexpected_response"));

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
          ? t("admin.ai_fallback_generated")
          : t("admin.ai_all_languages_generated"),
        6000
      );
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast("error", error.response?.data?.message || t("admin.failed_generate_descriptions"));
    } finally {
      setAiLoading(false);
    }
  };

  // ---------- submit ----------
  const validate = () => {
    if (Number(formData.price) <= 0) return t("admin.price_positive");
    if (formData.costPrice !== "" && (!Number.isFinite(Number(formData.costPrice)) || Number(formData.costPrice) < 0)) {
      return t("admin.cost_price_invalid", { defaultValue: "Cost price must be zero or greater." });
    }
    const discount = Number(formData.discount);
    if (!Number.isInteger(discount) || discount < 0 || discount > 100) {
      return t("admin.discount_range", { defaultValue: "Discount must be a whole number from 0 to 100." });
    }
    if (!Number.isInteger(Number(formData.stock)) || Number(formData.stock) < 0) {
      return t("admin.stock_whole_number");
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
        brand: formData.brand.trim(),
        tags: formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20),
        price: Number(formData.price),
        costPrice: formData.costPrice === "" ? null : Number(formData.costPrice),
        discount: Number(formData.discount),
        stock: Number(formData.stock),
        image: imageBase64,
      };

      await API.post("/admin/products", payload);

      toast("success", t("admin.product_added_redirecting"));
      redirectTimer.current = setTimeout(() => navigate("/admin/products"), 1200);
    } catch (error) {
      console.error("Add product error:", error);
      toast("error", error.response?.data?.message || error.message || t("admin.failed_add_product"));
      setLoading(false);
    }
  };

  const busy = loading || aiLoading;

  return (
    <div className="ad" style={{ maxWidth: 1100 }}>
      <AdminStyles />

      <PageHeader title={t("admin.add_product")} subtitle={t("admin.create_catalog_item")}>
        <button type="button" className="ad-btn" onClick={() => navigate("/admin/products")}>
          <Icon name="arrowLeft" size={16} /> {t("admin.back_to_products")}
        </button>
      </PageHeader>

      <form onSubmit={handleSubmit}>
        <div className="ad-form-grid">
          {/* ---------- Left column ---------- */}
          <div className="ad-stack">
            <div className="ad-card ad-panel">
              <h3 className="ad-panel-title">{t("admin.basic_information")}</h3>

              <div className="ad-field">
                <label htmlFor="name" className="ad-label">{t("admin.product_name")} *</label>
                <input id="name" className="ad-input" type="text" name="name" required
                  value={formData.name} onChange={handleChange} placeholder={t("admin.product_name_example")} />
              </div>

              <div className="ad-grid3" style={{ marginBottom: 0 }}>
                <div className="ad-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="category" className="ad-label">{t("admin.category")} *</label>
                  <select id="category" className="ad-input" name="category" required
                    value={formData.category} onChange={handleChange}>
                    <option value="">{t("admin.select_category")}</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{t(`admin.category_${c.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`, { defaultValue: c })}</option>)}
                  </select>
                </div>
                <div className="ad-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="price" className="ad-label">{t("admin.price_etb")} *</label>
                  <input id="price" className="ad-input" type="number" name="price" required min="1" step="any"
                    value={formData.price} onChange={handleChange} placeholder={t("admin.price_example")} />
                </div>
                <div className="ad-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="stock" className="ad-label">{t("admin.stock")} *</label>
                  <input id="stock" className="ad-input" type="number" name="stock" required min="0" step="1"
                    value={formData.stock} onChange={handleChange} placeholder={t("admin.stock_example")} />
                </div>
              </div>

              <div className="ad-grid3" style={{ marginTop: "1rem", marginBottom: 0 }}>
                <div className="ad-field" style={{ marginBottom: 0 }}>
                  <label htmlFor="brand" className="ad-label">{t("admin.brand", { defaultValue: "Brand" })}</label>
                  <input id="brand" className="ad-input" type="text" name="brand" maxLength={80}
                    value={formData.brand} onChange={handleChange} />
                </div>
                <div className="ad-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
                  <label htmlFor="tags" className="ad-label">{t("admin.search_tags", { defaultValue: "Search tags (comma-separated)" })}</label>
                  <input id="tags" className="ad-input" type="text" name="tags" maxLength={800}
                    value={formData.tags} onChange={handleChange} placeholder="programming, lightweight, USB-C" />
                </div>
              </div>

              <div className="ad-field" style={{ maxWidth: 260, marginTop: "1rem", marginBottom: 0 }}>
                <label htmlFor="costPrice" className="ad-label">
                  {t("admin.cost_price", { defaultValue: "Cost price (ETB)" })}
                </label>
                <input id="costPrice" className="ad-input" type="number" name="costPrice" min="0" step="0.01"
                  value={formData.costPrice} onChange={handleChange} placeholder="0.00" />
                <small className="ad-muted">
                  {t("admin.cost_price_help", { defaultValue: "Used for profit and inventory reports." })}
                </small>
              </div>

              <div className="ad-field" style={{ maxWidth: 220, marginTop: "1rem", marginBottom: 0 }}>
                <label htmlFor="discount" className="ad-label">{t("admin.discount_percent", { defaultValue: "Discount (%)" })}</label>
                <input id="discount" className="ad-input" type="number" name="discount" min="0" max="100" step="1"
                  value={formData.discount} onChange={handleChange} />
              </div>
            </div>

            <div className="ad-card ad-panel">
              <h3 className="ad-panel-title">{t("admin.descriptions")}</h3>

              <div className="ad-ai">
                <div>
                  <b>{t("admin.ai_description_generator")}</b>
                  <p>{t("admin.ai_description_help")}</p>
                </div>
                <button type="button" className="ad-btn ai" onClick={handleAIGenerate} disabled={busy}>
                  {aiLoading ? (
                    <><span className="ad-spin"><Icon name="refresh" size={16} /></span> {t("admin.generating")}</>
                  ) : (
                    <><Icon name="sparkles" size={16} /> {t("admin.generate_with_ai")}</>
                  )}
                </button>
              </div>

              {LANGUAGES.map(({ field, labelKey, placeholder, placeholderKey }, i) => (
                <div key={field} className="ad-field" style={i === LANGUAGES.length - 1 ? { marginBottom: 0 } : undefined}>
                  <label htmlFor={field} className="ad-label">{t(`admin.${labelKey}`)} *</label>
                  <textarea id={field} name={field} className="ad-input" required rows={3}
                    value={formData[field]} onChange={handleChange} placeholder={placeholderKey ? t(`admin.${placeholderKey}`) : placeholder} />
                </div>
              ))}
            </div>
          </div>

          {/* ---------- Right column ---------- */}
          <div className="ad-stack ad-sticky">
            <div className="ad-card ad-panel">
              <h3 className="ad-panel-title">
                {t("admin.product_image")} <span className="ad-muted ad-small" style={{ fontWeight: 400 }}>{t("admin.max_image_size", { size: MAX_IMAGE_MB })}</span>
              </h3>

              {imageBase64 ? (
                <div className="ad-preview">
                  <img src={imageBase64} alt={t("admin.product_preview")} />
                  <button type="button" className="ad-btn sm" onClick={() => setImageBase64(null)}>
                    <Icon name="trash" size={14} /> {t("admin.remove")}
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
                    <span><b>{t("admin.click_to_upload")}</b> {t("admin.or_drag_drop")}</span>
                    <span className="ad-small">{t("admin.image_formats")}</span>
                  </label>
                  <input id="image" className="ad-vh" type="file" accept="image/*" onChange={handleImageChange} />
                </>
              )}
            </div>

            <div className="ad-card ad-panel">
              <button type="submit" className="ad-btn primary block" disabled={busy}>
                {loading ? t("admin.adding_product") : (<><Icon name="check" size={16} /> {t("admin.add_product")}</>)}
              </button>
              <button type="button" className="ad-btn block" style={{ marginTop: ".6rem" }}
                onClick={() => navigate("/admin/products")} disabled={loading}>
                {t("admin.cancel")}
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
