// ecommerce-app/src/pages/AdminOrders.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../api/orderApi";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate();

  const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  
  const getStatusColor = (status) => {
    const colors = {
      pending: "#ffc107",
      processing: "#17a2b8",
      shipped: "#007bff",
      delivered: "#28a745",
      cancelled: "#dc3545"
    };
    return colors[status] || "#6c757d";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    
    try {
      const response = await orderApi.getAllAdmin();
      setOrders(response.data);
      setError("");
    } catch (err) {
      // ✅ ULTRA-SIMPLE error handling
      let errorMsg = "Failed to load orders";
      if (err.response) {
        errorMsg = err.response.data && err.response.data.message 
          ? err.response.data.message 
          : "Server error";
      }
      setError(errorMsg);
      console.error("Orders error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    
    try {
      await orderApi.updateStatus(orderId, newStatus);
      
      setOrders(orders.map(function(order) {
        if (order._id === orderId) {
          return Object.assign({}, order, { status: newStatus, updatedAt: new Date() });
        }
        return order;
      }));
    } catch (err) {
      alert("Failed to update order status");
      console.error("Update error:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading orders... 🔄</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "red" }}>❌ {error}</p>
        <button onClick={fetchOrders} style={{ padding: "0.5rem 1rem", marginTop: "1rem" }}>
          🔁 Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ margin: 0, color: "#333" }}>🛠️ Admin: Order Management</h1>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/admin/products")} style={{ padding: "0.75rem 1.5rem", background: "#6c757d", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" }}>
            🛍️ Manage Products
          </button>
          <button onClick={() => navigate("/admin/dashboard")} style={{ padding: "0.75rem 1.5rem", background: "#007bff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "500" }}>
            📊 Dashboard
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        {/* Table Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1.5fr 1fr", padding: "1rem 1.5rem", background: "#2c3e50", color: "white", fontWeight: "600", fontSize: "0.9rem" }}>
          <div>Order #</div>
          <div>Customer</div>
          <div>Date</div>
          <div>Total</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#666" }}>
            📦 No orders found
          </div>
        ) : (
          orders.map(function(order) {
            return (
              <div key={order._id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr 1.5fr 1fr", padding: "1rem 1.5rem", borderBottom: "1px solid #eee", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                {/* Order ID */}
                <div style={{ fontWeight: "600", color: "#333", fontSize: "0.9rem" }}>
                  #{order._id ? order._id.slice(-6).toUpperCase() : "N/A"}
                </div>

                {/* Customer */}
                <div style={{ color: "#666", fontSize: "0.9rem" }}>
                  <div style={{ fontWeight: "500" }}>{order.user && order.user.name ? order.user.name : "N/A"}</div>
                  <div style={{ fontSize: "0.85rem" }}>{order.user && order.user.email ? order.user.email : ""}</div>
                </div>

                {/* Date */}
                <div style={{ color: "#666", fontSize: "0.85rem" }}>
                  {formatDate(order.createdAt)}
                </div>

                {/* Total */}
                <div style={{ fontWeight: "600", color: "#28a745" }}>
                  ${order.totalPrice ? order.totalPrice.toFixed(2) : "0.00"}
                </div>

                {/* Status Dropdown */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <select
                    value={order.status || "pending"}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    disabled={updatingId === order._id}
                    style={{
                      padding: "0.4rem 0.75rem",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      fontSize: "0.85rem",
                      cursor: updatingId === order._id ? "not-allowed" : "pointer",
                      background: getStatusColor(order.status || "pending"),
                      color: "white",
                      fontWeight: "600",
                      textTransform: "capitalize"
                    }}
                  >
                    {validStatuses.map(function(status) {
                      return <option key={status} value={status}>{status}</option>;
                    })}
                  </select>
                </div>

                {/* View Button */}
                <div>
                  <button
                    onClick={() => alert("Order Details:\n" + JSON.stringify(order, null, 2))}
                    style={{ padding: "0.4rem 0.85rem", background: "#007bff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "500" }}
                  >
                    👁️ View
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AdminOrders;