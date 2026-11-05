// ecommerce-app/src/pages/admin/Dashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "../../api/adminApi";
import AIAnalyticsWidget from "./AIAnalyticsWidget";

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
.db-revenue-grid { display:grid; grid-template-columns:minmax(0,1.7fr) minmax(240px,1fr); gap:1rem; margin-bottom:1.5rem; }
.db-chart { width:100%; overflow:visible; display:block; }
.db-chart-label { fill:#64748b; font-size:11px; }
.db-chart-grid { stroke:#e2e8f0; stroke-dasharray:3 4; }
.db-chart-line { fill:none; stroke:#4f46e5; stroke-width:3; stroke-linecap:round; stroke-linejoin:round; }
.db-chart-area { fill:url(#revenue-gradient); }
.db-chart-point { fill:#fff; stroke:#4f46e5; stroke-width:2; }
.db-chart-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.75rem; margin-bottom:1rem; }
.db-chart-stat { padding:.75rem; border-radius:10px; background:#f8fafc; }
.db-chart-stat span { display:block; color:#64748b; font-size:.75rem; font-weight:600; }
.db-chart-stat b { display:block; margin-top:.25rem; font-size:1rem; }
.db-chart-select { padding:.5rem .7rem; border:1px solid var(--line); background:#fff; color:var(--ink); border-radius:8px; font-weight:600; }
.db-channel-row { display:grid; gap:.35rem; margin-bottom:1rem; }
.db-channel-head { display:flex; justify-content:space-between; gap:.5rem; font-size:.85rem; }
.db-channel-track { height:8px; background:#eef2ff; border-radius:99px; overflow:hidden; }
.db-channel-track i { display:block; height:100%; background:#4f46e5; border-radius:99px; }

.db-skel { background:linear-gradient(90deg,#eef2f7 25%,#f8fafc 50%,#eef2f7 75%); background-size:200% 100%;
  animation: db-shim 1.3s infinite; border-radius:8px; }
@keyframes db-shim { to { background-position:-200% 0; } }

.db-error { display:flex; align-items:center; gap:1rem; padding:1.1rem 1.25rem; background:#fef2f2; border:1px solid #fecaca;
  color:#991b1b; border-radius:12px; }
.db-error span { flex:1; font-weight:500; }

@media (max-width:1100px) { .db-grid-kpi { grid-template-columns:repeat(2,1fr); } .db-row { grid-template-columns:1fr; } }
@media (max-width:900px) { .db-revenue-grid { grid-template-columns:1fr; } }
@media (max-width:560px) { .db-grid-kpi { grid-template-columns:1fr; } .db-title { font-size:1.4rem; } .db-chart-stats { grid-template-columns:1fr; } }
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
  const { t } = useTranslation();
  const m = STATUS_META[status] || FALLBACK_META;
  return (
    <span className="db-badge" style={{ background: m.bg, color: m.fg }}>
      <i />
      {m.label ? t(`admin.status_${status}`, { defaultValue: m.label }) : status || "—"}
    </span>
  );
}

function PaymentBadge({ status }) {
  const { t } = useTranslation();
  const paid = status === "paid";
  return (
    <span
      className="db-badge"
      style={{ background: paid ? "#d1fae5" : "#fef3c7", color: paid ? "#065f46" : "#92400e" }}
    >
      <i />
      {paid ? t("admin.paid") : status ? t(`admin.payment_${status}`, { defaultValue: status.charAt(0).toUpperCase() + status.slice(1) }) : t("admin.unpaid")}
    </span>
  );
}

function StatusDonut({ ordersByStatus }) {
  const { t } = useTranslation();
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
        <svg viewBox="0 0 170 170" width="170" height="170" role="img" aria-label={t("admin.orders_by_status")}>
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
          <span>{t("admin.total_orders")}</span>
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
        {segments.length === 0 && <div className="db-empty">{t("admin.no_order_data")}</div>}
      </div>
    </div>
  );
}

function RevenueLineChart({ series, locale, currency, noDataLabel }) {
  const width = 760;
  const height = 260;
  const padding = { top: 16, right: 12, bottom: 38, left: 78 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(1, ...series.map((item) => item.revenue || 0));
  const step = Math.pow(10, Math.floor(Math.log10(maxValue)));
  const axisMax = Math.ceil(maxValue / step) * step || 1;
  const points = series.map((item, index) => ({
    ...item,
    x: padding.left + (series.length === 1 ? chartWidth / 2 : (index / (series.length - 1)) * chartWidth),
    y: padding.top + chartHeight - (item.revenue / axisMax) * chartHeight,
  }));
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const area = points.length
    ? `${line} L${points[points.length - 1].x},${padding.top + chartHeight} L${points[0].x},${padding.top + chartHeight} Z`
    : "";
  const labelIndexes = new Set(
    Array.from({ length: Math.min(6, series.length) }, (_, index) =>
      Math.round((index * (series.length - 1)) / Math.max(1, Math.min(6, series.length) - 1)),
    ),
  );
  const formatPeriod = (period) => {
    const date = new Date(`${period}${period.length === 7 ? "-01" : ""}T00:00:00Z`);
    return date.toLocaleDateString(locale, period.length === 7
      ? { month: "short", year: "2-digit", timeZone: "UTC" }
      : { day: "numeric", month: "short", timeZone: "UTC" });
  };
  const formatAxisValue = (value) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 1 })}m`;
    if (value >= 1_000) return `${(value / 1_000).toLocaleString(locale, { maximumFractionDigits: 1 })}k`;
    return value.toLocaleString(locale, { maximumFractionDigits: 0 });
  };

  if (!series.length) return <div className="db-empty">{noDataLabel}</div>;

  return (
    <svg
      className="db-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Revenue over time"
    >
      <defs>
        <linearGradient id="revenue-gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity=".24" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((index) => {
        const value = (axisMax * index) / 3;
        const y = padding.top + chartHeight - (index / 3) * chartHeight;
        return (
          <g key={index}>
            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="db-chart-grid" />
            <text x={padding.left - 10} y={y + 4} textAnchor="end" className="db-chart-label">
              {formatAxisValue(value)}
            </text>
          </g>
        );
      })}
      {area && <path d={area} className="db-chart-area" />}
      {line && <path d={line} className="db-chart-line" />}
      {points.map((point, index) => (
        <g key={point.period}>
          <circle cx={point.x} cy={point.y} r="4" className="db-chart-point">
            <title>{`${formatPeriod(point.period)}: ${new Intl.NumberFormat(locale, { style: "currency", currency }).format(point.revenue)} · ${point.orders} orders`}</title>
          </circle>
          {labelIndexes.has(index) && (
            <text x={point.x} y={height - 12} textAnchor="middle" className="db-chart-label">
              {formatPeriod(point.period)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function RevenueAnalytics({ data, loading, error, range, onRangeChange, locale }) {
  const { t } = useTranslation();
  const currency = data?.currency || "ETB";
  const money = (value) =>
    `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)} ${currency}`;
  const paymentMethods = data?.paymentBreakdown || [];
  const maxPaymentRevenue = Math.max(1, ...paymentMethods.map((item) => item.revenue || 0));
  const rangeOptions = [
    { value: "7d", label: t("admin.revenue_last_7_days") },
    { value: "30d", label: t("admin.revenue_last_30_days") },
    { value: "12m", label: t("admin.revenue_last_12_months") },
  ];

  return (
    <section className="db-revenue-grid" aria-label={t("admin.revenue_analytics")}>
      <div className="db-card db-panel">
        <div className="db-panel-head">
          <div>
            <h3 className="db-panel-title">{t("admin.revenue_analytics")}</h3>
            <span className="db-sub">{t("admin.paid_orders_by_order_date")}</span>
          </div>
          <label>
            <span className="db-chart-label" style={{ marginRight: ".45rem" }}>{t("admin.period")}</span>
            <select
              className="db-chart-select"
              aria-label={t("admin.revenue_chart_period")}
              value={range}
              onChange={(event) => onRangeChange(event.target.value)}
            >
              {rangeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="db-chart-stats">
          <div className="db-chart-stat"><span>{t("admin.revenue")}</span><b>{money(data?.totalRevenue)}</b></div>
          <div className="db-chart-stat"><span>{t("admin.paid_orders")}</span><b>{num(data?.totalOrders)}</b></div>
          <div className="db-chart-stat"><span>{t("admin.average_order_value")}</span><b>{money(data?.averageOrderValue)}</b></div>
        </div>
        {error ? (
          <div className="db-error" role="alert">{error}</div>
        ) : loading ? (
          <div className="db-skel" style={{ height: 260, borderRadius: 10 }} aria-label="Loading revenue chart" />
        ) : (
          <RevenueLineChart
            series={data?.revenueSeries || []}
            locale={locale}
            currency={currency}
            noDataLabel={t("admin.no_revenue_data")}
          />
        )}
      </div>

      <div className="db-card db-panel">
        <div className="db-panel-head">
          <h3 className="db-panel-title">{t("admin.revenue_by_payment_method")}</h3>
        </div>
        {error ? (
          <div className="db-empty">{t("admin.payment_breakdown_unavailable")}</div>
        ) : loading ? (
          <div className="db-skel" style={{ height: 150, borderRadius: 10 }} aria-label="Loading payment breakdown" />
        ) : paymentMethods.length ? (
          paymentMethods.map((item) => (
            <div className="db-channel-row" key={item.method}>
              <div className="db-channel-head">
                <strong>{item.method === "cod" ? t("admin.cash_on_delivery") : item.method === "chapa" ? "Chapa" : item.method}</strong>
                <span>{money(item.revenue)}</span>
              </div>
              <div className="db-channel-track">
                <i style={{ width: `${(item.revenue / maxPaymentRevenue) * 100}%` }} />
              </div>
              <span className="db-chart-label">{t("admin.paid_orders_count", { count: num(item.orders) })}</span>
            </div>
          ))
        ) : (
          <div className="db-empty">{t("admin.no_paid_orders_period")}</div>
        )}
      </div>
    </section>
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
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [revenueRange, setRevenueRange] = useState("30d");
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState("");
  const [analyticsRefreshKey, setAnalyticsRefreshKey] = useState(0);
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
      setError(err.response?.data?.message || t("admin.failed_load_dashboard"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    let active = true;
    setRevenueLoading(true);
    setRevenueError("");
    adminApi.getRevenueAnalytics(revenueRange)
      .then(({ data: result }) => {
        if (active) setRevenueData(result);
      })
      .catch((err) => {
        if (active) {
          setRevenueError(err.response?.data?.message || "Failed to load revenue analytics.");
        }
      })
      .finally(() => {
        if (active) setRevenueLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revenueRange, analyticsRefreshKey]);

  const statCards = useMemo(() => {
    const s = data?.stats || {};
    return [
      { label: t("admin.total_revenue"), value: money(s.totalRevenue), icon: "revenue", color: "#059669", bg: "#d1fae5" },
      { label: t("admin.total_orders"), value: num(s.totalOrders), icon: "orders", color: "#4f46e5", bg: "#e0e7ff" },
      { label: t("admin.today_revenue"), value: money(s.todayRevenue), icon: "trend", color: "#2563eb", bg: "#dbeafe" },
      { label: t("admin.today_orders"), value: num(s.todayOrders), icon: "calendar", color: "#d97706", bg: "#fef3c7" },
      { label: t("admin.pending_payment"), value: money(s.pendingRevenue), icon: "clock", color: "#dc2626", bg: "#fee2e2" },
      { label: t("admin.total_users"), value: num(s.totalUsers), icon: "users", color: "#7c3aed", bg: "#ede9fe" },
      { label: t("admin.total_products"), value: num(s.totalProducts), icon: "products", color: "#db2777", bg: "#fce7f3" },
    ];
  }, [data, t]);

  if (loading) return <DashboardSkeleton />;

  if (error && !data) {
    return (
      <div className="db">
        <style>{CSS}</style>
        <div className="db-error" role="alert">
          <Icon d={ICONS.alert} size={22} />
          <span>{error}</span>
          <button className="db-btn" onClick={() => fetchDashboard()}>
            <Icon d={ICONS.refresh} size={16} /> {t("admin.retry")}
          </button>
        </div>
      </div>
    );
  }

  const { ordersByStatus, recentOrders = [] } = data || {};

  const quickActions = [
    { href: "/admin/orders", label: t("admin.view_all_orders"), icon: "orders", color: "#4f46e5", bg: "#e0e7ff" },
    { href: "/admin/products", label: t("admin.manage_products"), icon: "products", color: "#db2777", bg: "#fce7f3" },
    { href: "/admin/users", label: t("admin.manage_users"), icon: "users", color: "#7c3aed", bg: "#ede9fe" },
    { href: "/", label: t("admin.view_storefront"), icon: "store", color: "#0d9488", bg: "#ccfbf1" },
  ];

  const dateLocales = { en: "en-GB", am: "am-ET", om: "om-ET", ti: "ti-ER" };
  const today = new Date().toLocaleDateString(dateLocales[i18n.language] || "en-GB", {
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
          <h1 className="db-title">{t("admin.dashboard")}</h1>
          <p className="db-sub">
            {today}
            {updatedAt &&
              ` · ${t("admin.updated", { time: updatedAt.toLocaleTimeString(dateLocales[i18n.language] || "en-GB", { hour: "2-digit", minute: "2-digit" }) })}`}
          </p>
        </div>
        <button
          className="db-btn"
          onClick={() => {
            fetchDashboard(true);
            setAnalyticsRefreshKey((key) => key + 1);
          }}
          disabled={refreshing}
        >
          <span className={refreshing ? "db-spin" : ""} style={{ display: "inline-flex" }}>
            <Icon d={ICONS.refresh} size={16} />
          </span>
          {refreshing ? t("admin.refreshing") : t("admin.refresh")}
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

      <RevenueAnalytics
        data={revenueData}
        loading={revenueLoading}
        error={revenueError}
        range={revenueRange}
        onRangeChange={setRevenueRange}
        locale={dateLocales[i18n.language] || "en-GB"}
      />

      <AIAnalyticsWidget />

      {/* Status breakdown + quick actions */}
      <div className="db-row">
        <div className="db-card db-panel">
          <div className="db-panel-head">
            <h3 className="db-panel-title">{t("admin.orders_by_status")}</h3>
          </div>
          <StatusDonut ordersByStatus={ordersByStatus} />
        </div>

        <div className="db-card db-panel">
          <div className="db-panel-head">
            <h3 className="db-panel-title">{t("admin.quick_actions")}</h3>
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
          <h3 className="db-panel-title">{t("admin.recent_orders")}</h3>
          <a href="/admin/orders" className="db-link">
            {t("admin.view_all")} <Icon d={ICONS.arrow} size={14} />
          </a>
        </div>

        {recentOrders.length === 0 ? (
          <div className="db-empty">{t("admin.no_orders_yet")}</div>
        ) : (
          <div className="db-table-wrap">
            <table className="db-table">
              <thead>
                <tr>
                  <th>{t("admin.order")}</th>
                  <th>{t("admin.customer")}</th>
                  <th>{t("admin.total")}</th>
                  <th>{t("admin.status")}</th>
                  <th>{t("admin.payment")}</th>
                  <th>{t("admin.date")}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const name = order.user?.name || t("admin.guest");
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
