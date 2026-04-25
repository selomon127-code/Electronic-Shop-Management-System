// ecommerce-app/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../api/orderApi";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await orderApi.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error("❌ Fetch stats error:", err);
      setError("Could not load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric"
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "#ffc107", processing: "#17a2b8",
      shipped: "#007bff", delivered: "#28a745", cancelled: "#dc3545"
    };
    return colors[status] || "#6c757d";
  };

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#666" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔄</div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#dc3545" }}>
        ❌ {error}
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "2rem",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div>
          <h1 style={{ margin: 0, color: "#333" }}>👨‍💼 Admin Dashboard</h1>
          <p style={{ margin: "0.5rem 0 0 0", color: "#666" }}>
            Overview of your store performance
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button 
            onClick={() => navigate("/admin/orders")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            📦 Manage Orders
          </button>
          <button 
            onClick={() => navigate("/admin/products")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            🛍️ Manage Products
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2rem"
      }}>
        {/* Total Revenue */}
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "1.5rem",
          borderRadius: "12px",
          color: "white",
          boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)"
        }}>
          <div style={{ fontSize: "0.9rem", opacity: 0.9, marginBottom: "0.5rem" }}>
            💰 Total Revenue
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "700" }}>
            {formatCurrency(stats?.totalRevenue || 0)}
          </div>
          <div style={{ fontSize: "0.85rem", opacity: 0.8, marginTop: "0.5rem" }}>
            From {stats?.totalOrders || 0} orders
          </div>
        </div>

        {/* Total Orders */}
        <div style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>
            📦 Total Orders
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#333" }}>
            {stats?.totalOrders || 0}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.5rem" }}>
            {stats?.pendingOrders || 0} pending
          </div>
        </div>

        {/* Customers */}
        <div style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>
            👥 Total Customers
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#333" }}>
            {stats?.uniqueCustomers || 0}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.5rem" }}>
            Unique buyers
          </div>
        </div>

        {/* Completed Orders */}
        <div style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>
            ✅ Completed Orders
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "700", color: "#28a745" }}>
            {stats?.completedOrders || 0}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.5rem" }}>
            Delivered successfully
          </div>
        </div>
      </div>

      {/* Sales by Status Chart */}
      <div style={{ 
        background: "white", 
        borderRadius: "12px", 
        padding: "1.5rem",
        marginBottom: "2rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ margin: "0 0 1.5rem 0", color: "#333" }}>📊 Sales by Status</h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {Object.entries(stats?.salesByStatus || {}).map(([status, amount]) => (
            <div 
              key={status}
              style={{
                flex: "1",
                minWidth: "150px",
                padding: "1rem",
                background: "#f8f9fa",
                borderRadius: "8px",
                textAlign: "center",
                borderLeft: `4px solid ${getStatusColor(status)}`
              }}
            >
              <div style={{ 
                fontSize: "0.85rem", 
                color: "#666", 
                textTransform: "capitalize",
                marginBottom: "0.5rem"
              }}>
                {status}
              </div>
              <div style={{ 
                fontSize: "1.25rem", 
                fontWeight: "700",
                color: getStatusColor(status)
              }}>
                {formatCurrency(amount)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div style={{ 
        background: "white", 
        borderRadius: "12px", 
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <div style={{ 
          padding: "1.5rem", 
          borderBottom: "1px solid #eee",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h3 style={{ margin: 0, color: "#333" }}>📋 Recent Orders</h3>
          <button 
            onClick={() => navigate("/admin/orders")}
            style={{
              padding: "0.5rem 1rem",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.9rem"
            }}
          >
            View All
          </button>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #eee" }}>Order #</th>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #eee" }}>Customer</th>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #eee" }}>Date</th>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "1px solid #eee" }}>Status</th>
                <th style={{ padding: "1rem", textAlign: "right", borderBottom: "1px solid #eee" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentOrders?.map((order) => (
                <tr key={order._id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "1rem", fontWeight: "600" }}>
                    #{order._id?.slice(-6).toUpperCase()}
                  </td>
                  <td style={{ padding: "1rem", color: "#666" }}>
                    {order.user?.email || "N/A"}
                  </td>
                  <td style={{ padding: "1rem", color: "#666" }}>
                    {formatDate(order.createdAt)}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{
                      padding: "0.35rem 0.85rem",
                      background: getStatusColor(order.status),
                      color: "white",
                      borderRadius: "20px",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      textTransform: "capitalize"
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right", fontWeight: "600", color: "#28a745" }}>
                    {formatCurrency(order.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;