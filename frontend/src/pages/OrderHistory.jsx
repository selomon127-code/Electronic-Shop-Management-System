// ecommerce-app/src/pages/OrderHistory.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../api/orderApi";

// 🔹 Helper: Format date nicely
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

// 🔹 Helper: Get status badge color
const getStatusColor = (status) => {
  const colors = {
    pending: "#ffc107",      // 🟡 Yellow
    processing: "#17a2b8",   // 🔵 Cyan
    shipped: "#007bff",      // 🔵 Blue
    delivered: "#28a745",    // 🟢 Green
    cancelled: "#dc3545"     // 🔴 Red
  };
  return colors[status] || "#6c757d"; // Default gray
};

// 🔹 Helper: Parse and format address (handles JSON string or object)
const formatAddress = (addressInput) => {
  try {
    // Parse if it's a JSON string
    const addr = typeof addressInput === "string" 
      ? JSON.parse(addressInput) 
      : addressInput;
    
    // Build address parts for full display
    const parts = [];
    if (addr.street) parts.push(addr.street);
    if (addr.city) parts.push(addr.city);
    if (addr.state) parts.push(addr.state);
    if (addr.zip) parts.push(addr.zip);
    if (addr.country) parts.push(addr.country);
    
    // Build structured lines for display
    const lines = [];
    if (addr.street) lines.push({ label: "Street", value: addr.street });
    if (addr.city || addr.state) {
      const cityState = [addr.city, addr.state].filter(Boolean).join(", ");
      lines.push({ label: "City/State", value: cityState });
    }
    if (addr.zip) lines.push({ label: "ZIP", value: addr.zip });
    if (addr.country) lines.push({ label: "Country", value: addr.country });
    
    return {
      full: parts.join(", "),
      lines: lines,
      hasLocation: !!(addr.city || addr.state || addr.country)
    };
  // eslint-disable-next-line no-unused-vars
  } catch (err) {
    // Fallback if parsing fails
    return {
      full: addressInput || "No address provided",
      lines: [],
      hasLocation: false
    };
  }
};

// 🔹 Helper: Get country flag emoji (optional fun UX)
const getCountryFlag = (country) => {
  const flags = {
    "USA": "🇺🇸", "United States": "🇺🇸",
    "Ethiopia": "🇪🇹",
    "UK": "🇬🇧", "United Kingdom": "🇬🇧",
    "Canada": "🇨🇦",
    "Australia": "🇦🇺",
    "India": "🇮🇳",
    "Germany": "🇩🇪",
    "France": "🇫🇷"
  };
  return flags[country] || "🌍";
};

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await orderApi.getMyOrders();
        setOrders(data);
      } catch (err) {
        console.error("❌ Fetch orders error:", err);
        setError("Could not load order history. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#666" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔄</div>
        <p>Loading your order history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: "2rem", 
        textAlign: "center", 
        color: "#dc3545",
        background: "#ffe6e6",
        borderRadius: "8px",
        margin: "1rem"
      }}>
        ❌ {error}
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "2rem",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <h1 style={{ margin: 0, color: "#333" }}>📦 My Order History</h1>
        <button 
          onClick={() => navigate("/products")}
          style={{
            padding: "0.75rem 1.5rem",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          🛍️ Continue Shopping
        </button>
      </div>

      {/* Empty State */}
      {orders.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "4rem 2rem", 
          background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
          borderRadius: "12px",
          border: "2px dashed #dee2e6"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛍️</div>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#333" }}>No orders yet</h3>
          <p style={{ margin: "0 0 1.5rem 0", color: "#666" }}>
            Start shopping to see your orders here!
          </p>
          <button 
            onClick={() => navigate("/products")}
            style={{
              padding: "0.75rem 2rem",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "500"
            }}
          >
            Browse Products
          </button>
        </div>
      ) : (
        /* Orders List */
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {orders.map((order) => {
            const { full: addressFull, lines: addressLines, hasLocation } = formatAddress(order.address);
            const isExpanded = expandedOrder === order._id;
            
            return (
              <div 
                key={order._id} 
                style={{
                  background: "white",
                  border: "1px solid #dee2e6",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  transition: "box-shadow 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"}
              >
                {/* Order Header */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginBottom: "1rem",
                  flexWrap: "wrap",
                  gap: "1rem"
                }}>
                  <div>
                    <strong style={{ fontSize: "1.1rem", color: "#333" }}>
                      Order #{order._id?.slice(-6).toUpperCase()}
                    </strong>
                    <br />
                    <small style={{ color: "#6c757d" }}>
                      {formatDate(order.createdAt)}
                    </small>
                  </div>
                  
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "1rem",
                    flexWrap: "wrap"
                  }}>
                    {/* Status Badge */}
                    <span style={{
                      padding: "0.35rem 0.85rem",
                      background: getStatusColor(order.status),
                      color: "white",
                      borderRadius: "20px",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      textTransform: "capitalize",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}>
                      {order.status}
                    </span>
                    
                    {/* Total Price */}
                    <strong style={{ 
                      color: "#28a745", 
                      fontSize: "1.1rem",
                      minWidth: "80px",
                      textAlign: "right"
                    }}>
                      ${order.totalPrice?.toFixed(2)}
                    </strong>
                    
                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                      style={{
                        padding: "0.5rem 1rem",
                        background: isExpanded ? "#6c757d" : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "500",
                        fontSize: "0.9rem",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={(e) => e.target.style.background = isExpanded ? "#5a6268" : "#0056b3"}
                      onMouseLeave={(e) => e.target.style.background = isExpanded ? "#6c757d" : "#007bff"}
                    >
                      {isExpanded ? "▲ Hide Details" : "▼ View Details"}
                    </button>
                  </div>
                </div>

                {/* Expandable Order Details */}
                {isExpanded && (
                  <div style={{ 
                    borderTop: "1px solid #eee", 
                    paddingTop: "1.25rem",
                    marginTop: "0.5rem"
                  }}>
                    {/* Items List */}
                    <h4 style={{ 
                      margin: "0 0 1rem 0", 
                      color: "#333",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}>
                      📦 Items ({order.products?.length || 0})
                    </h4>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {order.products?.map((item, idx) => (
                        <div 
                          key={idx} 
                          style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "1rem",
                            padding: "0.75rem",
                            background: "#f8f9fa",
                            borderRadius: "8px",
                            border: "1px solid #e9ecef"
                          }}
                        >
                          <img 
                            src={item.image || "https://picsum.photos/seed/prod/60/60"} 
                            alt={item.name}
                            style={{ 
                              width: "60px", 
                              height: "60px", 
                              objectFit: "cover", 
                              borderRadius: "6px",
                              background: "#fff"
                            }}
                            onError={(e) => {
                              e.target.src = "https://picsum.photos/seed/prod/60/60";
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <strong style={{ color: "#333" }}>{item.name}</strong>
                            <br />
                            <small style={{ color: "#6c757d" }}>
                              Qty: {item.quantity} × ${item.price?.toFixed(2)}
                            </small>
                          </div>
                          <strong style={{ color: "#28a745", minWidth: "70px", textAlign: "right" }}>
                            ${(item.price * item.quantity)?.toFixed(2)}
                          </strong>
                        </div>
                      ))}
                    </div>

                    {/* Structured Address Display */}
                    <div style={{ 
                      marginTop: "1.5rem", 
                      padding: "1.25rem", 
                      background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                      borderRadius: "8px",
                      border: "1px solid #dee2e6"
                    }}>
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "0.5rem", 
                        marginBottom: "1rem",
                        paddingBottom: "0.75rem",
                        borderBottom: "1px solid #dee2e6"
                      }}>
                        <span style={{ fontSize: "1.3rem" }}>🚚</span>
                        <strong style={{ color: "#333", fontSize: "1.05rem" }}>Shipping Address</strong>
                      </div>
                      
                      {/* Structured address lines */}
                      {addressLines.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                          {addressLines.map((line, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                display: "flex", 
                                justifyContent: "space-between",
                                alignItems: "flex-start"
                              }}
                            >
                              <span style={{ 
                                color: "#6c757d", 
                                fontSize: "0.9rem",
                                fontWeight: "500",
                                minWidth: "90px"
                              }}>
                                {line.label}:
                              </span>
                              <span style={{ 
                                fontWeight: "600", 
                                color: "#212529",
                                textAlign: "right",
                                flex: 1,
                                marginLeft: "1rem"
                              }}>
                                {line.label === "Country" 
                                  ? `${getCountryFlag(line.value)} ${line.value}` 
                                  : line.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ margin: 0, color: "#6c757d", fontStyle: "italic" }}>
                          {addressFull}
                        </p>
                      )}
                      
                      {/* Optional: View on Google Maps */}
                      {hasLocation && (
                        <div style={{ 
                          marginTop: "1rem", 
                          paddingTop: "0.75rem", 
                          borderTop: "1px dashed #dee2e6" 
                        }}>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressFull)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#007bff",
                              textDecoration: "none",
                              fontSize: "0.9rem",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              fontWeight: "500",
                              padding: "0.35rem 0.6rem",
                              borderRadius: "4px",
                              transition: "background 0.2s"
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={(e) => e.target.style.background = "rgba(0,123,255,0.1)"}
                            onMouseLeave={(e) => e.target.style.background = "transparent"}
                          >
                            🗺️ View on Google Maps
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Payment Method */}
                    <div style={{ 
                      marginTop: "1rem", 
                      padding: "0.75rem 1.25rem", 
                      background: "#f8f9fa", 
                      borderRadius: "6px",
                      border: "1px solid #e9ecef",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <span style={{ color: "#6c757d", fontWeight: "500" }}>💳 Payment Method</span>
                      <span style={{ 
                        fontWeight: "600", 
                        color: "#212529",
                        textTransform: "uppercase",
                        fontSize: "0.95rem"
                      }}>
                        {order.paymentMethod || "card"}
                      </span>
                    </div>

                    {/* Order Actions (Optional) */}
                    <div style={{ 
                      marginTop: "1.25rem", 
                      paddingTop: "1rem", 
                      borderTop: "1px solid #eee",
                      display: "flex",
                      gap: "0.75rem",
                      flexWrap: "wrap"
                    }}>
                      <button
                        onClick={() => {
                          // Optional: Reorder feature
                          alert("Reorder feature coming soon! 🛒");
                        }}
                        style={{
                          padding: "0.6rem 1.2rem",
                          background: "#28a745",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "500",
                          fontSize: "0.9rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem"
                        }}
                      >
                        🔄 Reorder
                      </button>
                      <button
                        onClick={() => {
                          // Optional: Contact support
                          alert("Need help? Contact support at support@example.com");
                        }}
                        style={{
                          padding: "0.6rem 1.2rem",
                          background: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "500",
                          fontSize: "0.9rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem"
                        }}
                      >
                        💬 Need Help?
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;