// ecommerce-app/src/pages/OrderConfirmation.jsx
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { order, message } = location.state || {};

  useEffect(() => {
    if (!order) {
      navigate("/products"); // Redirect if no order data
    }
  }, [order, navigate]);

  if (!order) return <div>Loading...</div>;

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>🎉 Order Placed Successfully!</h1>
      <p>{message}</p>
      
      <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "8px", margin: "1rem 0" }}>
        <h3>Order #{order._id?.slice(-6)}</h3>
        <p>Total: ${order.totalPrice?.toFixed(2)}</p>
        <p>Items: {order.products?.length}</p>
      </div>
      
      <button onClick={() => navigate("/products")} style={{
        padding: "0.75rem 2rem",
        background: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer"
      }}>
        Continue Shopping
      </button>
    </div>
  );
}

export default OrderConfirmation;