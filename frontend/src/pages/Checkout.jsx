import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API from "../api/axios";

function Checkout({ cart, user }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("chapa");

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    city: "Addis Ababa",
    subcity: "",
    street: "",
  });

  useEffect(() => {
    if (!cart || cart.length === 0) {
      navigate("/cart");
    }
  }, [cart, navigate]);

  const handleChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const subtotal = cart ? cart.reduce((sum, item) => sum + item.price * item.quantity, 0) : 0;
  const shippingFee = subtotal > 5000 ? 0 : 150;
  const total = subtotal + shippingFee;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    if (!cart || cart.length === 0) {
      alert("⚠️ Your cart is empty! Please add items to your cart before checking out.");
      navigate("/cart");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // ✅ FIXED: Backend expects 'items' array with '_id', and 'cod' for payment method
      const orderData = {
        items: cart.map(item => ({
          _id: item._id || item.id,
          quantity: item.quantity,
        })),
        shippingAddress,
        paymentMethod: paymentMethod === "cash_on_delivery" ? "cod" : "chapa",
      };

      console.log("📤 Sending to backend:\n", JSON.stringify(orderData, null, 2));

      const { data } = await API.post("/orders", orderData);

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        const orderId = data.order?._id || data._id;
        navigate(`/order-confirmation?orderId=${orderId}`);
      }
    } catch (err) {
      console.error("❌ Backend Error:\n", JSON.stringify(err.response?.data, null, 2));
      
      const backendError = err.response?.data?.message;
      const errorMsg = Array.isArray(backendError) 
        ? backendError.join(", ") 
        : (backendError || "Failed to process order. Please check your details.");
        
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!cart || cart.length === 0) return null;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ marginBottom: "2rem", color: "#1e293b" }}>🛒 {t("checkout.title") || "Checkout"}</h1>

      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
          ❌ {error}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          <div style={{ background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", color: "#1e293b" }}>📍 {t("checkout.shipping_info") || "Shipping Info"}</h2>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.9rem" }}>{t("auth.full_name") || "Full Name"} *</label>
                <input name="fullName" value={shippingAddress.fullName} onChange={handleChange} required style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.9rem" }}>{t("auth.phone") || "Phone"} *</label>
                <input name="phone" type="tel" value={shippingAddress.phone} onChange={handleChange} required placeholder="+251911234567" style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.9rem" }}>{t("checkout.city") || "City"} *</label>
                  <input name="city" value={shippingAddress.city} onChange={handleChange} required style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.9rem" }}>{t("checkout.subcity") || "Subcity"}</label>
                  <input name="subcity" value={shippingAddress.subcity} onChange={handleChange} placeholder="e.g., Bole" style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", boxSizing: "border-box" }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.9rem" }}>{t("checkout.street") || "Street"} *</label>
                <input name="street" value={shippingAddress.street} onChange={handleChange} required placeholder="House number, Street name" style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", boxSizing: "border-box" }} />
              </div>
            </div>
          </div>

          <div style={{ background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", color: "#1e293b" }}>💳 {t("checkout.payment_method") || "Payment Method"}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              
              <label style={{ 
                display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", 
                border: paymentMethod === "chapa" ? "2px solid #6366f1" : "1px solid #e2e8f0",
                borderRadius: "12px", cursor: "pointer", transition: "all 0.2s",
                background: paymentMethod === "chapa" ? "#eef2ff" : "white"
              }}>
                <input type="radio" name="payment" value="chapa" checked={paymentMethod === "chapa"} onChange={() => setPaymentMethod("chapa")} style={{ width: "20px", height: "20px", accentColor: "#6366f1" }} />
                <div>
                  <div style={{ fontWeight: "700", color: "#1e293b" }}>{t("checkout.pay_with_chapa") || "Pay with Chapa"}</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{t("checkout.chapa_desc") || "Secure payment via Card, Telebirr, or CBE Birr"}</div>
                </div>
              </label>

              <label style={{ 
                display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", 
                border: paymentMethod === "cash_on_delivery" ? "2px solid #6366f1" : "1px solid #e2e8f0",
                borderRadius: "12px", cursor: "pointer", transition: "all 0.2s",
                background: paymentMethod === "cash_on_delivery" ? "#eef2ff" : "white"
              }}>
                <input type="radio" name="payment" value="cash_on_delivery" checked={paymentMethod === "cash_on_delivery"} onChange={() => setPaymentMethod("cash_on_delivery")} style={{ width: "20px", height: "20px", accentColor: "#6366f1" }} />
                <div>
                  <div style={{ fontWeight: "700", color: "#1e293b" }}>{t("checkout.cash_on_delivery") || "Cash on Delivery"}</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{t("checkout.cod_desc") || "Pay in cash when your order arrives"}</div>
                </div>
              </label>

            </div>
          </div>
        </div>

        <div style={{ background: "#f8fafc", padding: "2rem", borderRadius: "12px", height: "fit-content", position: "sticky", top: "2rem" }}>
          <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", color: "#1e293b" }}>📝 {t("cart.order_summary") || "Order Summary"}</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem", maxHeight: "300px", overflowY: "auto" }}>
            {cart.map((item) => (
              <div key={item._id || item.id} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <img src={item.image || "https://placehold.co/60"} alt={item.name} style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: "600", fontSize: "0.9rem", color: "#1e293b" }}>{item.name}</p>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>Qty: {item.quantity}</p>
                </div>
                <p style={{ margin: 0, fontWeight: "700", color: "#10b981" }}>{(item.price * item.quantity).toLocaleString()} ETB</p>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
              <span>{t("cart.subtotal") || "Subtotal"}</span>
              <span>{subtotal.toLocaleString()} ETB</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
              <span>{t("cart.shipping") || "Shipping"}</span>
              <span style={{ color: shippingFee === 0 ? "#10b981" : "inherit" }}>{shippingFee === 0 ? (t("cart.free") || "FREE") : `${shippingFee} ETB`}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "800", fontSize: "1.2rem", color: "#1e293b", marginTop: "0.5rem" }}>
              <span>{t("cart.total") || "Total"}</span>
              <span>{total.toLocaleString()} ETB</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: "100%", marginTop: "2rem", padding: "1rem", 
              background: loading ? "#94a3b8" : "linear-gradient(135deg, #6366f1, #8b5cf6)", 
              color: "white", border: "none", borderRadius: "12px", 
              cursor: loading ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "1.1rem",
              boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)", transition: "transform 0.2s"
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {loading ? (t("common.loading") || "Processing... 🔄") : (paymentMethod === "cash_on_delivery" ? `📦 ${t("checkout.place_order") || "Place Order"}` : `💳 ${t("checkout.pay_with_chapa") || "Pay with Chapa"} (${total.toLocaleString()} ETB)`)}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Checkout;