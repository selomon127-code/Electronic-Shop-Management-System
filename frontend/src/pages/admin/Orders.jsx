// ecommerce-app/src/pages/admin/Orders.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "../../api/adminApi";
import {
  AdminStyles, Icon, Kpi, Modal, PageHeader, StatusBadge, PaymentBadge, TableSkeleton, EmptyState, ErrorBanner,
  STATUS_META, money, num, formatDate, useDebounced, useFeedback,
} from "./adminUi";

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

const shortId = (id) => (id ? id.slice(-6).toUpperCase() : "—");

// Address may arrive as a JSON string or as an object.
function formatAddress(address) {
  if (!address) return "—";
  let value = address;
  if (typeof address === "string") {
    try {
      value = JSON.parse(address);
    } catch {
      return address;
    }
  }
  if (typeof value === "object" && value) {
    const text = Object.values(value).filter((v) => typeof v === "string" && v).join(", ");
    return text || "—";
  }
  return String(value);
}

function Orders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const debouncedSearch = useDebounced(search);
  const { toast, confirm, ui } = useFeedback();
  const requestId = useRef(0);

  const fetchOrders = useCallback(async () => {
    const id = ++requestId.current;
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (filter) params.status = filter;
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await adminApi.getOrders(params);
      if (id !== requestId.current) return; // a newer request replaced this one
      setOrders(data.orders || []);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err.response?.data?.message || t("admin.failed_load_orders"));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [filter, debouncedSearch, t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      await adminApi.updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)));
      setSelectedOrder((o) => (o && o._id === orderId ? { ...o, status: newStatus } : o));
      toast("success", t("admin.order_status_changed", { id: shortId(orderId), status: t(`admin.status_${newStatus}`, { defaultValue: newStatus }) }));
    } catch (err) {
      toast("error", err.response?.data?.message || err.message || t("admin.failed_update_status"));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (order) => {
    const ok = await confirm({
      title: t("admin.delete_order_title"),
      message: t("admin.delete_order_message", { id: shortId(order._id) }),
      confirmLabel: t("admin.delete_order"),
      danger: true,
    });
    if (!ok) return;

    try {
      await adminApi.deleteOrder(order._id);
      setOrders((prev) => prev.filter((o) => o._id !== order._id));
      toast("success", t("admin.order_deleted", { id: shortId(order._id) }));
    } catch (err) {
      toast("error", err.response?.data?.message || err.message || t("admin.failed_delete_order"));
    }
  };

  const totalValue = orders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  const unpaid = orders.filter((o) => o.paymentStatus !== "paid").length;

  return (
    <div className="ad">
      <AdminStyles />

      <PageHeader title={t("nav.orders")} subtitle={t("admin.manage_orders_subtitle")}>
        <button className="ad-btn" onClick={fetchOrders} disabled={loading}>
          <span className={loading ? "ad-spin" : ""}><Icon name="refresh" size={16} /></span>
          {t("admin.refresh")}
        </button>
      </PageHeader>

      <div className="ad-kpis">
        <Kpi label={t("admin.orders_in_view")} value={num(orders.length)} icon="orders" color="#4f46e5" bg="#e0e7ff" />
        <Kpi label={t("admin.value_in_view")} value={money(totalValue)} icon="revenue" color="#059669" bg="#d1fae5" />
        <Kpi label={t("admin.awaiting_payment")} value={num(unpaid)} icon="clock" color="#d97706" bg="#fef3c7" />
      </div>

      {/* Filters */}
      <div className="ad-card ad-toolbar">
        <div className="ad-search">
          <Icon name="search" size={16} />
          <input
            className="ad-input"
            type="text"
            placeholder={t("admin.search_orders")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t("admin.search_orders")}
          />
        </div>
        <div className="ad-chips" role="group" aria-label={t("admin.filter_status")}>
          <button className={`ad-chip ${filter === "" ? "on" : ""}`} onClick={() => setFilter("")}>{t("admin.all")}</button>
          {STATUSES.map((s) => (
            <button key={s} className={`ad-chip ${filter === s ? "on" : ""}`} onClick={() => setFilter(s)}>
              {t(`admin.status_${s}`)}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchOrders} />}

      {/* Table */}
      <div className="ad-card">
        {loading && orders.length === 0 ? (
          <TableSkeleton />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="orders"
            title={t("admin.no_orders_found")}
            text={filter || search ? t("admin.adjust_order_search") : t("admin.orders_empty")}
          />
        ) : (
          <div className="ad-table-wrap" style={{ opacity: loading ? 0.6 : 1, transition: "opacity .15s" }}>
            <table className="ad-table">
              <thead>
                <tr>
                  <th>{t("admin.order")}</th>
                  <th>{t("admin.customer")}</th>
                  <th>{t("admin.items")}</th>
                  <th>{t("admin.total")}</th>
                  <th>{t("admin.payment")}</th>
                  <th>{t("admin.status")}</th>
                  <th>{t("admin.date")}</th>
                  <th style={{ textAlign: "right" }}>{t("admin.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const meta = STATUS_META[order.status];
                  return (
                    <tr key={order._id}>
                      <td><span className="ad-mono">#{shortId(order._id)}</span></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.user?.name || t("admin.guest")}</div>
                        {order.user?.email && <div className="ad-muted ad-small">{order.user.email}</div>}
                      </td>
                      <td className="ad-muted">{t("admin.item_count", { count: order.products?.length || 0 })}</td>
                      <td style={{ fontWeight: 700 }}>{money(order.totalPrice)}</td>
                      <td><PaymentBadge status={order.paymentStatus} /></td>
                      <td>
                        <select
                          className="ad-select-pill"
                          value={order.status}
                          disabled={updatingId === order._id}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          aria-label={t("admin.status_for_order", { id: shortId(order._id) })}
                          style={{ background: meta?.bg || "#f1f5f9", color: meta?.fg || "#475569" }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{t(`admin.status_${s}`)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="ad-muted">{formatDate(order.createdAt)}</td>
                      <td>
                        <div className="ad-row-actions" style={{ justifyContent: "flex-end" }}>
                          <button className="ad-btn icon view" title={t("admin.view_details")} aria-label={t("admin.view_details")} onClick={() => setSelectedOrder(order)}>
                            <Icon name="eye" size={16} />
                          </button>
                          <button className="ad-btn icon del" title={t("admin.delete_order")} aria-label={t("admin.delete_order")} onClick={() => handleDeleteOrder(order)}>
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedOrder && (
        <Modal
          title={`Order #${shortId(selectedOrder._id)}`}
          onClose={() => setSelectedOrder(null)}
          footer={<button className="ad-btn primary" onClick={() => setSelectedOrder(null)}>{t("admin.close")}</button>}
        >
          <div style={{ display: "flex", gap: ".5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <StatusBadge status={selectedOrder.status} />
            <PaymentBadge status={selectedOrder.paymentStatus} />
            <span className="ad-muted ad-small" style={{ alignSelf: "center" }}>
              {t("admin.placed_on", { date: formatDate(selectedOrder.createdAt) })}
            </span>
          </div>

          <h4 className="ad-section-title">{t("admin.customer")}</h4>
          <dl className="ad-kv">
            <dt>{t("admin.name")}</dt><dd>{selectedOrder.user?.name || t("admin.guest")}</dd>
            <dt>{t("admin.email")}</dt><dd>{selectedOrder.user?.email || "—"}</dd>
            <dt>{t("admin.phone")}</dt><dd>{selectedOrder.phone || "—"}</dd>
          </dl>

          <h4 className="ad-section-title">{t("admin.shipping_address")}</h4>
          <p style={{ margin: "0 0 1.25rem", fontSize: ".9rem" }}>{formatAddress(selectedOrder.address)}</p>

          <h4 className="ad-section-title">{t("admin.items")}</h4>
          {selectedOrder.products?.map((item, i) => (
            <div key={i} className="ad-line">
              <span>{item.name || item.product?.name} × {item.quantity}</span>
              <span style={{ fontWeight: 600 }}>{money((Number(item.price) || 0) * (Number(item.quantity) || 0))}</span>
            </div>
          ))}
          <div className="ad-line total">
            <span>{t("admin.total")}</span>
            <span>{money(selectedOrder.totalPrice)}</span>
          </div>
        </Modal>
      )}

      {ui}
    </div>
  );
}

export default Orders;
