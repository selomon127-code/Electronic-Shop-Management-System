// ecommerce-app/src/pages/admin/Dashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { adminApi } from "../../api/adminApi";

/* ----------------------------- Helpers ----------------------------- */

const STATUS_META = {
  pending: { color: "#d97706", bg: "#fef3c7", fg: "#92400e", label: "Pending" },
  processing: { color: "#2563eb", bg: "#dbeafe", fg: "#1e40af", label: "Processing" },
  shipped: { color: "#7c3aed", bg: "#ede9fe", fg: "#5b21b6", label: "Shipped" },
  delivered: { color: "#059669", bg: "#d1fae5", fg: "#065f46", label: "Delivered" },
  cancelled: { color: "#dc2626", bg: "#fee2e2", fg: "#991b1b", label: "Cancelled" },
};
const FALLBACK_META = { color: "#64748b", bg: "#f1f5f9", fg: "#475569", label: "" };

const money = (n) =>
  `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n) || 0)} ETB`;

const num = (n) => new Intl.NumberFormat("en-US").format(Number(n) || 0);

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

/* ------------------------------ Icons ------------------------------ */

const Icon = ({ d, size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  orders: ["M21 8l-9-5-9 5v8l9 5 9-5V8z", "M3 8l9 5 9-5", "M12 13v8"],
  revenue: ["M12 1v22", "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"],
  calendar: ["M3 6h18v15H3z", "M8 2v4", "M16 2v4", "M3 10h18"],
  trend: ["M3 17l6-6 4 4 8-8", "M15 7h6v6"],
  users: [
    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M23 21v-2a4 4 0 0 0-3-3.87",
    "M16 3.13a4 4 0 0 1 0 7.75",
  ],
  products: ["M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z", "M3 6h18", "M16 10a4 4 0 0 1-8 0"],
  clock: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 6v6l4 2"],
  shield: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
  refresh: ["M23 4v6h-6", "M1 20v-6h6", "M3.5 9a9 9 0 0 1 15-3.4L23 10", "M1 14l4.5 4.4A9 9 0 0 0 20.5 15"],
  arrow: ["M5 12h14", "M12 5l7 7-7 7"],
  store: ["M3 9l1-5h16l1 5", "M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0", "M5 12v8h14v-8"],
  alert: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 8v4", "M12 16h.01"],
};

/* ------------------------------ Styles ----------------------------- */

const CSS = `
.db { --ink:#0f172a; --muted:#64748b; --line:#e2e8f0; --bg:#f8fafc; --brand:#4f46e5;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--ink); max-width: 1280px; margin: 0 auto; }
.db * { box-sizing: border-box; }
.db-head { display:flex; justify-content:space-between; align-items:flex-end; gap:1rem; flex-wrap:wrap; margin-bottom:1.75rem; }
.db-title { margin:0; font-size:1.65rem; font-weight:700; letter-spacing:-0.02em; }
.db-sub { margin:.3rem 0 0; color:var(--muted); font-size:.95rem; }
.db-btn { display:inline-flex; align-items:center; gap:.5rem; padding:.6rem 1rem; border-radius:10px;
  border:1px solid var(--line); background:#fff; color:var(--ink); font-weight:600; font-size:.875rem;
  cursor:pointer; transition:all .15s; text-decoration:none; }
.db-btn:hover { border-color:#cbd5e1; box-shadow:0 1px 3px rgba(15,23,42,.08); }
.db-btn.primary { background:var(--brand); border-color:var(--brand); color:#fff; }
.db-btn.primary:hover { background:#4338ca; }
.db-btn:disabled { opacity:.6; cursor:not-allowed; }
.db-spin { animation: db-rot 1s linear infinite; }
@keyframes db-rot { to { transform: rotate(360deg); } }

.db-grid-kpi { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.5rem; }
.db-card { background:#fff; border:1px solid var(--line); border-radius:14px; box-shadow:0 1px 2px rgba(15,23,42,.04); }
.db-kpi { padding:1.15rem 1.25rem; display:flex; justify-content:space-between; align-items:flex-start; gap:.75rem;
  transition: box-shadow .15s, transform .15s; }
.db-kpi:hover { box-shadow:0 6px 16px rgba(15,23,42,.07); transform:translateY(-1px); }
.db-kpi-label { color:var(--muted); font-size:.8rem; font-weight:600; text-transform:uppercase; letter-spacing:.04em; }
.db-kpi-value { margin-top:.45rem; font-size:1.55rem; font-weight:700; letter-spacing:-0.02em; line-height:1.15; word-break:break-word; }
.db-kpi-icon { flex-shrink:0; width:42px; height:42px; border-radius:11px; display:flex; align-items:center; justify-content:center; }

.db-row { display:grid; grid-template-columns:1.2fr 1fr; gap:1rem; margin-bottom:1.5rem; }
.db-panel { padding:1.4rem; }
.db-panel-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.1rem; }
.db-panel-title { margin:0; font-size:1rem; font-weight:700; }
.db-link { display:inline-flex; align-items:center; gap:.35rem; color:var(--brand); font-size:.85rem; font-weight:600; text-decoration:none; }
.db-link:hover { text-decoration:underline; }

.db-donut-wrap { display:flex; align-items:center; gap:1.75rem; flex-wrap:wrap; }
.db-donut { position:relative; width:170px; height:170px; flex-shrink:0; }
.db-donut-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.db-donut-center b { font-size:1.7rem; line-height:1; }
.db-donut-center span { color:var(--muted); font-size:.75rem; margin-top:.25rem; }
.db-legend { flex:1; min-width:200px; display:grid; gap:.85rem; }
.db-legend-top { display:flex; justify-content:space-between; align-items:center; font-size:.875rem; margin-bottom:.35rem; }
.db-legend-name { display:flex; align-items:center; gap:.5rem; font-weight:600; }
.db-dot { width:9px; height:9px; border-radius:50%; }
.db-bar { height:6px; border-radius:99px; background:#f1f5f9; overflow:hidden; }
.db-bar > i { display:block; height:100%; border-radius:99px; transition:width .5s ease; }

.db-actions { display:grid; gap:.65rem; }
.db-action { display:flex; align-items:center; justify-content:space-between; gap:.75rem; padding:.85rem 1rem;
  border:1px solid var(--line); border-radius:11px; color:var(--ink); text-decoration:none; font-weight:600; font-size:.9rem;
  transition:all .15s; background:#fff; }
.db-action:hover { border-color:var(--brand); background:#eef2ff; color:var(--brand); }
.db-action-l { display:flex; align-items:center; gap:.75rem; }
.db-action-ic { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; }

.db-table-wrap { overflow-x:auto; margin:0 -1.4rem -1.4rem; }
.db-table { width:100%; border-collapse:collapse; min-width:640px; }
.db-table th { text-align:left; padding:.7rem 1.4rem; font-size:.72rem; font-weight:700; color:var(--muted);
  text-transform:uppercase; letter-spacing:.05em; background:var(--bg); border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
.db-table td { padding:.9rem 1.4rem; font-size:.9rem; border-bottom:1px solid #f1f5f9; }
.db-table tbody tr:last-child td { border-bottom:none; }
.db-table tbody tr:hover { background:#fafbff; }
.db-id { font-weight:700; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size:.85rem; }
.db-badge { display:inline-flex; align-items:center; gap:.4rem; padding:.22rem .65rem; border-radius:99px; font-size:.75rem; font-weight:700; }
.db-badge i { width:6px; height:6px; border-radius:50%; background:currentColor; }
.db-avatar { display:inline-flex; width:28px; height:28px; border-radius:50%; background:#e0e7ff; color:#4338ca;
  align-items:center; justify-content:center; font-size:.75rem; font-weight:700; margin-right:.6rem; vertical-align:middle; }
.db-empty { text-align:center; color:var(--muted); padding:2.5rem 1rem; }

.db-skel { background:linear-gradient(90deg,#eef2f7 25%,#f8fafc 50%,#eef2f7 75%); background-size:200% 100%;
  animation: db-shim 1.3s infinite; border-radius:8px; }
@keyframes db-shim { to { background-position:-200% 0; } }

.db-error { display:flex; align-items:center; gap:1rem; padding:1.1rem 1.25rem; background:#fef2f2; border:1px solid #fecaca;
  color:#991b1b; border-radius:12px; }
.db-error span { flex:1; font-weight:500; }

@media (max-width:1100px) { .db-grid-kpi { grid-template-columns:repeat(2,1fr); } .db-row { grid-template-columns:1fr; } }
@media (max-width:560px) { .db-grid-kpi { grid-template-columns:1fr; } .db-title { font-size:1.4rem; } }
`;

/* --------------------------- Sub-components ------------------------ */

function KpiCard({ label, value, icon, color, bg }) {
  return (
    <div className="db-card db-kpi">
      <div>
        <div className="db-kpi-label">{label}</div>
        <div className="db-kpi-value">{value}</div>
      </div>
      <div className="db-kpi-icon" style={{ background: bg, color }}>
        <Icon d={ICONS[icon]} />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || FALLBACK_META;
  return (
    <span className="db-badge" style={{ background: m.bg, color: m.fg }}>
      <i />
      {m.label || status || "—"}
    </span>
  );
}

function PaymentBadge({ status }) {
  const paid = status === "paid";
  return (
    <span
      className="db-badge"
      style={{ background: paid ? "#d1fae5" : "#fef3c7", color: paid ? "#065f46" : "#92400e" }}
    >
      <i />
      {paid ? "Paid" : status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unpaid"}
    </span>
  );
}

function StatusDonut({ ordersByStatus }) {
  const entries = Object.entries(ordersByStatus || {});
  const total = entries.reduce((s, [, c]) => s + (Number(c) || 0), 0);
  const R = 62;
  const C = 2 * Math.PI * R;

  let offset = 0;
  const segments = entries.map(([status, count]) => {
    const frac = total ? (Number(count) || 0) / total : 0;
    const seg = { status, count, len: frac * C, offset };
    offset += frac * C;
    return seg;
  });

  return (
    <div className="db-donut-wrap">
      <div className="db-donut">
        <svg viewBox="0 0 170 170" width="170" height="170" role="img" aria-label="Orders by status">
          <g transform="rotate(-90 85 85)">
            <circle cx="85" cy="85" r={R} fill="none" stroke="#f1f5f9" strokeWidth="16" />
            {total > 0 &&
              segments.map((s) => (
                <circle
                  key={s.status}
                  cx="85"
                  cy="85"
                  r={R}
                  fill="none"
                  stroke={(STATUS_META[s.status] || FALLBACK_META).color}
                  strokeWidth="16"
                  strokeDasharray={`${Math.max(s.len - 2, 0)} ${C}`}
                  strokeDashoffset={-s.offset}
                />
              ))}
          </g>
        </svg>
        <div className="db-donut-center">
          <b>{num(total)}</b>
          <span>Total orders</span>
        </div>
      </div>

      <div className="db-legend">
        {segments.map((s) => {
          const m = STATUS_META[s.status] || FALLBACK_META;
          const pct = total ? Math.round(((Number(s.count) || 0) / total) * 100) : 0;
          return (
            <div key={s.status}>
              <div className="db-legend-top">
                <span className="db-legend-name">
                  <span className="db-dot" style={{ background: m.color }} />
                  {m.label || s.status}
                </span>
                <span>
                  <b>{num(s.count)}</b> <span style={{ color: "#64748b" }}>· {pct}%</span>
                </span>
              </div>
              <div className="db-bar">
                <i style={{ width: `${pct}%`, background: m.color }} />
              </div>
            </div>
          );
        })}
        {segments.length === 0 && <div className="db-empty">No order data</div>}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="db">
      <style>{CSS}</style>
      <div className="db-skel" style={{ height: 34, width: 220, marginBottom: 10 }} />
      <div className="db-skel" style={{ height: 16, width: 340, marginBottom: 28 }} />
      <div className="db-grid-kpi">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="db-skel" style={{ height: 94, borderRadius: 14 }} />
        ))}
      </div>
      <div className="db-row">
        <div className="db-skel" style={{ height: 280, borderRadius: 14 }} />
        <div className="db-skel" style={{ height: 280, borderRadius: 14 }} />
      </div>
      <div className="db-skel" style={{ height: 320, borderRadius: 14 }} />
    </div>
  );
}

/* ------------------------------ Main ------------------------------- */

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError("");
      const { data } = await adminApi.getDashboard();
      setData(data);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const statCards = useMemo(() => {
    const s = data?.stats || {};
    return [
      { label: "Total Revenue", value: money(s.totalRevenue), icon: "revenue", color: "#059669", bg: "#d1fae5" },
      { label: "Total Orders", value: num(s.totalOrders), icon: "orders", color: "#4f46e5", bg: "#e0e7ff" },
      { label: "Today's Revenue", value: money(s.todayRevenue), icon: "trend", color: "#2563eb", bg: "#dbeafe" },
      { label: "Today's Orders", value: num(s.todayOrders), icon: "calendar", color: "#d97706", bg: "#fef3c7" },
      { label: "Pending Payment", value: money(s.pendingRevenue), icon: "clock", color: "#dc2626", bg: "#fee2e2" },
      { label: "Total Users", value: num(s.totalUsers), icon: "users", color: "#7c3aed", bg: "#ede9fe" },
      { label: "Total Products", value: num(s.totalProducts), icon: "products", color: "#db2777", bg: "#fce7f3" },
      { label: "Admins", value: num(s.totalAdmins), icon: "shield", color: "#0d9488", bg: "#ccfbf1" },
    ];
  }, [data]);

  if (loading) return <DashboardSkeleton />;

  if (error && !data) {
    return (
      <div className="db">
        <style>{CSS}</style>
        <div className="db-error" role="alert">
          <Icon d={ICONS.alert} size={22} />
          <span>{error}</span>
          <button className="db-btn" onClick={() => fetchDashboard()}>
            <Icon d={ICONS.refresh} size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const { ordersByStatus, recentOrders = [] } = data || {};

  const quickActions = [
    { href: "/admin/orders", label: "View all orders", icon: "orders", color: "#4f46e5", bg: "#e0e7ff" },
    { href: "/admin/products", label: "Manage products", icon: "products", color: "#db2777", bg: "#fce7f3" },
    { href: "/admin/users", label: "Manage users", icon: "users", color: "#7c3aed", bg: "#ede9fe" },
    { href: "/", label: "View storefront", icon: "store", color: "#0d9488", bg: "#ccfbf1" },
  ];

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="db">
      <style>{CSS}</style>

      {/* Header */}
      <div className="db-head">
        <div>
          <h1 className="db-title">Dashboard</h1>
          <p className="db-sub">
            {today}
            {updatedAt &&
              ` · Updated ${updatedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`}
          </p>
        </div>
        <button className="db-btn" onClick={() => fetchDashboard(true)} disabled={refreshing}>
          <span className={refreshing ? "db-spin" : ""} style={{ display: "inline-flex" }}>
            <Icon d={ICONS.refresh} size={16} />
          </span>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="db-error" role="alert" style={{ marginBottom: "1rem" }}>
          <Icon d={ICONS.alert} size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI cards */}
      <div className="db-grid-kpi">
        {statCards.map((c) => (
          <KpiCard key={c.label} {...c} />
        ))}
      </div>

      {/* Status breakdown + quick actions */}
      <div className="db-row">
        <div className="db-card db-panel">
          <div className="db-panel-head">
            <h3 className="db-panel-title">Orders by status</h3>
          </div>
          <StatusDonut ordersByStatus={ordersByStatus} />
        </div>

        <div className="db-card db-panel">
          <div className="db-panel-head">
            <h3 className="db-panel-title">Quick actions</h3>
          </div>
          <div className="db-actions">
            {quickActions.map((a) => (
              <a key={a.href} href={a.href} className="db-action">
                <span className="db-action-l">
                  <span className="db-action-ic" style={{ background: a.bg, color: a.color }}>
                    <Icon d={ICONS[a.icon]} size={18} />
                  </span>
                  {a.label}
                </span>
                <Icon d={ICONS.arrow} size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="db-card db-panel">
        <div className="db-panel-head">
          <h3 className="db-panel-title">Recent orders</h3>
          <a href="/admin/orders" className="db-link">
            View all <Icon d={ICONS.arrow} size={14} />
          </a>
        </div>

        {recentOrders.length === 0 ? (
          <div className="db-empty">No orders yet</div>
        ) : (
          <div className="db-table-wrap">
            <table className="db-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const name = order.user?.name || "Guest";
                  return (
                    <tr key={order._id}>
                      <td>
                        <span className="db-id">#{order._id?.slice(-6).toUpperCase()}</span>
                      </td>
                      <td>
                        <span className="db-avatar">{name.charAt(0).toUpperCase()}</span>
                        {name}
                      </td>
                      <td style={{ fontWeight: 600 }}>{money(order.totalPrice)}</td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td>
                        <PaymentBadge status={order.paymentStatus} />
                      </td>
                      <td style={{ color: "#64748b" }}>{formatDate(order.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
