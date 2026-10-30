// frontend/src/pages/Payment.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { paymentApi } from "../api/paymentApi";

function Payment({ onOrderSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get order details passed from checkout
  const orderData = location.state?.orderData;
  
  const [paymentMethod, setPaymentMethod] = useState("chapa"); // 'chapa' or 'cod'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!orderData) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <h2>No order data found.</h2>
        <button onClick={() => navigate("/cart")} style={{ marginTop: "1rem", padding: "0.75rem 1.5rem", background: "#6366f1", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
          ← Back to Cart
        </button>
      </div>
    );
  }

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (paymentMethod === "chapa") {
        // 1. Initialize Chapa payment
        const response = await paymentApi.initializeChapa(orderData);
        
        // 2. Redirect user to Chapa's secure payment page
        if (response.data.data.checkout_url) {
          window.location.href = response.data.data.checkout_url;
        } else {
          throw new Error("Failed to get checkout URL");
        }
      } else {
        // 3. Handle Cash on Delivery
        const response = await paymentApi.createCODOrder(orderData);
        
        // 4. Notify parent component (App.jsx) to update cart/state
        if (onOrderSuccess) {
          onOrderSuccess(response.data.order);
        }
        
        // 5. Redirect to success page
        navigate("/order-success", { 
          state: { order: response.data.order, method: "cod" } 
        });
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.response?.data?.message || "Payment initialization failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "3rem auto", padding: "2rem", background: "white", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
      <h2 style={{ textAlign: "center", color: "#1e293b", marginBottom: "1.5rem" }}>💳 Choose Payment Method</h2>
      
      <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
        <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>Total Amount to Pay:</p>
        <p style={{ margin: "0.5rem 0 0 0", fontSize: "2rem", fontWeight: "800", color: "#0f172a" }}>
          {orderData.totalPrice.toLocaleString()} ETB
        </p>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem", textAlign: "center" }}>
          ❌ {error}
        </div>
      )}

      <form onSubmit={handlePayment} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Chapa Option */}
        <label 
          style={{ 
            display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", 
            border: paymentMethod === "chapa" ? "2px solid #6366f1" : "2px solid #e2e8f0", 
            borderRadius: "12px", cursor: "pointer", transition: "all 0.2s" 
          }}
          onClick={() => setPaymentMethod("chapa")}
        >
          <input 
            type="radio" 
            name="payment" 
            value="chapa" 
            checked={paymentMethod === "chapa"} 
            onChange={() => setPaymentMethod("chapa")}
            style={{ width: "20px", height: "20px", accentColor: "#6366f1" }}
          />
          <div>
            <div style={{ fontWeight: "700", color: "#0f172a" }}>Chapa (Online Payment)</div>
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Pay securely with Telebirr, CBE Birr, or Bank Card</div>
          </div>
        </label>

        {/* COD Option */}
        <label 
          style={{ 
            display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", 
            border: paymentMethod === "cod" ? "2px solid #6366f1" : "2px solid #e2e8f0", 
            borderRadius: "12px", cursor: "pointer", transition: "all 0.2s" 
          }}
          onClick={() => setPaymentMethod("cod")}
        >
          <input 
            type="radio" 
            name="payment" 
            value="cod" 
            checked={paymentMethod === "cod"} 
            onChange={() => setPaymentMethod("cod")}
            style={{ width: "20px", height: "20px", accentColor: "#6366f1" }}
          />
          <div>
            <div style={{ fontWeight: "700", color: "#0f172a" }}>Cash on Delivery (COD)</div>
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Pay in cash when your order arrives</div>
          </div>
        </label>

        <button 
          type="submit" 
          disabled={isLoading}
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: isLoading ? "#94a3b8" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontWeight: "700",
            fontSize: "1.1rem",
            transition: "transform 0.2s"
          }}
        >
          {isLoading ? "Processing... 🔄" : (paymentMethod === "chapa" ? "Proceed to Chapa Payment" : "Place Order (COD)")}
        </button>
      </form>

      <button 
        onClick={() => navigate(-1)} 
        style={{ 
          width: "100%", marginTop: "1rem", padding: "0.75rem", background: "transparent", 
          color: "#64748b", border: "none", cursor: "pointer", fontWeight: "600" 
        }}
      >
        ← Cancel and go back
      </button>
    </div>
  );
}

export default Payment;