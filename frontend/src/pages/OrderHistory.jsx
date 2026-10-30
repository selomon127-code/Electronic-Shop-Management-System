import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await API.get("/orders"); 
      // Ensure data is an array (sometimes backends return { orders: [...] })
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    
    try {
      await API.put(`/orders/${orderId}/cancel`);
      alert("Order cancelled successfully!");
      fetchOrders(); // Refresh list
    } catch (error) {
      alert(error.response?.data?.message || "Failed to cancel order");
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid": case "processing": case "shipped": return "bg-blue-100 text-blue-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": case "failed": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  if (loading) return <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading your orders... 🔄</div>;

  if (orders.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", background: "#f8fafc", borderRadius: "12px", border: "2px dashed #e2e8f0" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📦</div>
        <h3 style={{ color: "#1e293b", marginBottom: "0.5rem" }}>No orders yet</h3>
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>Start shopping to see your orders here!</p>
        <button 
          onClick={() => navigate("/products")}
          style={{ padding: "0.75rem 1.5rem", background: "#6366f1", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
      <h2 style={{ fontSize: "1.8rem", fontWeight: "700", color: "#1e293b", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        📦 Order History <span style={{ fontSize: "0.9rem", fontWeight: "500", color: "#64748b", background: "#e2e8f0", padding: "0.25rem 0.75rem", borderRadius: "999px" }}>{orders.length}</span>
      </h2>

      {orders.map((order) => (
        <div key={order._id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          {/* Order Header */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem", marginBottom: "1rem" }}>
            <div>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>Order ID</p>
              <p style={{ fontFamily: "monospace", fontWeight: "700", color: "#1e293b", margin: "0.25rem 0 0 0" }}>#{order._id.toString().slice(-6).toUpperCase()}</p>
            </div>
            <div>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>Date</p>
              <p style={{ fontWeight: "600", color: "#1e293b", margin: "0.25rem 0 0 0" }}>{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>Total</p>
              <p style={{ fontWeight: "700", fontSize: "1.1rem", color: "#6366f1", margin: "0.25rem 0 0 0" }}>{order.totalPrice?.toLocaleString() || 0} ETB</p>
            </div>
            <span style={{ 
              padding: "0.35rem 0.75rem", 
              borderRadius: "999px", 
              fontSize: "0.8rem", 
              fontWeight: "700", 
              textTransform: "uppercase",
              background: getStatusColor(order.paymentStatus || order.status).split(" ")[0],
              color: getStatusColor(order.paymentStatus || order.status).split(" ")[1]
            }}>
              {order.paymentStatus || order.status}
            </span>
          </div>

          {/* Order Items */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {(order.products || []).map((item, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <img 
                  src={item.product?.image || item.image || "https://placehold.co/60"} 
                  alt={item.product?.name || item.name || "Product"}
                  style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: "600", color: "#1e293b", margin: "0 0 0.25rem 0" }}>{item.product?.name || item.name || "Unknown Product"}</h4>
                  <p style={{ fontSize: "0.9rem", color: "#64748b", margin: 0 }}>Qty: {item.quantity} × {(item.product?.price || item.price || 0).toLocaleString()} ETB</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          {(order.status === "pending" || order.paymentStatus === "pending") && (
            <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={() => handleCancelOrder(order._id)}
                style={{ padding: "0.6rem 1.2rem", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem", transition: "background 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#fee2e2"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fef2f2"}
              >
                Cancel Order
              </button>
            </div>
          )
          }
        </div>
      ))}
    </div>
  );
};

export default OrderHistory;