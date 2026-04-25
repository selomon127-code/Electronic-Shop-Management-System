// ecommerce-app/src/pages/Payment.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { paymentApi } from "../api/paymentApi";  // ✅ USE paymentApi (NOT orderApi)
import PaymentMethods from "../components/PaymentMethods";

function Payment({ onOrderSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const state = location.state || {};
  const savedAddress = JSON.parse(localStorage.getItem("checkoutAddress") || "{}");
  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const orderCart = state.cart || [];
  const orderTotal = state.total || 0;
  const orderAddress = state.address || savedAddress;
  
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [paymentProof, setPaymentProof] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !orderCart || orderCart.length === 0) {
      navigate("/cart");
    }
  }, [orderCart, navigate]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!paymentMethod) {
      setError("Please select a payment method");
      return;
    }
    
    // ✅ FIX: ONLY require bank for bank_transfer (NOT for Chapa!)
    if (paymentMethod === "bank_transfer" && !selectedBank) {
      setError("Please select a bank for transfer");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const orderProducts = orderCart.map(item => ({
        product: item._id || String(item.id),
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity || 1
      }));

      console.log("🚀 Placing order:", {
        products: orderProducts.length,
        total: orderTotal.toFixed(2),
        paymentMethod,
        bank: selectedBank,
        phone: orderAddress.phone
      });

      // ✅ USE paymentApi.createOrder (supports Chapa redirect)
      const { data } = await paymentApi.createOrder({
        products: orderProducts,
        totalPrice: orderTotal,
        address: JSON.stringify(orderAddress),
        phone: orderAddress.phone || savedUser.phone,
        paymentMethod,
        // ✅ ONLY send bankName for bank_transfer
        bankName: paymentMethod === "bank_transfer" ? selectedBank : undefined,
        paymentProof: paymentMethod === "bank_transfer" ? paymentProof : undefined
      });

      console.log("✅ Order created:", data.order);
      
      localStorage.removeItem("checkoutAddress");
      if (onOrderSuccess) onOrderSuccess();
      
      // 🔹 NAVIGATE BASED ON PAYMENT METHOD
      if (paymentMethod === "cod") {
        navigate("/order-confirmation", { 
          state: { order: data.order, message: "Order placed! Pay when delivered. 💵" } 
        });
      } 
      else if (paymentMethod === "bank_transfer") {
        navigate("/order-confirmation", { 
          state: { 
            order: data.order, 
            message: "Order received! Please complete bank transfer to " + selectedBank,
            nextStep: "upload-proof"
          } 
        });
      }
      else if (paymentMethod === "chapa" && data.payment?.checkoutUrl) {
        // 🔹 CHAPA: Redirect to secure checkout
        console.log("🔗 Redirecting to Chapa:", data.payment.checkoutUrl);
        localStorage.setItem("pendingOrderId", data.order._id);
        window.location.href = data.payment.checkoutUrl;  // ✅ FULL PAGE REDIRECT
      }
      else if (paymentMethod === "telebirr" && data.payment?.success) {
        navigate("/order-confirmation", { 
          state: { order: data.order, message: "Check your phone for Telebirr prompt! 📱" } 
        });
      }
      else {
        navigate("/order-confirmation", { 
          state: { order: data.order, message: "Order placed successfully! 🎉" } 
        }
        );
      }

    } catch (err) {
      console.error("❌ Order error:", {
        status: err.response?.status,
        message: err.response?.data?.message
      });
      
      setError(err.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <button 
        onClick={() => navigate("/checkout")} 
        style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer", fontSize: "1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        ← Back to Address
      </button>

      <h1 style={{ margin: "0 0 1.5rem 0", color: "#333", fontSize: "1.8rem" }}>💳 Select Payment Method</h1>
      
      <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem", border: "1px solid #eee" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600" }}>
          <span>Order Total:</span>
          <span style={{ color: "#28a745", fontSize: "1.1rem" }}>{orderTotal?.toFixed(2)} ETB</span>
        </div>
        <div style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.25rem" }}>
          {orderCart?.length} item(s) • Delivery to: {orderAddress?.city}
        </div>
      </div>

      {error && (
        <p style={{ color: "#dc3545", background: "#ffe6e6", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>
          ❌ {error}
        </p>
      )}

      <form onSubmit={handlePlaceOrder}>
        <PaymentMethods 
          selectedMethod={paymentMethod}
          onMethodChange={setPaymentMethod}
          selectedBank={selectedBank}
          onBankSelect={setSelectedBank}
        />

        {paymentMethod === "bank_transfer" && selectedBank && (
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#333" }}>
              Upload Transfer Proof (Screenshot):
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPaymentProof(e.target.files[0]?.name)}
              style={{ width: "100%", padding: "0.5rem", border: "2px dashed #ddd", borderRadius: "8px" }}
            />
            {paymentProof && <p style={{ marginTop: "0.5rem", color: "#28a745", fontSize: "0.9rem" }}>✅ Selected: {paymentProof}</p>}
          </div>
        )}

        {/* Payment Method Info */}
        {paymentMethod === "chapa" && (
          <p style={{ padding: "0.75rem", background: "#e8f5e9", borderRadius: "6px", color: "#155724", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            🔒 You'll be redirected to Chapa's secure checkout. Pay with Card, Telebirr, or CBE Birr. <strong>No bank selection needed!</strong>
          </p>
        )}
        {paymentMethod === "telebirr" && (
          <p style={{ padding: "0.75rem", background: "#e8f5e9", borderRadius: "6px", color: "#155724", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            📱 You'll receive a USSD prompt. Enter your Telebirr PIN to complete payment.
          </p>
        )}
        {paymentMethod === "cod" && (
          <p style={{ padding: "0.75rem", background: "#fff3cd", borderRadius: "6px", color: "#856404", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            💵 Please have exact change ready. We'll contact you before delivery.
          </p>
        )}

        {/* ✅ FIX: Button enabled for Chapa WITHOUT bank selection */}
        <button 
          type="submit" 
          disabled={isLoading || !paymentMethod || (paymentMethod === "bank_transfer" && !selectedBank)} 
          style={{ 
            width: "100%", 
            padding: "1rem", 
            background: isLoading || !paymentMethod || (paymentMethod === "bank_transfer" && !selectedBank) ? "#ccc" : "#28a745", 
            color: "white", 
            border: "none", 
            borderRadius: "8px", 
            fontSize: "1.1rem", 
            fontWeight: "600", 
            cursor: isLoading || !paymentMethod || (paymentMethod === "bank_transfer" && !selectedBank) ? "not-allowed" : "pointer",
            transition: "background 0.2s"
          }}
        >
          {isLoading ? "Processing... 🔄" : `Pay ${orderTotal?.toFixed(2)} ETB`}
        </button>

        <p style={{ textAlign: "center", color: "#666", fontSize: "0.85rem", marginTop: "1rem" }}>
          🔒 Your payment is secure. We never store your card details.
        </p>
      </form>
    </div>
  );
}

export default Payment;