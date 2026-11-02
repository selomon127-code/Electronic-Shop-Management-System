/* eslint-disable no-unused-vars */
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
    if (!cart || cart.length === 0) navigate("/cart");
  }, [cart, navigate]);

  const handleChange = (e) => setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal > 5000 ? 0 : 150;
  const total = subtotal + shippingFee;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const orderData = {
        items: cart.map(item => ({ _id: item._id || item.id, quantity: item.quantity })),
        shippingAddress,
        paymentMethod: paymentMethod === "cash_on_delivery" ? "cod" : "chapa",
      };

      const { data } = await API.post("/orders", orderData);

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        navigate(`/order-confirmation?orderId=${data.order?._id || data._id}`);
      }
    } catch (err) {
      const backendError = err.response?.data?.message;
      setError(Array.isArray(backendError) ? backendError.join(", ") : (backendError || "Failed to process order."));
    } finally {
      setLoading(false);
    }
  };

  if (!cart || cart.length === 0) return null;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <h1 style={{ marginBottom: "1.5rem", fontSize: "1.5rem" }}>🛒 Checkout</h1>

      {error && <div style={{ background: "#fef2f2", color: "#991b1b", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem", border: "1px solid #fecaca" }}>❌ {error}</div>}

      <form onSubmit={handlePlaceOrder} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Shipping Info */}
          <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <h2 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>📍 Shipping Info</h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <input name="fullName" value={shippingAddress.fullName} onChange={handleChange} required placeholder="Full Name *" style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.9rem", boxSizing: "border-box" }} />
              <input name="phone" type="tel" value={shippingAddress.phone} onChange={handleChange} required placeholder="Phone (+251...) *" style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.9rem", boxSizing: "border-box" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <input name="city" value={shippingAddress.city} onChange={handleChange} required placeholder="City *" style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.9rem", boxSizing: "border-box" }} />
                <input name="subcity" value={shippingAddress.subcity} onChange={handleChange} placeholder="Subcity" style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.9rem", boxSizing: "border-box" }} />
              </div>
              <input name="street" value={shippingAddress.street} onChange={handleChange} required placeholder="Street / House Number *" style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.9rem", boxSizing: "border-box" }} />
            </div>
          </div>

          {/* Payment Method */}
          <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <h2 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>💳 Payment Method</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {["chapa", "cash_on_delivery"].map((method) => (
                <label key={method} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", border: paymentMethod === method ? "2px solid var(--primary)" : "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", background: paymentMethod === method ? "#eef2ff" : "white" }}>
                  <input type="radio" name="payment" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} style={{ accentColor: "var(--primary)" }} />
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>{method === "chapa" ? "Pay with Chapa" : "Cash on Delivery"}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{method === "chapa" ? "Card, Telebirr, or CBE Birr" : "Pay when your order arrives"}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "12px", height: "fit-content", position: "sticky", top: "80px", border: "1px solid var(--border)" }}>
          <h2 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>📝 Order Summary</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem", maxHeight: "250px", overflowY: "auto" }}>
            {cart.map((item) => (
              <div key={item._id || item.id} style={{ display: "flex", gap: "0.75rem", alignItems: "center", fontSize: "0.9rem" }}>
                <img src={item.image || "https://placehold.co/50"} alt={item.name} style={{ width: "50px", height: "50px", borderRadius: "6px", objectFit: "cover" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: "600", fontSize: "0.85rem" }}>{item.name}</p>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8rem" }}>Qty: {item.quantity}</p>
                </div>
                <p style={{ margin: 0, fontWeight: "700", color: "var(--success)" }}>{(item.price * item.quantity).toLocaleString()} ETB</p>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}><span>Subtotal</span><span>{subtotal.toLocaleString()} ETB</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}><span>Shipping</span><span style={{ color: shippingFee === 0 ? "var(--success)" : "inherit" }}>{shippingFee === 0 ? "FREE" : `${shippingFee} ETB`}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "800", fontSize: "1.1rem", marginTop: "0.5rem" }}><span>Total</span><span>{total.toLocaleString()} ETB</span></div>
          </div>

          <button type="submit" disabled={loading} style={{ width: "100%", marginTop: "1.25rem", padding: "0.85rem", background: loading ? "#cbd5e1" : "var(--primary)", color: "white", border: "none", borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "1rem" }}>
            {loading ? "Processing..." : (paymentMethod === "cash_on_delivery" ? "📦 Place Order" : `💳 Pay ${total.toLocaleString()} ETB`)}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Checkout;