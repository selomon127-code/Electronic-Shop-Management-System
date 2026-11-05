// ecommerce-app/src/pages/OrderDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API from "../api/axios";

function OrderDetail({ addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
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
        setError(err.response?.data?.message || t("order_detail.load_failed"));
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, t]);

  const handleCancelOrder = async () => {
    if (!window.confirm(t("order_detail.confirm_cancel"))) {
      return;
    }
    
    setCancelling(true);
    try {
      const { data } = await API.put(`/orders/${id}/cancel`);
      setOrder(data.order); // Update local state with cancelled order
      alert(t("order_detail.cancelled_success"));
    } catch (err) {
      alert(err.response?.data?.message || t("order_detail.cancel_failed"));
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

  if (loading) return <div style={{ textAlign: "center", padding: "4rem" }}>{t("order_detail.loading")} 🔄</div>;
  if (error) return <div style={{ textAlign: "center", padding: "4rem", color: "#ef4444" }}>❌ {error}</div>;
  if (!order) return <div style={{ textAlign: "center", padding: "4rem" }}>{t("order_detail.not_found")}</div>;

  const isCashOnDelivery = order.paymentMethod === "cod";
  const steps = isCashOnDelivery
    ? ["pending", "processing", "shipped", "delivered"]
    : ["pending_payment", "processing", "shipped", "delivered"];
  const currentStepIndex = steps.indexOf(order.status);
  const activeStepIndex = currentStepIndex < 0
    ? order.status === "pending" ? 0 : 1
    : currentStepIndex;

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
          ← {t("order_detail.back")}
        </Link>
        <button onClick={handlePrint} style={{ padding: "0.6rem 1.2rem", background: "#f1f5f9", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", color: "#475569" }}>
          🖨️ {t("order_detail.print")}
        </button>
      </div>

      {/* Invoice Container */}
      <div style={{ background: "white", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        
        {/* Invoice Header */}
        <div style={{ padding: "2rem", borderBottom: "2px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.8rem", color: "#1e293b" }}>{t("order_detail.invoice")} #{order._id.slice(-6).toUpperCase()}</h1>
            <p style={{ margin: "0.5rem 0 0 0", color: "#64748b" }}>
              {t("order_detail.date")}: {new Date(order.createdAt).toLocaleDateString(i18n.language, { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ 
              display: "inline-block", padding: "0.5rem 1rem", borderRadius: "999px", 
              background: `${getStatusColor(order.status)}20`, color: getStatusColor(order.status),
              fontWeight: "700", fontSize: "0.9rem", textTransform: "capitalize"
            }}>
              {t(`order_status.${order.status}`, { defaultValue: order.status.replace("_", " ") })}
            </span>
            <p style={{ margin: "0.5rem 0 0 0", color: "#64748b", fontSize: "0.9rem" }}>
              {t("order_detail.payment")}: <strong style={{ color: order.paymentStatus === "paid" ? "#10b981" : "#f59e0b" }}>{t(`order_status.${order.paymentStatus}`, { defaultValue: order.paymentStatus.toUpperCase() })}</strong>
            </p>
          </div>
        </div>

        <div className="order-detail-info" style={{ padding: "2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          {/* Customer Info */}
          <div>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("order_detail.billed_to")}</h3>
            <p style={{ margin: 0, fontWeight: "700", fontSize: "1.1rem", color: "#1e293b" }}>{order.user?.name}</p>
            <p style={{ margin: "0.25rem 0", color: "#475569" }}>{order.user?.email}</p>
            <p style={{ margin: "0.25rem 0", color: "#475569" }}>{order.user?.phone}</p>
          </div>

          {/* Shipping Info */}
          <div>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("order_detail.ship_to")}</h3>
            <p style={{ margin: 0, fontWeight: "700", fontSize: "1.1rem", color: "#1e293b" }}>{order.shippingAddress?.fullName}</p>
            <p style={{ margin: "0.25rem 0", color: "#475569" }}>{order.shippingAddress?.street}</p>
            <p style={{ margin: "0.25rem 0", color: "#475569" }}>{order.shippingAddress?.subcity}, {order.shippingAddress?.city}</p>
          </div>
        </div>

        <section className="order-tracking" aria-label={t("order_detail.status")}>
          <div className="order-tracking__header">
            <div>
              <p className="order-tracking__eyebrow">{t("order_detail.status")}</p>
              <h2>{t("order_detail.tracking_title")}</h2>
              <p className="order-tracking__subtitle">{t("order_detail.tracking_subtitle")}</p>
            </div>
            <div className="order-tracking__summary">
              <span>{t("order_detail.current_status")}</span>
              <strong style={{
                color: getStatusColor(order.status),
                background: `${getStatusColor(order.status)}18`,
              }}>
                {t(`order_status.${order.status}`, { defaultValue: order.status.replace("_", " ") })}
              </strong>
            </div>
          </div>

          {order.status === "cancelled" ? (
            <div className="order-tracking__cancelled" role="status">
              <span aria-hidden="true">!</span>
              <div>
                <strong>{t("order_detail.cancelled_heading")}</strong>
                <p>{t("order_detail.cancelled_description")}</p>
              </div>
            </div>
          ) : (
            <>
              <ol
                className="order-tracking__steps"
                aria-label={t("order_detail.status")}
              >
                {steps.map((step, index) => {
                  const isComplete = index < activeStepIndex || order.status === "delivered";
                  const isCurrent = index === activeStepIndex;
                  return (
                    <li
                      key={step}
                      className={`order-tracking__step${isComplete ? " is-complete" : ""}${isCurrent ? " is-current" : ""}`}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      <span className="order-tracking__node" aria-hidden="true">
                        {isComplete ? "✓" : index + 1}
                      </span>
                      <span className="order-tracking__label">
                        {t(`order_status.${step}`, { defaultValue: step.replace("_", " ") })}
                      </span>
                      {isCurrent && (
                        <span className="order-tracking__state">{t("order_detail.current_status")}</span>
                      )}
                    </li>
                  );
                })}
              </ol>
              <p className="order-tracking__placed">
                <span aria-hidden="true">◷</span>
                {t("order_detail.placed_on", {
                  date: new Date(order.createdAt).toLocaleString(i18n.language, {
                    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                  }),
                })}
              </p>
            </>
          )}
        </section>

        {/* Products Table */}
        <div style={{ padding: "0 2rem 2rem 2rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("order_detail.items")}</h3>
          <div className="order-products-table" style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>{t("order_detail.product")}</th>
                  <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#64748b", fontWeight: "600", textAlign: "center" }}>{t("order_detail.qty")}</th>
                  <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#64748b", fontWeight: "600", textAlign: "right" }}>{t("order_detail.price")}</th>
                  <th style={{ padding: "1rem", fontSize: "0.85rem", color: "#64748b", fontWeight: "600", textAlign: "right" }}>{t("order_detail.total")}</th>
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
              <span style={{ color: "#64748b" }}>{t("order_detail.subtotal")}</span>
              <span style={{ fontWeight: "600", color: "#1e293b" }}>{Number(order.subtotal ?? order.totalPrice).toLocaleString()} ETB</span>
            </div>
            {order.coupon?.discount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #e2e8f0", color: "#15803d" }}>
                <span>Coupon ({order.coupon.code})</span>
                <span>−{Number(order.coupon.discount).toLocaleString()} ETB</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #e2e8f0" }}>
              <span style={{ color: "#64748b" }}>{t("order_detail.shipping")}</span>
              <span style={{ fontWeight: "600", color: "#1e293b" }}>{order.shippingFee == null ? t("order_detail.included") : order.shippingFee === 0 ? "FREE" : `${Number(order.shippingFee).toLocaleString()} ETB`}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem 0", fontSize: "1.2rem" }}>
              <span style={{ fontWeight: "800", color: "#1e293b" }}>{t("order_detail.total")}</span>
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
              {cancelling ? t("order_detail.cancelling") : `❌ ${t("order_detail.cancel")}`}
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
            🛒 {t("order_detail.reorder")}
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        .order-tracking {
          margin: 0 2rem 2rem;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: linear-gradient(135deg, #fff 0%, #f8faff 100%);
        }
        .order-tracking__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.75rem;
        }
        .order-tracking__eyebrow {
          margin: 0 0 .35rem;
          color: #64748b;
          font-size: .72rem;
          font-weight: 800;
          letter-spacing: .1em;
          text-transform: uppercase;
        }
        .order-tracking__header h2 {
          margin: 0;
          color: #172554;
          font-size: 1.25rem;
        }
        .order-tracking__subtitle {
          margin: .4rem 0 0;
          color: #64748b;
          font-size: .9rem;
        }
        .order-tracking__summary {
          display: grid;
          justify-items: end;
          gap: .4rem;
          flex-shrink: 0;
        }
        .order-tracking__summary > span {
          color: #64748b;
          font-size: .75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .06em;
        }
        .order-tracking__summary strong {
          padding: .45rem .8rem;
          border-radius: 999px;
          font-size: .85rem;
          text-transform: capitalize;
        }
        .order-tracking__steps {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .order-tracking__step {
          position: relative;
        }
        .order-tracking__step:not(:last-child)::after {
          position: absolute;
          top: 17px;
          right: 0;
          left: calc(50% + 18px);
          height: 3px;
          content: "";
          border-radius: 4px;
          background: #e2e8f0;
        }
        .order-tracking__step.is-complete:not(:last-child)::after {
          background: #4f46e5;
        }
        .order-tracking__step {
          z-index: 1;
          display: flex;
          min-width: 0;
          flex-direction: column;
          align-items: center;
          gap: .55rem;
          text-align: center;
        }
        .order-tracking__node {
          display: grid;
          width: 36px;
          height: 36px;
          place-items: center;
          border: 3px solid #fff;
          border-radius: 50%;
          background: #e2e8f0;
          color: #64748b;
          box-shadow: 0 0 0 1px #cbd5e1;
          font-size: .85rem;
          font-weight: 800;
        }
        .order-tracking__step.is-complete .order-tracking__node {
          background: #4f46e5;
          color: #fff;
          box-shadow: 0 0 0 1px #4f46e5;
        }
        .order-tracking__step.is-current .order-tracking__node {
          background: #fff;
          color: #4f46e5;
          box-shadow: 0 0 0 3px #4f46e5, 0 4px 12px #4f46e533;
        }
        .order-tracking__label {
          color: #64748b;
          font-size: .82rem;
          font-weight: 650;
          overflow-wrap: anywhere;
        }
        .order-tracking__step.is-complete .order-tracking__label,
        .order-tracking__step.is-current .order-tracking__label {
          color: #312e81;
        }
        .order-tracking__state {
          color: #4f46e5;
          font-size: .68rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .05em;
        }
        .order-tracking__placed {
          display: flex;
          align-items: center;
          gap: .5rem;
          margin: 1.5rem 0 0;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: .85rem;
        }
        .order-tracking__cancelled {
          display: flex;
          align-items: flex-start;
          gap: .85rem;
          padding: 1rem;
          border: 1px solid #fecaca;
          border-radius: 12px;
          background: #fff1f2;
          color: #991b1b;
        }
        .order-tracking__cancelled > span {
          display: grid;
          width: 28px;
          height: 28px;
          flex: 0 0 28px;
          place-items: center;
          border-radius: 50%;
          background: #fee2e2;
          font-weight: 900;
        }
        .order-tracking__cancelled p {
          margin: .25rem 0 0;
          color: #7f1d1d;
          font-size: .9rem;
        }
        @media (max-width: 600px) {
          .order-tracking {
            margin: 0 1rem 1.5rem;
            padding: 1.15rem;
          }
          .order-tracking__header {
            flex-direction: column;
          }
          .order-tracking__summary {
            justify-items: start;
          }
          .order-tracking__steps {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .order-tracking__step:not(:last-child)::after {
            top: 36px;
            right: auto;
            bottom: -17px;
            left: 17px;
            width: 3px;
            height: auto;
          }
          .order-tracking__step {
            min-height: 64px;
            flex-direction: row;
            justify-content: flex-start;
            gap: .85rem;
            text-align: left;
          }
          .order-tracking__label {
            flex: 1;
          }
        }
        @media print {
          .no-print { display: none !important; }
          .order-tracking { box-shadow: none; break-inside: avoid; }
          body { background: white; }
          nav, footer { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default OrderDetail;