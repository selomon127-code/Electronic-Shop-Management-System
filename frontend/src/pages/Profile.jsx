// ecommerce-app/src/pages/Profile.jsx
import React, { useState, useEffect, useRef } from "react";
import { profileApi } from "../api/adminApi";
import { useSearchParams } from "react-router-dom";

const PLACEHOLDER = "https://placehold.co/80x80/e2e8f0/64748b?text=No+Img";

const EMPTY_ADDRESS = {
  label: "Home",
  street: "",
  city: "",
  subcity: "",
  region: "",
  country: "Ethiopia",
  zip: "",
  phone: "",
  isDefault: false,
};

const TABS = [
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "password", label: "Password", icon: "🔐" },
  { id: "orders", label: "Orders", icon: "📦" },
  { id: "addresses", label: "Addresses", icon: "📍" },
];

const ORDER_STATUS = {
  pending: { icon: "⏳", cls: "amber" },
  processing: { icon: "⚙️", cls: "blue" },
  shipped: { icon: "🚚", cls: "violet" },
  delivered: { icon: "✅", cls: "green" },
  cancelled: { icon: "❌", cls: "red" },
};
const PAYMENT_STATUS = {
  paid: { icon: "💰", cls: "green" },
  failed: { icon: "💔", cls: "red" },
  pending: { icon: "⏳", cls: "amber" },
};

/* Defined outside Profile so inputs keep focus while typing */
function Field({ label, children, hint }) {
  return (
    <label className="pf-field">
      <span className="pf-label">{label}</span>
      {children}
      {hint && <span className="pf-hint">{hint}</span>}
    </label>
  );
}

function PasswordInput({ value, onChange, minLength, required = true }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pf-pass">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        className="pf-input"
      />
      <button type="button" className="pf-eye" onClick={() => setShow(!show)} aria-label="Toggle password visibility">
        {show ? "🙈" : "👁️"}
      </button>
    </div>
  );
}

function Profile({ onUserUpdate }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab") || "profile";

  const [activeTab, setActiveTab] = useState(urlTab);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [saving, setSaving] = useState(null); // 'profile' | 'password' | 'address'
  const [deleteId, setDeleteId] = useState(null); // address awaiting delete confirmation
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const formRef = useRef(null);

  const showToast = (text, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ text, type });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  /* ---------- Tab <-> URL sync (navbar links change ?tab= while on this page) ---------- */
  useEffect(() => {
    setActiveTab(urlTab);
  }, [urlTab]);

  const changeTab = (id) => {
    setActiveTab(id);
    setSearchParams({ tab: id }, { replace: true });
  };

  useEffect(() => {
    fetchProfile();
    return () => clearTimeout(toastTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "orders") fetchOrders();
    if (activeTab === "addresses") fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  /* ---------- Data ---------- */
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data } = await profileApi.getProfile();
      setProfile(data);
      setProfileForm({ name: data.name, phone: data.phone || "" });
    } catch (err) {
      console.error("❌ Fetch profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const { data } = await profileApi.getMyOrders();
      setOrders(data);
    } catch (err) {
      console.error("❌ Fetch orders error:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      setAddressesLoading(true);
      const { data } = await profileApi.getAddresses();
      setAddresses(data);
    } catch (err) {
      console.error("❌ Fetch addresses error:", err);
    } finally {
      setAddressesLoading(false);
    }
  };

  /* ---------- Handlers ---------- */
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving("profile");
      const { data } = await profileApi.updateProfile(profileForm);
      setProfile(data.user);
      if (onUserUpdate) onUserUpdate(data.user);
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, ...data.user }));
      showToast("Profile updated successfully!");
    } catch (err) {
      showToast("Failed: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setSaving(null);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    try {
      setSaving("password");
      await profileApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showToast("Password changed successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      showToast("Failed: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setSaving(null);
    }
  };

  const resetAddressForm = () => {
    setAddressForm(EMPTY_ADDRESS);
    setEditingAddressId(null);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving("address");
      if (editingAddressId) {
        const { data } = await profileApi.updateAddress(editingAddressId, addressForm);
        setAddresses(data.addresses);
        showToast("Address updated!");
      } else {
        const { data } = await profileApi.addAddress(addressForm);
        setAddresses(data.addresses);
        showToast("Address added!");
      }
      resetAddressForm();
    } catch (err) {
      showToast("Failed: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setSaving(null);
    }
  };

  const handleEditAddress = (addr) => {
    setEditingAddressId(addr._id);
    setAddressForm({
      label: addr.label,
      street: addr.street,
      city: addr.city,
      subcity: addr.subcity || "",
      region: addr.region || "",
      country: addr.country || "Ethiopia",
      zip: addr.zip || "",
      phone: addr.phone || "",
      isDefault: addr.isDefault,
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDeleteAddress = async (id) => {
    setDeleteId(null);
    try {
      const { data } = await profileApi.deleteAddress(id);
      setAddresses(data.addresses);
      if (editingAddressId === id) resetAddressForm();
      showToast("Address deleted");
    } catch (err) {
      showToast("Failed: " + (err.response?.data?.message || err.message), "error");
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  /* ---------- Password strength ---------- */
  const pw = passwordForm.newPassword;
  const strength = (() => {
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
    if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
    return pw ? Math.max(1, s) : 0;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const passwordsMatch = passwordForm.confirmPassword && pw === passwordForm.confirmPassword;
  const passwordsDiffer = passwordForm.confirmPassword && pw !== passwordForm.confirmPassword;

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="pf">
        <style>{css}</style>
        <div className="pf-hero">
          <div className="pf-hero-inner">
            <div className="sk sk-avatar" />
            <div style={{ flex: 1 }}>
              <div className="sk sk-line" style={{ width: "40%", background: "rgba(255,255,255,.15)" }} />
              <div className="sk sk-line" style={{ width: "25%", background: "rgba(255,255,255,.15)" }} />
            </div>
          </div>
        </div>
        <div className="pf-main">
          <div className="pf-card">
            <div className="sk sk-line" />
            <div className="sk sk-line" />
            <div className="sk sk-line short" />
          </div>
        </div>
      </div>
    );
  }

  const initial = profile?.name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="pf">
      <style>{css}</style>

      {/* ================= HERO / USER CARD ================= */}
      <header className="pf-hero">
        <div className="pf-blob b1" />
        <div className="pf-blob b2" />
        <div className="pf-hero-inner">
          <div className="pf-avatar">
            {profile?.avatar ? <img src={profile.avatar} alt={profile.name} /> : initial}
          </div>
          <div className="pf-who">
            <h1>{profile?.name}</h1>
            <p>{profile?.email}</p>
            <span className="pf-role">{profile?.role === "admin" ? "🛡️ Admin" : "👤 Customer"}</span>
          </div>
        </div>
      </header>

      <main className="pf-main">
        {/* ================= TABS ================= */}
        <div className="pf-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`pf-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => changeTab(tab.id)}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        <div className="pf-card" key={activeTab}>
          {/* ================= PROFILE TAB ================= */}
          {activeTab === "profile" && (
            <div>
              <h2 className="pf-title">Edit Profile</h2>
              <p className="pf-sub">Keep your personal details up to date.</p>
              <form onSubmit={handleProfileUpdate} className="pf-form">
                <Field label="Full Name">
                  <input
                    type="text"
                    className="pf-input"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Email" hint="🔒 Email cannot be changed">
                  <input type="email" className="pf-input" value={profile?.email || ""} disabled />
                </Field>
                <Field label="Phone Number">
                  <input
                    type="tel"
                    className="pf-input"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+251911234567"
                  />
                </Field>
                <button type="submit" className="pf-btn pf-btn-primary" disabled={saving === "profile"}>
                  {saving === "profile" ? <span className="pf-spin" /> : "💾"} Save Changes
                </button>
              </form>
            </div>
          )}

          {/* ================= PASSWORD TAB ================= */}
          {activeTab === "password" && (
            <div>
              <h2 className="pf-title">Change Password</h2>
              <p className="pf-sub">Use a strong password you don't use anywhere else.</p>
              {profile?.authProvider === "google" ? (
                <div className="pf-notice">
                  ⚠️ You signed up with Google. Password changes must be made through your Google account.
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="pf-form">
                  <Field label="Current Password">
                    <PasswordInput
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    />
                  </Field>

                  <Field label="New Password (min 6 characters)">
                    <PasswordInput
                      value={passwordForm.newPassword}
                      minLength={6}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    />
                    {pw && (
                      <div className="pf-strength">
                        <div className="pf-strength-bars">
                          {[1, 2, 3, 4].map((n) => (
                            <span key={n} className={n <= strength ? `on s${strength}` : ""} />
                          ))}
                        </div>
                        <small className={`s${strength}`}>{strengthLabel}</small>
                      </div>
                    )}
                  </Field>

                  <Field label="Confirm New Password">
                    <PasswordInput
                      value={passwordForm.confirmPassword}
                      minLength={6}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                    {passwordsMatch && <span className="pf-match ok">✓ Passwords match</span>}
                    {passwordsDiffer && <span className="pf-match no">✕ Passwords do not match</span>}
                  </Field>

                  <button type="submit" className="pf-btn pf-btn-primary" disabled={saving === "password"}>
                    {saving === "password" ? <span className="pf-spin" /> : "🔐"} Change Password
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ================= ORDERS TAB ================= */}
          {activeTab === "orders" && (
            <div>
              <h2 className="pf-title">📦 Order History <span className="pf-count">{orders.length}</span></h2>
              <p className="pf-sub">Track and review everything you've ordered.</p>

              {ordersLoading && orders.length === 0 ? (
                <div className="pf-list">
                  {[0, 1].map((i) => (
                    <div key={i} className="pf-order">
                      <div className="sk sk-line" style={{ width: "35%" }} />
                      <div className="sk sk-line" />
                      <div className="sk sk-line short" />
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="pf-empty">
                  <div className="pf-empty-icon">📦</div>
                  <p>No orders yet</p>
                </div>
              ) : (
                <div className="pf-list">
                  {orders.map((order, idx) => {
                    const st = ORDER_STATUS[order.status] || { icon: "📦", cls: "gray" };
                    const pay = PAYMENT_STATUS[order.paymentStatus] || { icon: "", cls: "gray" };
                    return (
                      <article key={order._id} className="pf-order" style={{ animationDelay: `${Math.min(idx, 8) * 70}ms` }}>
                        <div className="pf-order-head">
                          <div>
                            <div className="pf-order-id">Order #{order._id.slice(-6).toUpperCase()}</div>
                            <div className="pf-order-date">📅 {formatDate(order.createdAt)}</div>
                          </div>
                          <div className="pf-badges">
                            <span className={`pf-badge ${st.cls}`}>
                              {st.icon} <span style={{ textTransform: "capitalize" }}>{order.status}</span>
                            </span>
                            <span className={`pf-badge ${pay.cls}`}>
                              {pay.icon} <span style={{ textTransform: "capitalize" }}>{order.paymentStatus}</span>
                            </span>
                          </div>
                        </div>

                        <div className="pf-items">
                          {order.products?.slice(0, 3).map((item, i) => (
                            <div key={i} className="pf-item">
                              {item.product ? (
                                <>
                                  <img
                                    src={item.product.image || PLACEHOLDER}
                                    alt={item.product.name || "Product"}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = PLACEHOLDER;
                                    }}
                                  />
                                  <div className="pf-item-info">
                                    <strong>{item.product.name || "Unknown Product"}</strong>
                                    <span>
                                      Qty: {item.quantity} × {item.price?.toFixed(2)} ETB
                                    </span>
                                  </div>
                                  <div className="pf-item-total">{(item.quantity * item.price).toFixed(2)} ETB</div>
                                </>
                              ) : (
                                <div className="pf-removed">🗑️ Product removed from catalog</div>
                              )}
                            </div>
                          ))}
                          {order.products?.length > 3 && (
                            <div className="pf-more">+{order.products.length - 3} more item(s)</div>
                          )}
                        </div>

                        <div className="pf-order-total">
                          <span>💰 Total Amount</span>
                          <strong>{order.totalPrice?.toFixed(2)} ETB</strong>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= ADDRESSES TAB ================= */}
          {activeTab === "addresses" && (
            <div>
              <h2 className="pf-title">📍 Saved Addresses <span className="pf-count">{addresses.length}</span></h2>
              <p className="pf-sub">Save your delivery addresses for faster checkout.</p>

              {/* Form */}
              <div className={`pf-addr-form ${editingAddressId ? "editing" : ""}`} ref={formRef}>
                <h3>{editingAddressId ? "✏️ Edit Address" : "➕ Add New Address"}</h3>
                <form onSubmit={handleAddressSubmit}>
                  <div className="pf-grid">
                    <Field label="Label">
                      <select
                        className="pf-input"
                        value={addressForm.label}
                        onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                      >
                        <option value="Home">🏠 Home</option>
                        <option value="Work">💼 Work</option>
                        <option value="Other">📍 Other</option>
                      </select>
                    </Field>
                    <Field label="Phone">
                      <input
                        type="tel"
                        className="pf-input"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        placeholder="+251911234567"
                      />
                    </Field>
                  </div>

                  <Field label="Street Address *">
                    <input
                      type="text"
                      className="pf-input"
                      value={addressForm.street}
                      onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                      required
                      placeholder="Bole Road, Building 123"
                    />
                  </Field>

                  <div className="pf-grid">
                    <Field label="City *">
                      <input
                        type="text"
                        className="pf-input"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        required
                        placeholder="Addis Ababa"
                      />
                    </Field>
                    <Field label="Subcity">
                      <input
                        type="text"
                        className="pf-input"
                        value={addressForm.subcity}
                        onChange={(e) => setAddressForm({ ...addressForm, subcity: e.target.value })}
                        placeholder="Bole"
                      />
                    </Field>
                  </div>

                  <div className="pf-grid">
                    <Field label="Region">
                      <input
                        type="text"
                        className="pf-input"
                        value={addressForm.region}
                        onChange={(e) => setAddressForm({ ...addressForm, region: e.target.value })}
                        placeholder="Addis Ababa"
                      />
                    </Field>
                    <Field label="ZIP Code">
                      <input
                        type="text"
                        className="pf-input"
                        value={addressForm.zip}
                        onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })}
                        placeholder="1000"
                      />
                    </Field>
                  </div>

                  <label className="pf-switch">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    />
                    <span className="pf-slider" />
                    Set as default address
                  </label>

                  <div className="pf-row-btns">
                    <button type="submit" className="pf-btn pf-btn-primary" disabled={saving === "address"}>
                      {saving === "address" ? <span className="pf-spin" /> : editingAddressId ? "💾" : "➕"}{" "}
                      {editingAddressId ? "Update Address" : "Add Address"}
                    </button>
                    {editingAddressId && (
                      <button type="button" className="pf-btn pf-btn-light" onClick={resetAddressForm}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List */}
              {addressesLoading && addresses.length === 0 ? (
                <div className="pf-addr-grid">
                  {[0, 1].map((i) => (
                    <div key={i} className="pf-addr">
                      <div className="sk sk-line" style={{ width: "40%" }} />
                      <div className="sk sk-line" />
                      <div className="sk sk-line short" />
                    </div>
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                <div className="pf-empty">
                  <div className="pf-empty-icon">📍</div>
                  <p>No saved addresses yet</p>
                </div>
              ) : (
                <div className="pf-addr-grid">
                  {addresses.map((addr, idx) => (
                    <div
                      key={addr._id}
                      className={`pf-addr ${addr.isDefault ? "default" : ""}`}
                      style={{ animationDelay: `${Math.min(idx, 8) * 70}ms` }}
                    >
                      {addr.isDefault && <span className="pf-default">✓ Default</span>}
                      <div className="pf-addr-label">
                        <span>{addr.label === "Home" ? "🏠" : addr.label === "Work" ? "💼" : "📍"}</span>
                        <strong>{addr.label}</strong>
                      </div>
                      <p>{addr.street}</p>
                      <p>
                        {addr.city}
                        {addr.subcity ? `, ${addr.subcity}` : ""}
                      </p>
                      <p>
                        {addr.region}
                        {addr.zip ? `, ${addr.zip}` : ""}
                      </p>
                      <p>{addr.country}</p>
                      {addr.phone && <p className="pf-addr-phone">📞 {addr.phone}</p>}

                      <div className="pf-addr-actions">
                        <button className="pf-mini edit" onClick={() => handleEditAddress(addr)}>
                          ✏️ Edit
                        </button>
                        {deleteId === addr._id ? (
                          <div className="pf-confirm">
                            <span>Delete?</span>
                            <button className="yes" onClick={() => handleDeleteAddress(addr._id)}>Yes</button>
                            <button className="no" onClick={() => setDeleteId(null)}>No</button>
                          </div>
                        ) : (
                          <button className="pf-mini del" onClick={() => setDeleteId(addr._id)}>
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ================= TOAST ================= */}
      {toast && (
        <div className={`pf-toast ${toast.type}`} role="status">
          {toast.type === "success" ? "✅" : "❌"} {toast.text}
        </div>
      )}
    </div>
  );
}

const css = `
.pf { font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif; background: #f8fafc; min-height: 100vh; color: #0f172a; }
.pf * { box-sizing: border-box; }
@keyframes pfUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }

/* Hero */
.pf-hero { position: relative; overflow: hidden; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%); color: #fff; padding: 2.8rem 1.5rem 4.6rem; border-radius: 0 0 36px 36px; }
.pf-blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: .5; animation: pfBlob 12s ease-in-out infinite alternate; }
.pf-blob.b1 { width: 280px; height: 280px; background: #6366f1; top: -120px; left: -60px; }
.pf-blob.b2 { width: 250px; height: 250px; background: #ec4899; bottom: -130px; right: 8%; animation-delay: -5s; }
@keyframes pfBlob { to { transform: translate(40px, -25px) scale(1.15); } }
.pf-hero-inner { position: relative; z-index: 2; max-width: 1000px; margin: 0 auto; display: flex; align-items: center; gap: 1.5rem; animation: pfUp .8s cubic-bezier(.2,.8,.2,1) both; }
.pf-avatar { position: relative; flex-shrink: 0; width: 96px; height: 96px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.6rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #ec4899); border: 4px solid rgba(255,255,255,.25); box-shadow: 0 14px 35px rgba(0,0,0,.35); }
.pf-avatar::after { content: ""; position: absolute; inset: -10px; border-radius: 50%; border: 2px dashed rgba(255,255,255,.3); animation: pfSpin 20s linear infinite; }
@keyframes pfSpin { to { transform: rotate(360deg); } }
.pf-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.pf-who h1 { margin: 0 0 .25rem; font-size: clamp(1.5rem, 4vw, 2.1rem); font-weight: 800; letter-spacing: -.01em; }
.pf-who p { margin: 0 0 .7rem; opacity: .8; word-break: break-all; }
.pf-role { display: inline-block; padding: .3rem .9rem; border-radius: 999px; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.22); font-size: .8rem; font-weight: 700; backdrop-filter: blur(6px); }

/* Layout */
.pf-main { max-width: 1000px; margin: -2.4rem auto 0; padding: 0 1.5rem 4rem; position: relative; z-index: 3; }

/* Tabs */
.pf-tabs { display: flex; gap: .4rem; padding: .45rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; box-shadow: 0 10px 30px rgba(15,23,42,.08); margin-bottom: 1.4rem; overflow-x: auto; scrollbar-width: none; }
.pf-tabs::-webkit-scrollbar { display: none; }
.pf-tab { flex: 1; min-width: max-content; padding: .75rem 1.2rem; border: none; border-radius: 13px; background: transparent; color: #64748b; font-size: .92rem; font-weight: 600; cursor: pointer; transition: all .25s ease; }
.pf-tab:hover { background: #eef2ff; color: #4338ca; }
.pf-tab.active { color: #fff; background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 8px 20px rgba(99,102,241,.4); }

/* Card */
.pf-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 2rem; box-shadow: 0 10px 30px rgba(15,23,42,.06); animation: pfUp .5s cubic-bezier(.2,.8,.2,1) both; }
.pf-title { margin: 0; font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; gap: .6rem; }
.pf-count { padding: .15rem .7rem; border-radius: 999px; background: #eef2ff; color: #4f46e5; font-size: .85rem; font-weight: 700; }
.pf-sub { margin: .3rem 0 1.6rem; color: #64748b; font-size: .93rem; }

/* Forms */
.pf-form { max-width: 520px; display: flex; flex-direction: column; gap: 1.2rem; }
.pf-field { display: flex; flex-direction: column; gap: .45rem; margin-bottom: 0; }
.pf-addr-form .pf-field { margin-bottom: .9rem; }
.pf-label { font-size: .88rem; font-weight: 700; color: #334155; }
.pf-hint { font-size: .78rem; color: #94a3b8; }
.pf-input { width: 100%; padding: .8rem 1rem; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; font-size: .95rem; color: #0f172a; outline: none; transition: border-color .25s, box-shadow .25s, background .25s; font-family: inherit; }
.pf-input:focus { border-color: #818cf8; box-shadow: 0 0 0 4px rgba(129,140,248,.2); }
.pf-input:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }
.pf-pass { position: relative; }
.pf-pass .pf-input { padding-right: 3rem; }
.pf-eye { position: absolute; right: .5rem; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border: none; background: transparent; cursor: pointer; font-size: 1.05rem; border-radius: 10px; transition: background .2s; }
.pf-eye:hover { background: #f1f5f9; }
.pf-strength { display: flex; align-items: center; gap: .7rem; animation: pfUp .3s both; }
.pf-strength-bars { display: flex; gap: 5px; flex: 1; }
.pf-strength-bars span { flex: 1; height: 6px; border-radius: 6px; background: #e2e8f0; transition: background .3s; }
.pf-strength-bars span.on.s1 { background: #ef4444; }
.pf-strength-bars span.on.s2 { background: #f59e0b; }
.pf-strength-bars span.on.s3 { background: #3b82f6; }
.pf-strength-bars span.on.s4 { background: #10b981; }
.pf-strength small { font-weight: 700; font-size: .78rem; }
.pf-strength small.s1 { color: #ef4444; } .pf-strength small.s2 { color: #d97706; } .pf-strength small.s3 { color: #2563eb; } .pf-strength small.s4 { color: #059669; }
.pf-match { font-size: .8rem; font-weight: 600; animation: pfUp .25s both; }
.pf-match.ok { color: #059669; } .pf-match.no { color: #dc2626; }
.pf-notice { padding: 1.2rem 1.4rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 14px; color: #92400e; line-height: 1.6; }

/* Buttons */
.pf-btn { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; padding: .85rem 1.8rem; border: none; border-radius: 999px; font-weight: 700; font-size: .95rem; cursor: pointer; align-self: flex-start; transition: transform .25s ease, box-shadow .25s ease; }
.pf-btn:hover:not(:disabled) { transform: translateY(-3px); }
.pf-btn:disabled { opacity: .7; cursor: wait; }
.pf-btn-primary { color: #fff; background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 10px 25px rgba(99,102,241,.4); }
.pf-btn-primary:hover:not(:disabled) { box-shadow: 0 14px 30px rgba(99,102,241,.55); }
.pf-btn-light { background: #f1f5f9; color: #334155; }
.pf-spin { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: pfSpin .7s linear infinite; }
.pf-row-btns { display: flex; gap: .7rem; flex-wrap: wrap; margin-top: 1.3rem; }

/* Orders */
.pf-list { display: grid; gap: 1.1rem; }
.pf-order { border: 1px solid #e2e8f0; border-radius: 20px; padding: 1.3rem; background: #fff; opacity: 0; animation: pfUp .55s cubic-bezier(.2,.8,.2,1) forwards; transition: box-shadow .3s, border-color .3s, transform .3s; }
.pf-list .pf-order:has(.sk) { opacity: 1; animation: none; }
.pf-order:hover { box-shadow: 0 14px 30px rgba(99,102,241,.14); border-color: #c7d2fe; transform: translateY(-3px); }
.pf-order-head { display: flex; justify-content: space-between; align-items: flex-start; gap: .8rem; flex-wrap: wrap; margin-bottom: 1rem; }
.pf-order-id { font-weight: 800; font-size: 1.08rem; }
.pf-order-date { font-size: .85rem; color: #64748b; margin-top: .2rem; }
.pf-badges { display: flex; gap: .5rem; flex-wrap: wrap; }
.pf-badge { display: inline-flex; align-items: center; gap: .35rem; padding: .35rem .85rem; border-radius: 999px; font-size: .78rem; font-weight: 700; border: 1px solid; }
.pf-badge.amber { background: #fffbeb; color: #92400e; border-color: #fcd34d; }
.pf-badge.blue { background: #eff6ff; color: #1e40af; border-color: #93c5fd; }
.pf-badge.violet { background: #f5f3ff; color: #6d28d9; border-color: #c4b5fd; }
.pf-badge.green { background: #ecfdf5; color: #065f46; border-color: #6ee7b7; }
.pf-badge.red { background: #fef2f2; color: #991b1b; border-color: #fca5a5; }
.pf-badge.gray { background: #f1f5f9; color: #475569; border-color: #cbd5e1; }
.pf-items { display: grid; gap: .6rem; }
.pf-item { display: flex; align-items: center; gap: .9rem; padding: .6rem .8rem; background: #f8fafc; border: 1px solid #eef2f7; border-radius: 14px; transition: background .2s; }
.pf-item:hover { background: #f1f5f9; }
.pf-item img { width: 52px; height: 52px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
.pf-item-info { flex: 1; min-width: 0; }
.pf-item-info strong { display: block; font-size: .92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pf-item-info span { font-size: .8rem; color: #64748b; }
.pf-item-total { font-weight: 800; color: #059669; font-size: .92rem; white-space: nowrap; }
.pf-removed { padding: .4rem; color: #94a3b8; font-size: .85rem; font-style: italic; }
.pf-more { text-align: center; font-size: .85rem; color: #64748b; padding: .3rem; }
.pf-order-total { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding: .9rem 1.1rem; border-radius: 14px; background: linear-gradient(135deg, #eef2ff, #fdf4ff); }
.pf-order-total span { color: #475569; font-weight: 600; font-size: .92rem; }
.pf-order-total strong { font-size: 1.3rem; font-weight: 800; color: #059669; }

/* Addresses */
.pf-addr-form { padding: 1.5rem; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 20px; margin-bottom: 1.6rem; transition: border-color .3s, background .3s, box-shadow .3s; scroll-margin-top: 90px; }
.pf-addr-form.editing { border-color: #818cf8; background: #eef2ff; box-shadow: 0 0 0 4px rgba(129,140,248,.18); }
.pf-addr-form h3 { margin: 0 0 1.1rem; font-size: 1.1rem; }
.pf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.pf-switch { display: inline-flex; align-items: center; gap: .7rem; margin-top: .3rem; cursor: pointer; font-size: .9rem; font-weight: 600; user-select: none; }
.pf-switch input { display: none; }
.pf-slider { position: relative; width: 44px; height: 24px; border-radius: 999px; background: #cbd5e1; transition: background .25s; }
.pf-slider::after { content: ""; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.25); transition: transform .25s cubic-bezier(.2,.8,.2,1); }
.pf-switch input:checked + .pf-slider { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
.pf-switch input:checked + .pf-slider::after { transform: translateX(20px); }

.pf-addr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.1rem; }
.pf-addr { position: relative; padding: 1.3rem; border: 1px solid #e2e8f0; border-radius: 20px; background: #fff; opacity: 0; animation: pfUp .55s cubic-bezier(.2,.8,.2,1) forwards; transition: transform .3s, box-shadow .3s, border-color .3s; }
.pf-addr-grid .pf-addr:has(.sk) { opacity: 1; animation: none; }
.pf-addr:hover { transform: translateY(-5px); box-shadow: 0 16px 32px rgba(99,102,241,.15); }
.pf-addr.default { border: 2px solid #6366f1; background: linear-gradient(135deg, #eef2ff, #fff); }
.pf-default { position: absolute; top: .9rem; right: .9rem; padding: .25rem .75rem; border-radius: 999px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-size: .72rem; font-weight: 700; }
.pf-addr-label { display: flex; align-items: center; gap: .5rem; margin-bottom: .6rem; font-size: 1.05rem; }
.pf-addr p { margin: .2rem 0; color: #475569; font-size: .92rem; }
.pf-addr-phone { color: #4f46e5 !important; font-weight: 600; }
.pf-addr-actions { display: flex; align-items: center; gap: .5rem; margin-top: 1rem; flex-wrap: wrap; }
.pf-mini { padding: .45rem .95rem; border: none; border-radius: 10px; font-size: .82rem; font-weight: 700; cursor: pointer; transition: transform .2s, background .2s; }
.pf-mini:hover { transform: translateY(-2px); }
.pf-mini.edit { background: #eef2ff; color: #4338ca; }
.pf-mini.edit:hover { background: #e0e7ff; }
.pf-mini.del { background: #fee2e2; color: #dc2626; }
.pf-mini.del:hover { background: #fecaca; }
.pf-confirm { display: inline-flex; align-items: center; gap: .4rem; padding: .25rem .4rem .25rem .8rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; font-size: .8rem; font-weight: 700; color: #991b1b; animation: pfPop .25s cubic-bezier(.2,.8,.2,1); }
@keyframes pfPop { from { opacity: 0; transform: scale(.85); } to { opacity: 1; transform: none; } }
.pf-confirm button { border: none; padding: .3rem .7rem; border-radius: 8px; font-weight: 700; font-size: .78rem; cursor: pointer; }
.pf-confirm .yes { background: #dc2626; color: #fff; }
.pf-confirm .no { background: #fff; color: #475569; border: 1px solid #e2e8f0; }

/* Empty */
.pf-empty { text-align: center; padding: 2.5rem 1rem; color: #64748b; border: 2px dashed #cbd5e1; border-radius: 20px; }
.pf-empty-icon { font-size: 3.2rem; display: inline-block; animation: pfBob 3s ease-in-out infinite; }
@keyframes pfBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.pf-empty p { margin: .5rem 0 0; }

/* Skeleton */
.sk { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%); background-size: 400% 100%; animation: pfSk 1.4s ease infinite; border-radius: 10px; }
.sk-line { height: 16px; margin-bottom: .8rem; }
.sk-line.short { width: 55%; }
.sk-avatar { width: 96px; height: 96px; border-radius: 50%; background: rgba(255,255,255,.15); }
@keyframes pfSk { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

/* Toast */
.pf-toast { position: fixed; bottom: 1.6rem; left: 50%; transform: translateX(-50%); z-index: 3000; padding: .9rem 1.6rem; border-radius: 999px; color: #fff; font-weight: 700; font-size: .92rem; box-shadow: 0 16px 35px rgba(0,0,0,.3); animation: pfToast .4s cubic-bezier(.2,.8,.2,1); max-width: calc(100vw - 2rem); }
.pf-toast.success { background: linear-gradient(135deg, #059669, #10b981); }
.pf-toast.error { background: linear-gradient(135deg, #dc2626, #ef4444); }
@keyframes pfToast { from { opacity: 0; transform: translateX(-50%) translateY(30px); } to { opacity: 1; transform: translateX(-50%); } }

@media (max-width: 640px) {
  .pf-hero-inner { flex-direction: column; text-align: center; }
  .pf-main { padding: 0 1rem 3rem; }
  .pf-card { padding: 1.3rem; border-radius: 20px; }
  .pf-grid { grid-template-columns: 1fr; gap: 0; }
  .pf-btn { align-self: stretch; }
  .pf-item { flex-wrap: wrap; }
}
@media (prefers-reduced-motion: reduce) {
  .pf *, .pf *::before, .pf *::after { animation: none !important; transition: none !important; }
  .pf-order, .pf-addr { opacity: 1; }
}
`;

export default Profile;
