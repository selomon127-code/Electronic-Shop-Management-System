import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import API from "../api/axios";

const OrderHistory = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [receiptError, setReceiptError] = useState("");

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

  const orderCode = (order) => order._id.toString().slice(-6).toUpperCase();

  const handleDownloadReceipt = async (order) => {
    setReceiptError("");
    setDownloadingId(order._id);
    try {
      const response = await API.get(`/orders/${order._id}/receipt`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Receipt_${orderCode(order)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      let message = t("orders.receipt_failed");
      const data = error.response?.data;
      if (data instanceof Blob) {
        try {
          const parsed = JSON.parse(await data.text());
          if (parsed.message) message = parsed.message;
        } catch {
          message = t("orders.receipt_failed");
        }
      } else if (typeof data?.message === "string") {
        message = data.message;
      }
      setReceiptError(message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(t("orders.cancel_confirm"))) return;
    
    try {
      await API.put(`/orders/${orderId}/cancel`);
      alert(t("orders.cancelled_success"));
      fetchOrders(); // Refresh list
    } catch (error) {
      alert(error.response?.data?.message || t("orders.cancel_failed"));
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

  if (loading) return <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>{t("orders.loading")} 🔄</div>;

  if (orders.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", background: "#f8fafc", borderRadius: "12px", border: "2px dashed #e2e8f0" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📦</div>
        <h3 style={{ color: "#1e293b", marginBottom: "0.5rem" }}>{t("profile.no_orders")}</h3>
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>{t("home.shop_now")}</p>
        <button 
          onClick={() => navigate("/products")}
          style={{ padding: "0.75rem 1.5rem", background: "#6366f1", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
        >
          {t("home.shop_now")}
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
      {receiptError && (
        <div role="alert" style={{ marginBottom: "1rem", padding: "0.85rem 1rem", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: "8px", fontWeight: "600" }}>
          {receiptError}
        </div>
      )}

      <h2 style={{ fontSize: "1.8rem", fontWeight: "700", color: "#1e293b", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        📦 {t("orders.history")} <span style={{ fontSize: "0.9rem", fontWeight: "500", color: "#64748b", background: "#e2e8f0", padding: "0.25rem 0.75rem", borderRadius: "999px" }}>{orders.length}</span>
      </h2>

      {orders.map((order) => (
        <div key={order._id} style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          {/* Order Header */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem", marginBottom: "1rem" }}>
            <div>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>{t("admin.order_id")}</p>
              <p style={{ fontFamily: "monospace", fontWeight: "700", color: "#1e293b", margin: "0.25rem 0 0 0" }}>#{orderCode(order)}</p>
            </div>
            <div>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>{t("orders.date")}</p>
              <p style={{ fontWeight: "600", color: "#1e293b", margin: "0.25rem 0 0 0" }}>{new Date(order.createdAt).toLocaleDateString(i18n.language)}</p>
            </div>
            <div>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>{t("orders.total")}</p>
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
              {t(`order_status.${order.paymentStatus || order.status}`, { defaultValue: order.paymentStatus || order.status })}
            </span>
          </div>

          {/* Order Items */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {(order.products || []).map((item, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <img 
                  src={item.product?.image || item.image || "https://placehold.co/60"} 
                  alt={item.product?.name || item.name || t("products.all")}
                  style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: "600", color: "#1e293b", margin: "0 0 0.25rem 0" }}>{item.product?.name || item.name || t("profile.unknown_product")}</h4>
                  <p style={{ fontSize: "0.9rem", color: "#64748b", margin: 0 }}>{t("profile.quantity")} {item.quantity} × {(item.product?.price || item.price || 0).toLocaleString(i18n.language)} ETB</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          {(() => {
            const isPending = order.status === "pending" || order.status === "pending_payment" || order.paymentStatus === "pending";
            const isDownloading = downloadingId === order._id;
            return (
              <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => handleDownloadReceipt(order)}
                  disabled={isDownloading}
                  aria-busy={isDownloading}
                  style={{
                    padding: "0.6rem 1.2rem",
                    background: isPending ? "white" : "#4f46e5",
                    color: isPending ? "#4f46e5" : "white",
                    border: isPending ? "1px solid #c7d2fe" : "none",
                    borderRadius: "8px",
                    cursor: isDownloading ? "wait" : "pointer",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                    opacity: isDownloading ? 0.7 : 1,
                  }}
                >
                  {isDownloading ? t("orders.downloading_receipt") : t("orders.download_receipt")}
                </button>
                {isPending && (
                  <button
                    type="button"
                    onClick={() => handleCancelOrder(order._id)}
                    style={{ padding: "0.6rem 1.2rem", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem", transition: "background 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#fee2e2"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#fef2f2"}
                  >
                    {t("orders.cancel")}
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      ))}
    </div>
  );
};

export default OrderHistory;