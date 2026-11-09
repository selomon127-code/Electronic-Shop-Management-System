import React, { useState, useEffect } from "react";
import { notificationApi } from "../../api/notificationApi";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationApi.getRecent(100);
      setNotifications(data);
    } catch (error) {
      console.error("❌ Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = filter === "all"
    ? notifications
    : notifications.filter(n => n.type === filter);

  const getTypeLabel = (type) => {
    const labels = {
      user_activity: "User Activity",
      order: "Order",
      payment: "Payment",
      stock_alert: "Stock Alert",
      system: "System",
    };
    return labels[type] || type;
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.8rem", color: "#0f172a" }}>🔔 Notifications</h1>
        <p style={{ color: "#64748b", margin: "0.25rem 0 0 0" }}>
          View all system notifications and activity
        </p>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {["all", "user_activity", "order", "payment", "stock_alert"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            style={{
              padding: "0.5rem 1rem",
              background: filter === type ? "#6366f1" : "white",
              color: filter === type ? "white" : "#64748b",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.9rem",
              transition: "all 0.2s"
            }}
          >
            {type === "all" ? "All" : getTypeLabel(type)}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
          Loading notifications... 🔄
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔔</div>
          <p style={{ color: "#64748b" }}>No notifications found</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              style={{
                background: "white",
                padding: "1.25rem",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                borderLeft: `4px solid ${notification.isRead ? "#e2e8f0" : "#6366f1"}`,
                transition: "all 0.2s"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 0.5rem 0", color: "#1e293b", fontSize: "1.05rem" }}>
                    {notification.title}
                  </h3>
                  <p style={{ margin: "0 0 0.5rem 0", color: "#475569", lineHeight: "1.5" }}>
                    {notification.message}
                  </p>
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
                {!notification.isRead && (
                  <span
                    style={{
                      background: "#6366f1",
                      color: "white",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      whiteSpace: "nowrap"
                    }}
                  >
                    New
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;