// ecommerce-app/src/pages/OrderDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

function OrderDetail({ addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await API.get(`/orders/${id}`);
        setOrder(data);
      } catch (err) {
        console.error("Failed to fetch order:", err);
        setError(err.response?.data?.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
      return;
    }
    
    setCancelling(true);
    try {
      const { data } = await API.put(`/orders/${id}/cancel`);
      setOrder(data.order); // Update local state with cancelled order
      alert("✅ Order cancelled successfully. Stock has been restored.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const handleReorder = () => {
    if (!order) return;
    order.products.forEach(item => {
      if (item.product) {
        addToCart({
          _id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
          category: item.product.category,
          quantity: item.quantity
        });
      }
    });
    navigate("/cart");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div style={{ textAlign: "center", padding: "4rem" }}>Loading order details... 🔄</div>;
  if (error) return <div style={{ textAlign: "center", padding: "4rem", color: "#ef4444" }}>❌ {error}</div>;
  if (!order) return <div style={{ textAlign: "center", padding: "4rem" }}>Order not found.</div>;

  // Status Timeline Steps
  const steps = ["pending_payment", "pending", "processing", "shipped", "delivered"];
  const currentStepIndex = order.status === "cancelled" ? -1 : steps.indexOf(order.status);

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered": return "#10b981"; // green
      case "shipped": return "#3b82f6"; // blue
      case "processing": return "#f59e0b"; // yellow
      case "cancelled": return "#ef4444"; // red
      default: return "#64748b"; // gray
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
      {/* Header Actions (Hidden when printing) */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <Link to="/orders" style={{ color: "#6366f1", textDecoration: "none", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          ← Back to My Orders
        </Link>
        <button onClick={handlePrint} style={{ padding: "0.6rem 1.2rem", background: "#f1f5f9", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", color: "#475569" }}>
          🖨️ Print Invoice
        </button>
      </div>

      {/* Invoice Container */}
      <div style={{ background: "white", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        
        {/* Invoice Header */}
        <div style={{ padding: "2rem", borderBottom: "2px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.8rem", color: "#1e293b" }}>Invoice #{order._id.slice(-6).toUpperCase()}</h1>
            <p style={{ margin: "0.5rem 0 0 0", color: "#64748b" }}>
              Date: {new Date(order.createdAt).toLocaleDateString("en-ET", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ 
              display: "inline-block", padding: "0.5rem 1rem", borderRadius: "999px", 
              background: `${getStatusColor(order.status)}20`, color: getStatusColor(order.status),
              fontWeight: "700", fontSize: "0.9rem", textTransform: "capitalize"
            }}>
              {order.status.replace("_", " ")}
            </span>
            <p style={{ margin: "0.5rem 0 0 0", color: "#64748b", fontSize: "0.9rem" }}>
              Payment: <strong style={{ color: order.paymentStatus === "paid" ? "#10b981" : "#f59e0b" }}>{order.paymentStatus.toUpperCase()}</strong>
            </p>
          </div>
        </div>

        <div style={{ padding: "2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          {/* Customer Info */}
          <div>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Billed To</h3>
            <p style={{ margin: 0, fontWeight: "700", fontSize: "1.1rem", color: "#1e293b" }}>{order.user?.name}</p>
            <p style={{ margin: "0.25rem 0", color: "#475569" }}>{order.user?.email}</p>
            <p style={{ margin: "0.25rem 0", color: "#475569" }}>{order.user?.phone}</p>
          </div>

          {/* Shipping Info */}
          <div>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Ship To</h3>
            <p style={{ margin: 0, fontWeight: "700", fontSize: "1.1rem", color: "#1e293b" }}>{order.shippingAddress?.fullName}</p>
            <p style={{ margin: "0.25rem 0", color: "#475569" }}>{order.shippingAddress?.street}</p>
            <p style={{ margin: "0.25rem 0", color: "#475569" }}>{order.shippingAddress?.subcity}, {order.shippingAddress?.city}</p>
          </div>
        </div>

        {/* Status Timeline (Hidden if cancelled) */}
        {order.status !== "cancelled" && (
          <div style={{ padding: "0 2rem 2rem 2rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Order Status</h3>
            <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
              {/* Connecting Line */}
              <div style={{ position: "absolute", top: "15px", left: "0", right: "0", height: "3px", background: "#e2e8f0", zIndex: 0 }} />
              <div style={{ position: "absolute", top: "15px", left: "0", width: `${(currentStepIndex / (steps.length - 1)) * 100}%`, height: "3px", background: "#6366f1", zIndex: 0, transition: "width 0.5s ease" }} />
              
              {steps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                return (
                  <div key={step} style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                    <div style={{ 
                      width: "32px", height: "32px", borderRadius: "50%", 
                      background: isCompleted ? "#6366f1" : "#e2e8f0", 
                      color: isCompleted ? "white" : "#94a3b8",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: "700", fontSize: "0.9rem", marginBottom: "0.5rem",
                      border: isCurrent ? "3px solid #fff" : "none",
                      boxShadow: isCurrent ? "0 0 0 3px #6366f1" : "none"
                    }}>
                      {isCompleted ? "✓" : index + 1}
                    </div>
                    <span style={{ fontSize: "0.8rem", fontWeight: isCurrent ? "700" : "500", color: isCompleted ? "#6366f1" : "#94a3b8", textTransform: "capitalize" }}>
                      {step.replace("_", " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Products Table */}
        <div style={{ padding: "0 2rem 2rem 2rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Items</h3>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>Product</th>
                  <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#64748b", fontWeight: "600", textAlign: "center" }}>Qty</th>
                  <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#64748b", fontWeight: "600", textAlign: "right" }}>Price</th>
                  <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#64748b", fontWeight: "600", textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.products.map((item, idx) => (
                  <tr key={idx} style={{ borderTop: idx > 0 ? "1px solid #e2e8f0" : "none" }}>
                    <td style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                      <img src={item.product?.image || "https://placehold.co/60"} alt={item.name} style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover" }} />
                      <div>
                        <div style={{ fontWeight: "600", color: "#1e293b" }}>{item.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{item.product?.category}</div>
                      </div>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center", color: "#475569" }}>{item.quantity}</td>
                    <td style={{ padding: "1rem", textAlign: "right", color: "#475569" }}>{item.price.toLocaleString()} ETB</td>
                    <td style={{ padding: "1rem", textAlign: "right", fontWeight: "700", color: "#1e293b" }}>{(item.price * item.quantity).toLocaleString()} ETB</td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div style={{ padding: "0 2rem 2rem 2rem", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "300px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ color: "#64748b" }}>Subtotal</span>
              <span style={{ fontWeight: "600", color: "#1e293b" }}>{order.totalPrice.toLocaleString()} ETB</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ color: "#64748b" }}>Shipping</span>
              <span style={{ fontWeight: "600", color: "#1e293b" }}>Included</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem 0", fontSize: "1.2rem" }}>
              <span style={{ fontWeight: "800", color: "#1e293b" }}>Total</span>
              <span style={{ fontWeight: "800", color: "#10b981" }}>{order.totalPrice.toLocaleString()} ETB</span>
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="no-print" style={{ padding: "2rem", borderTop: "2px solid #f1f5f9", background: "#f8fafc", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          
          {/* Cancel Button (Only show if pending) */}
          {(order.status === "pending" || order.status === "pending_payment") && (
            <button 
              onClick={handleCancelOrder}
              disabled={cancelling}
              style={{ 
                flex: 1, padding: "1rem", background: cancelling ? "#cbd5e1" : "#fee2e2", color: "#dc2626", 
                border: "1px solid #fecaca", borderRadius: "12px", cursor: cancelling ? "not-allowed" : "pointer", 
                fontWeight: "700", fontSize: "1rem", transition: "all 0.2s" 
              }}
            >
              {cancelling ? "Cancelling..." : "❌ Cancel Order"}
            </button>
          )}

          {/* Reorder Button */}
          <button 
            onClick={handleReorder}
            style={{ 
              flex: 2, padding: "1rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", 
              border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "1rem",
              boxShadow: "0 4px 15px rgba(99, 102, 241, 0.3)", transition: "transform 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            🛒 Reorder All Items
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          nav, footer { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default OrderDetail;