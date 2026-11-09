import React, { useState, useEffect, useRef } from "react";
import { notificationApi } from "../api/notificationApi";
import { useNavigate } from "react-router-dom";

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications on mount and every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const [unread, count] = await Promise.all([
        notificationApi.getUnread(10),
        notificationApi.getUnreadCount(),
      ]);
      setNotifications(unread);
      setUnreadCount(count);
    } catch (error) {
      console.error("❌ Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    await notificationApi.markAsRead(notification._id);
    
    // Navigate based on type
    if (notification.metadata?.orderId) {
      navigate(`/admin/orders/${notification.metadata.orderId}`);
    } else if (notification.metadata?.userId) {
      navigate(`/admin/users/${notification.metadata.userId}`);
    }
    
    setIsOpen(false);
    fetchNotifications(); // Refresh
  };

  const handleMarkAllRead = async () => {
    await notificationApi.markAllAsRead();
    setUnreadCount(0);
    setNotifications([]);
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getIconForType = (type) => {
    switch (type) {
      case "user_activity": return "👤";
      case "order": return "📦";
      case "payment": return "💰";
      case "stock_alert": return "⚠️";
      default: return "🔔";
    }
  };

  const getColorForType = (type) => {
    switch (type) {
      case "user_activity": return "#3b82f6";
      case "order": return "#8b5cf6";
      case "payment": return "#10b981";
      case "stock_alert": return "#f59e0b";
      default: return "#6b7280";
    }
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0.5rem",
          borderRadius: "8px",
          transition: "background 0.2s",
          fontSize: "1.5rem",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "#f1f5f9"}
        onMouseLeave={(e) => e.currentTarget.style.background = "none"}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              background: "#ef4444",
              color: "white",
              fontSize: "0.7rem",
              fontWeight: "700",
              minWidth: "18px",
              height: "18px",
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              boxShadow: "0 2px 4px rgba(239,68,68,0.4)",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "0.5rem",
            width: "380px",
            maxHeight: "500px",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            border: "1px solid #e2e8f0",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "1rem",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#f8fafc",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "#1e293b" }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6366f1",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "6px",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#eef2ff"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔔</div>
                <p>No new notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: "1rem",
                    borderBottom: "1px solid #f1f5f9",
                    cursor: "pointer",
                    background: "white",
                    transition: "background 0.2s",
                    borderLeft: `4px solid ${getColorForType(notification.type)}`,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                >
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.5rem" }}>
                      {getIconForType(notification.type)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: "0 0 0.25rem 0",
                          fontWeight: "600",
                          color: "#1e293b",
                          fontSize: "0.9rem",
                        }}
                      >
                        {notification.title}
                      </p>
                      <p
                        style={{
                          margin: "0 0 0.25rem 0",
                          color: "#64748b",
                          fontSize: "0.85rem",
                          lineHeight: "1.4",
                        }}
                      >
                        {notification.message}
                      </p>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#94a3b8",
                        }}
                      >
                        {getTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "0.75rem",
              borderTop: "1px solid #e2e8f0",
              textAlign: "center",
              background: "#f8fafc",
            }}
          >
            <button
              onClick={() => navigate("/admin/notifications")}
              style={{
                background: "none",
                border: "none",
                color: "#6366f1",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;