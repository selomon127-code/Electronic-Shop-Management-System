// ecommerce-app/src/pages/OrderConfirmation.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import API from "../api/axios";

function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      
      try {
        // Fetch the order details from the backend
        const { data } = await API.get(`/orders/${orderId}`);
        setOrder(data);
      } catch (err) {
        console.error("Failed to fetch order details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return <div style={{ textAlign: "center", padding: "4rem" }}>Verifying your order... 🔄</div>;
  }

  // If no orderId was passed in the URL
  if (!orderId) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <h2>No order details found.</h2>
        <Link to="/products" style={{ color: "#6366f1", fontWeight: "600" }}>← Back to Products</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "4rem 2rem", textAlign: "center" }}>
      {/* Success Icon */}
      <div style={{ 
        width: "100px", height: "100px", borderRadius: "50%", 
        background: "#d1fae5", color: "#10b981", 
        display: "flex", alignItems: "center", justifyContent: "center", 
        fontSize: "3rem", margin: "0 auto 1.5rem auto" 
      }}>
        ✓
      </div>

      <h1 style={{ fontSize: "2.5rem", color: "#1e293b", marginBottom: "1rem" }}>
        {order?.paymentMethod === 'cod' ? 'Order Placed Successfully!' : 'Payment Successful!'}
      </h1>
      
      <p style={{ fontSize: "1.1rem", color: "#64748b", marginBottom: "2rem" }}>
        Thank you for shopping with E-Shop Ethiopia. 
        {order?.paymentMethod === 'cod' 
          ? " Please have the exact cash ready when our delivery agent arrives." 
          : " Your payment has been verified and your order is being processed."}
      </p>

      {/* Order Details Box */}
      {order && (
        <div style={{ 
          background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", 
          padding: "2rem", marginBottom: "2rem", textAlign: "left" 
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
            <div>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>Order Number</p>
              <p style={{ margin: "0.25rem 0 0 0", fontWeight: "700", fontSize: "1.2rem", color: "#1e293b" }}>
                #{order._id.slice(-6).toUpperCase()}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>Total Paid</p>
              <p style={{ margin: "0.25rem 0 0 0", fontWeight: "700", fontSize: "1.2rem", color: "#10b981" }}>
                {order.totalPrice.toLocaleString()} ETB
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>Payment Method</p>
              <p style={{ margin: "0.25rem 0 0 0", fontWeight: "600", color: "#1e293b", textTransform: "capitalize" }}>
                {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Chapa (Online)'}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>Estimated Delivery</p>
              <p style={{ margin: "0.25rem 0 0 0", fontWeight: "600", color: "#1e293b" }}>
                3 - 5 Business Days
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <Link 
          to="/orders" 
          style={{ 
            padding: "1rem 2rem", background: "#f1f5f9", color: "#475569", 
            textDecoration: "none", borderRadius: "12px", fontWeight: "700",
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}
        >
          📦 View My Orders
        </Link>
        
        <Link 
          to="/products" 
          style={{ 
            padding: "1rem 2rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", 
            textDecoration: "none", borderRadius: "12px", fontWeight: "700",
            boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)",
            transition: "transform 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          🛍️ Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default OrderConfirmation;