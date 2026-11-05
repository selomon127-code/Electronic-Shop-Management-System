import React, { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";

const emptyCoupon = {
  code: "",
  type: "percentage",
  value: "",
  maxDiscount: "",
  minimumSubtotal: "0",
  startsAt: "",
  expiresAt: "",
  usageLimit: "",
  perUserLimit: "",
  isActive: true,
};

const dateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [formData, setFormData] = useState(emptyCoupon);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await adminApi.getCoupons();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const resetForm = () => {
    setFormData(emptyCoupon);
    setEditingId(null);
    setError("");
    setNotice("");
  };

  const beginEdit = (coupon) => {
    setEditingId(coupon._id);
    setError("");
    setNotice("");
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      maxDiscount: coupon.maxDiscount == null ? "" : String(coupon.maxDiscount),
      minimumSubtotal: String(coupon.minimumSubtotal ?? 0),
      startsAt: dateInputValue(coupon.startsAt),
      expiresAt: dateInputValue(coupon.expiresAt),
      usageLimit: coupon.usageLimit == null ? "" : String(coupon.usageLimit),
      perUserLimit: coupon.perUserLimit == null ? "" : String(coupon.perUserLimit),
      isActive: coupon.isActive,
    });
  };

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const payload = {
      ...formData,
      code: formData.code.trim().toUpperCase(),
      value: Number(formData.value),
      maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
      minimumSubtotal: Number(formData.minimumSubtotal || 0),
      startsAt: formData.startsAt || null,
      expiresAt: formData.expiresAt || null,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
      perUserLimit: formData.perUserLimit ? Number(formData.perUserLimit) : null,
    };

    try {
      if (editingId) {
        await adminApi.updateCoupon(editingId, payload);
        setNotice("Coupon updated.");
      } else {
        await adminApi.createCoupon(payload);
        setNotice("Coupon created.");
      }
      setFormData(emptyCoupon);
      setEditingId(null);
      await loadCoupons();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (coupon) => {
    if (!window.confirm(`Deactivate coupon ${coupon.code}?`)) return;
    setError("");
    setNotice("");
    try {
      await adminApi.deactivateCoupon(coupon._id);
      setNotice(`${coupon.code} has been deactivated.`);
      await loadCoupons();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to deactivate coupon.");
    }
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: ".65rem .75rem",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "var(--bg-card, white)",
    color: "var(--text-main, #0f172a)",
  };
  const fieldStyle = { display: "grid", gap: ".4rem", fontWeight: 600, fontSize: ".9rem" };

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, color: "var(--text-main, #0f172a)" }}>Promo codes</h1>
        <p style={{ color: "var(--text-muted, #64748b)" }}>
          Create, schedule, and manage checkout coupons.
        </p>
      </header>

      {error && <p role="alert" style={{ padding: ".75rem", color: "#991b1b", background: "#fef2f2", borderRadius: "8px" }}>{error}</p>}
      {notice && <p role="status" style={{ padding: ".75rem", color: "#166534", background: "#f0fdf4", borderRadius: "8px" }}>{notice}</p>}

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", padding: "1.5rem", marginBottom: "2rem", background: "var(--bg-card, white)", border: "1px solid var(--border, #e2e8f0)", borderRadius: "12px" }}
      >
        <h2 style={{ gridColumn: "1 / -1", margin: 0 }}>
          {editingId ? `Edit ${formData.code}` : "Create a coupon"}
        </h2>
        <label style={fieldStyle}>
          Code
          <input style={inputStyle} name="code" value={formData.code} onChange={handleChange} minLength={3} maxLength={32} pattern="[A-Za-z0-9_-]+" required />
        </label>
        <label style={fieldStyle}>
          Discount type
          <select style={inputStyle} name="type" value={formData.type} onChange={handleChange}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount (ETB)</option>
          </select>
        </label>
        <label style={fieldStyle}>
          {formData.type === "percentage" ? "Percent off" : "Amount off (ETB)"}
          <input style={inputStyle} name="value" type="number" min="0.01" max={formData.type === "percentage" ? 100 : undefined} step="0.01" value={formData.value} onChange={handleChange} required />
        </label>
        {formData.type === "percentage" && (
          <label style={fieldStyle}>
            Maximum discount (ETB, optional)
            <input style={inputStyle} name="maxDiscount" type="number" min="0.01" step="0.01" value={formData.maxDiscount} onChange={handleChange} />
          </label>
        )}
        <label style={fieldStyle}>
          Minimum subtotal (ETB)
          <input style={inputStyle} name="minimumSubtotal" type="number" min="0" step="0.01" value={formData.minimumSubtotal} onChange={handleChange} />
        </label>
        <label style={fieldStyle}>
          Starts at (optional)
          <input style={inputStyle} name="startsAt" type="datetime-local" value={formData.startsAt} onChange={handleChange} />
        </label>
        <label style={fieldStyle}>
          Expires at (optional)
          <input style={inputStyle} name="expiresAt" type="datetime-local" value={formData.expiresAt} onChange={handleChange} />
        </label>
        <label style={fieldStyle}>
          Total uses (optional)
          <input style={inputStyle} name="usageLimit" type="number" min="1" step="1" value={formData.usageLimit} onChange={handleChange} />
        </label>
        <label style={fieldStyle}>
          Uses per customer (optional)
          <input style={inputStyle} name="perUserLimit" type="number" min="1" step="1" value={formData.perUserLimit} onChange={handleChange} />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
          <input name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} />
          Active
        </label>
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: ".75rem" }}>
          <button type="submit" disabled={saving} style={{ padding: ".7rem 1.1rem", border: 0, borderRadius: "8px", background: "#4f46e5", color: "white", fontWeight: 700 }}>
            {saving ? "Saving..." : editingId ? "Save changes" : "Create coupon"}
          </button>
          {editingId && <button type="button" onClick={resetForm} style={{ padding: ".7rem 1.1rem", border: "1px solid #cbd5e1", borderRadius: "8px", background: "transparent" }}>Cancel</button>}
        </div>
      </form>

      <section>
        <h2>All coupons</h2>
        {loading ? (
          <p>Loading coupons…</p>
        ) : coupons.length === 0 ? (
          <p>No coupons created yet.</p>
        ) : (
          <div style={{ overflowX: "auto", background: "var(--bg-card, white)", border: "1px solid var(--border, #e2e8f0)", borderRadius: "12px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr>{["Code", "Offer", "Minimum", "Usage", "Schedule", "Status", "Actions"].map((heading) => <th key={heading} style={{ padding: ".85rem", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{heading}</th>)}</tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon._id}>
                    <td style={{ padding: ".85rem", fontWeight: 800 }}>{coupon.code}</td>
                    <td style={{ padding: ".85rem" }}>{coupon.type === "percentage" ? `${coupon.value}%${coupon.maxDiscount ? ` (max ${coupon.maxDiscount} ETB)` : ""}` : `${coupon.value} ETB`}</td>
                    <td style={{ padding: ".85rem" }}>{Number(coupon.minimumSubtotal || 0).toLocaleString()} ETB</td>
                    <td style={{ padding: ".85rem" }}>{coupon.usageCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : " / ∞"}{coupon.perUserLimit ? ` · ${coupon.perUserLimit}/customer` : ""}</td>
                    <td style={{ padding: ".85rem", whiteSpace: "nowrap" }}>
                      {coupon.startsAt ? new Date(coupon.startsAt).toLocaleDateString() : "Now"} – {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "No expiry"}
                    </td>
                    <td style={{ padding: ".85rem" }}>{coupon.isActive ? "Active" : "Inactive"}</td>
                    <td style={{ padding: ".85rem", whiteSpace: "nowrap" }}>
                      <button type="button" onClick={() => beginEdit(coupon)} style={{ marginRight: ".5rem" }}>Edit</button>
                      {coupon.isActive && <button type="button" onClick={() => handleDeactivate(coupon)}>Deactivate</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default Coupons;
