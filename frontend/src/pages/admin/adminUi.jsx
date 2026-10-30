/* eslint-disable react-refresh/only-export-components */
// ecommerce-app/src/pages/admin/adminUi.jsx
// Shared styles, icons, helpers and small UI pieces for the admin pages
// (Orders, Products, Users, AddProduct).
import React, { useState, useEffect, useCallback } from "react";

/* ------------------------------ Styles ------------------------------ */

export const ADMIN_CSS = `
.ad { --ink:#0f172a; --muted:#64748b; --line:#e2e8f0; --bg:#f8fafc; --brand:#4f46e5; --brand-d:#4338ca;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--ink); max-width: 1280px; margin: 0 auto; }
.ad * { box-sizing: border-box; }

.ad-head { display:flex; justify-content:space-between; align-items:flex-end; gap:1rem; flex-wrap:wrap; margin-bottom:1.5rem; }
.ad-title { margin:0; font-size:1.65rem; font-weight:700; letter-spacing:-0.02em; }
.ad-sub { margin:.3rem 0 0; color:var(--muted); font-size:.95rem; }
.ad-head-actions { display:flex; gap:.6rem; flex-wrap:wrap; }

.ad-btn { display:inline-flex; align-items:center; justify-content:center; gap:.5rem; padding:.58rem 1rem; border-radius:10px;
  border:1px solid var(--line); background:#fff; color:var(--ink); font:inherit; font-weight:600; font-size:.875rem;
  cursor:pointer; transition:all .15s; text-decoration:none; white-space:nowrap; }
.ad-btn:hover:not(:disabled) { border-color:#cbd5e1; box-shadow:0 1px 3px rgba(15,23,42,.08); }
.ad-btn.primary { background:var(--brand); border-color:var(--brand); color:#fff; }
.ad-btn.primary:hover:not(:disabled) { background:var(--brand-d); border-color:var(--brand-d); }
.ad-btn.danger { background:#dc2626; border-color:#dc2626; color:#fff; }
.ad-btn.danger:hover:not(:disabled) { background:#b91c1c; border-color:#b91c1c; }
.ad-btn.ai { background:linear-gradient(135deg,#0ea5e9,#6366f1); border-color:transparent; color:#fff; }
.ad-btn.sm { padding:.4rem .7rem; font-size:.8rem; border-radius:8px; }
.ad-btn.block { width:100%; padding:.8rem 1rem; font-size:.95rem; }
.ad-btn.icon { width:34px; height:34px; padding:0; border-radius:8px; }
.ad-btn.icon.del:hover:not(:disabled) { color:#dc2626; border-color:#fecaca; background:#fef2f2; }
.ad-btn.icon.view:hover:not(:disabled) { color:var(--brand); border-color:#c7d2fe; background:#eef2ff; }
.ad-btn:disabled { opacity:.55; cursor:not-allowed; }
.ad-spin { display:inline-flex; animation: ad-rot 1s linear infinite; }
@keyframes ad-rot { to { transform: rotate(360deg); } }

.ad-card { background:#fff; border:1px solid var(--line); border-radius:14px; box-shadow:0 1px 2px rgba(15,23,42,.04); }
.ad-panel { padding:1.4rem; }
.ad-panel-title { margin:0 0 1rem; font-size:1rem; font-weight:700; display:flex; justify-content:space-between; align-items:center; gap:.75rem; flex-wrap:wrap; }

.ad-kpis { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1.25rem; }
.ad-kpi { padding:1.05rem 1.2rem; display:flex; justify-content:space-between; align-items:center; gap:.75rem; }
.ad-kpi-label { color:var(--muted); font-size:.75rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; }
.ad-kpi-value { margin-top:.35rem; font-size:1.5rem; font-weight:700; letter-spacing:-0.02em; line-height:1.1; }
.ad-kpi-icon { flex-shrink:0; width:40px; height:40px; border-radius:11px; display:flex; align-items:center; justify-content:center; }

.ad-toolbar { display:flex; gap:.75rem; flex-wrap:wrap; align-items:center; padding:.9rem; margin-bottom:1.25rem; }
.ad-search { position:relative; flex:1; min-width:220px; }
.ad-search > svg { position:absolute; left:.8rem; top:50%; transform:translateY(-50%); color:#94a3b8; pointer-events:none; }
.ad-search .ad-input { padding-left:2.4rem; }
.ad-input { width:100%; padding:.6rem .85rem; border:1px solid var(--line); border-radius:10px; font:inherit; font-size:.9rem;
  background:#fff; color:var(--ink); transition:border-color .15s, box-shadow .15s; }
.ad-input:focus { outline:none; border-color:var(--brand); box-shadow:0 0 0 3px rgba(79,70,229,.15); }
.ad-input.auto { width:auto; }
textarea.ad-input { resize:vertical; min-height:92px; line-height:1.5; }
.ad-chips { display:flex; gap:.4rem; flex-wrap:wrap; }
.ad-chip { padding:.4rem .85rem; border-radius:99px; border:1px solid var(--line); background:#fff; font:inherit; font-size:.8rem;
  font-weight:600; color:var(--muted); cursor:pointer; transition:all .15s; }
.ad-chip:hover { border-color:#cbd5e1; color:var(--ink); }
.ad-chip.on { background:var(--ink); border-color:var(--ink); color:#fff; }

.ad-table-wrap { overflow-x:auto; }
.ad-table { width:100%; border-collapse:collapse; min-width:760px; }
.ad-table th { text-align:left; padding:.75rem 1.1rem; font-size:.72rem; font-weight:700; color:var(--muted); text-transform:uppercase;
  letter-spacing:.05em; background:var(--bg); border-bottom:1px solid var(--line); white-space:nowrap; }
.ad-table td { padding:.85rem 1.1rem; font-size:.9rem; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
.ad-table tbody tr:last-child td { border-bottom:none; }
.ad-table tbody tr:hover { background:#fafbff; }
.ad-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight:700; font-size:.85rem; }
.ad-muted { color:var(--muted); }
.ad-small { font-size:.8rem; }
.ad-row-actions { display:flex; gap:.4rem; }
.ad-user { display:flex; align-items:center; gap:.75rem; }

.ad-badge { display:inline-flex; align-items:center; gap:.4rem; padding:.22rem .65rem; border-radius:99px; font-size:.75rem; font-weight:700; white-space:nowrap; }
.ad-badge i { width:6px; height:6px; border-radius:50%; background:currentColor; }
.ad-avatar { flex-shrink:0; width:38px; height:38px; border-radius:50%; background:#e0e7ff; color:#4338ca; display:flex; align-items:center;
  justify-content:center; font-weight:700; font-size:.9rem; object-fit:cover; }
.ad-avatar.lg { width:72px; height:72px; font-size:1.8rem; }
.ad-select-pill { padding:.35rem .6rem; border-radius:8px; border:1px solid var(--line); font:inherit; font-weight:700; font-size:.8rem; cursor:pointer; }

.ad-empty { text-align:center; color:var(--muted); padding:3rem 1rem; }
.ad-empty h3 { margin:.75rem 0 .25rem; color:var(--ink); }
.ad-empty-ic { width:56px; height:56px; border-radius:16px; background:#f1f5f9; color:#94a3b8; display:inline-flex; align-items:center; justify-content:center; }
.ad-error { display:flex; align-items:center; gap:.75rem; padding:.9rem 1.1rem; margin-bottom:1.25rem; background:#fef2f2; border:1px solid #fecaca; color:#991b1b; border-radius:12px; }
.ad-error span { flex:1; font-weight:500; font-size:.9rem; }
.ad-skel { background:linear-gradient(90deg,#eef2f7 25%,#f8fafc 50%,#eef2f7 75%); background-size:200% 100%; animation: ad-shim 1.3s infinite; border-radius:8px; }
@keyframes ad-shim { to { background-position:-200% 0; } }

.ad-backdrop { position:fixed; inset:0; background:rgba(15,23,42,.55); backdrop-filter:blur(2px); display:flex; align-items:center; justify-content:center; z-index:1000; padding:1.25rem; }
.ad-modal { background:#fff; border-radius:16px; width:100%; max-height:90vh; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(15,23,42,.35); animation: ad-pop .15s ease-out; }
@keyframes ad-pop { from { opacity:0; transform:translateY(8px) scale(.98); } to { opacity:1; transform:none; } }
.ad-modal-head { display:flex; justify-content:space-between; align-items:center; padding:1.1rem 1.4rem; border-bottom:1px solid var(--line); }
.ad-modal-head h2 { margin:0; font-size:1.1rem; }
.ad-modal-body { padding:1.4rem; overflow:auto; }
.ad-modal-foot { display:flex; justify-content:flex-end; gap:.6rem; padding:1rem 1.4rem; border-top:1px solid var(--line); background:var(--bg); border-radius:0 0 16px 16px; }

.ad-section-title { font-size:.72rem; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.06em; margin:0 0 .6rem; }
.ad-kv { display:grid; grid-template-columns:110px 1fr; gap:.4rem .75rem; font-size:.9rem; margin-bottom:1.25rem; }
.ad-kv dt { color:var(--muted); } .ad-kv dd { margin:0; font-weight:500; word-break:break-word; }
.ad-line { display:flex; justify-content:space-between; gap:1rem; padding:.65rem .85rem; background:var(--bg); border-radius:10px; margin-bottom:.45rem; font-size:.9rem; }
.ad-line.total { background:var(--brand); color:#fff; font-weight:700; margin-top:.6rem; }
.ad-mini-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:.75rem; margin:1.25rem 0; }
.ad-mini { background:var(--bg); border-radius:12px; padding:.9rem; text-align:center; }
.ad-mini small { display:block; color:var(--muted); font-size:.75rem; margin-bottom:.25rem; }
.ad-mini b { font-size:1.15rem; }

.ad-field { margin-bottom:1.1rem; }
.ad-label { display:block; margin-bottom:.4rem; font-weight:600; font-size:.85rem; color:#334155; }
.ad-label small { font-weight:400; color:#94a3b8; }
.ad-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.ad-grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
.ad-form-error { background:#fef2f2; border:1px solid #fecaca; color:#991b1b; padding:.7rem .9rem; border-radius:10px; margin-bottom:1rem; font-size:.875rem; }

.ad-pgrid { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:1.25rem; }
.ad-pcard { overflow:hidden; display:flex; flex-direction:column; transition:transform .18s, box-shadow .18s; }
.ad-pcard:hover { transform:translateY(-3px); box-shadow:0 10px 24px rgba(15,23,42,.09); }
.ad-pimg { position:relative; height:190px; background:#f1f5f9; }
.ad-pimg img { width:100%; height:100%; object-fit:cover; display:block; }
.ad-pimg .ad-badge { position:absolute; top:.65rem; right:.65rem; }
.ad-pbody { padding:1rem 1.1rem 1.1rem; display:flex; flex-direction:column; gap:.55rem; flex:1; }
.ad-pname { margin:0; font-size:1rem; font-weight:700; line-height:1.3; }
.ad-pprice { font-size:1.25rem; font-weight:700; letter-spacing:-0.01em; }
.ad-pdesc { margin:0; font-size:.83rem; color:var(--muted); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.ad-pfoot { margin-top:auto; display:flex; gap:.5rem; padding-top:.4rem; }
.ad-pfoot > * { flex:1; }

.ad-form-grid { display:grid; grid-template-columns:minmax(0,2fr) minmax(0,1fr); gap:1.25rem; align-items:start; }
.ad-stack { display:grid; gap:1.25rem; }
.ad-sticky { position:sticky; top:1rem; }
.ad-drop { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.4rem; text-align:center; padding:1.75rem 1rem;
  border:2px dashed #cbd5e1; border-radius:12px; background:var(--bg); color:var(--muted); cursor:pointer; transition:all .15s; font-size:.85rem; }
.ad-drop:hover, .ad-drop.over { border-color:var(--brand); background:#eef2ff; color:var(--brand); }
.ad-drop b { color:var(--ink); }
.ad-vh { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }
.ad-preview { position:relative; border-radius:12px; overflow:hidden; border:1px solid var(--line); }
.ad-preview img { width:100%; display:block; max-height:280px; object-fit:cover; }
.ad-preview .ad-btn { position:absolute; top:.6rem; right:.6rem; }
.ad-ai { display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; padding:.9rem 1rem; margin-bottom:1.1rem;
  background:linear-gradient(135deg,#f0f9ff,#eef2ff); border:1px solid #c7d2fe; border-radius:12px; }
.ad-ai p { margin:.15rem 0 0; color:var(--muted); font-size:.82rem; }
.ad-ai b { font-size:.9rem; }

.ad-toasts { position:fixed; right:1.25rem; bottom:1.25rem; display:grid; gap:.6rem; z-index:1100; max-width:min(380px, calc(100vw - 2.5rem)); }
.ad-toast { display:flex; align-items:flex-start; gap:.7rem; background:#fff; border:1px solid var(--line); border-left-width:4px; border-radius:12px;
  padding:.8rem 1rem; box-shadow:0 10px 25px rgba(15,23,42,.12); font-size:.875rem; font-weight:500; animation: ad-pop .15s ease-out; }
.ad-toast.success { border-left-color:#059669; } .ad-toast.success svg { color:#059669; }
.ad-toast.error { border-left-color:#dc2626; } .ad-toast.error svg { color:#dc2626; }
.ad-toast svg { flex-shrink:0; margin-top:1px; }

@media (max-width:900px) { .ad-form-grid { grid-template-columns:1fr; } .ad-sticky { position:static; } }
@media (max-width:560px) { .ad-grid2, .ad-grid3, .ad-mini-grid { grid-template-columns:1fr; } .ad-title { font-size:1.4rem; } .ad-kv { grid-template-columns:1fr; } }
`;

export const AdminStyles = () => <style>{ADMIN_CSS}</style>;

/* ------------------------------ Icons ------------------------------- */

export const Icon = ({ name, size = 18 }) => {
  const d = ICONS[name] || [];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
};

export const ICONS = {
  orders: ["M21 8l-9-5-9 5v8l9 5 9-5V8z", "M3 8l9 5 9-5", "M12 13v8"],
  revenue: ["M12 1v22", "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"],
  users: ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  products: ["M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z", "M3 6h18", "M16 10a4 4 0 0 1-8 0"],
  clock: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 6v6l4 2"],
  shield: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
  refresh: ["M23 4v6h-6", "M1 20v-6h6", "M3.5 9a9 9 0 0 1 15-3.4L23 10", "M1 14l4.5 4.4A9 9 0 0 0 20.5 15"],
  alert: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 8v4", "M12 16h.01"],
  search: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.3-4.3"],
  plus: ["M12 5v14", "M5 12h14"],
  eye: ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  trash: ["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6", "M10 11v6", "M14 11v6"],
  edit: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"],
  x: ["M18 6L6 18", "M6 6l12 12"],
  check: ["M20 6L9 17l-5-5"],
  sparkles: ["M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z", "M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7L19 16z"],
  image: ["M3 3h18v18H3z", "M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z", "M21 15l-5-5L5 21"],
  upload: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"],
  arrowLeft: ["M19 12H5", "M12 19l-7-7 7-7"],
  tag: ["M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z", "M7 7h.01"],
};

/* ----------------------------- Helpers ------------------------------ */

export const STATUS_META = {
  pending: { color: "#d97706", bg: "#fef3c7", fg: "#92400e", label: "Pending" },
  processing: { color: "#2563eb", bg: "#dbeafe", fg: "#1e40af", label: "Processing" },
  shipped: { color: "#7c3aed", bg: "#ede9fe", fg: "#5b21b6", label: "Shipped" },
  delivered: { color: "#059669", bg: "#d1fae5", fg: "#065f46", label: "Delivered" },
  cancelled: { color: "#dc2626", bg: "#fee2e2", fg: "#991b1b", label: "Cancelled" },
};

export const money = (n) =>
  `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0)} ETB`;

export const num = (n) => new Intl.NumberFormat("en-US").format(Number(n) || 0);

export const formatDate = (d, fallback = "—") =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : fallback;

export const NO_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#f1f5f9"/><text x="50%" y="50%" fill="#94a3b8" font-family="sans-serif" font-size="16" text-anchor="middle" dominant-baseline="middle">No image</text></svg>'
  );

export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/* ------------------------------ UI bits ----------------------------- */

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="ad-head">
      <div>
        <h1 className="ad-title">{title}</h1>
        {subtitle && <p className="ad-sub">{subtitle}</p>}
      </div>
      {children && <div className="ad-head-actions">{children}</div>}
    </div>
  );
}

export function Kpi({ label, value, icon, color, bg }) {
  return (
    <div className="ad-card ad-kpi">
      <div>
        <div className="ad-kpi-label">{label}</div>
        <div className="ad-kpi-value">{value}</div>
      </div>
      <div className="ad-kpi-icon" style={{ background: bg, color }}>
        <Icon name={icon} size={20} />
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const m = STATUS_META[status] || { bg: "#f1f5f9", fg: "#475569", label: status || "—" };
  return (
    <span className="ad-badge" style={{ background: m.bg, color: m.fg }}>
      <i />
      {m.label}
    </span>
  );
}

export function PaymentBadge({ status }) {
  const paid = status === "paid";
  return (
    <span className="ad-badge" style={{ background: paid ? "#d1fae5" : "#fef3c7", color: paid ? "#065f46" : "#92400e" }}>
      <i />
      {paid ? "Paid" : status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unpaid"}
    </span>
  );
}

export function Modal({ title, onClose, children, footer, width = 560 }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="ad-backdrop" onMouseDown={onClose}>
      <div className="ad-modal" style={{ maxWidth: width }} role="dialog" aria-modal="true" aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}>
        <div className="ad-modal-head">
          <h2>{title}</h2>
          <button type="button" className="ad-btn icon sm" onClick={onClose} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="ad-modal-body">{children}</div>
        {footer && <div className="ad-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div style={{ padding: "1.1rem" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="ad-skel" style={{ height: 44, marginBottom: 10 }} />
      ))}
    </div>
  );
}

export function EmptyState({ icon = "orders", title, text, children }) {
  return (
    <div className="ad-empty">
      <span className="ad-empty-ic"><Icon name={icon} size={26} /></span>
      <h3>{title}</h3>
      {text && <p style={{ margin: "0 0 1rem" }}>{text}</p>}
      {children}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  return (
    <div className="ad-error" role="alert">
      <Icon name="alert" size={20} />
      <span>{message}</span>
      {onRetry && (
        <button className="ad-btn sm" onClick={onRetry}>
          <Icon name="refresh" size={14} /> Retry
        </button>
      )}
    </div>
  );
}

/**
 * Replaces alert() / window.confirm() with toasts and a confirmation dialog.
 *   const { toast, confirm, ui } = useFeedback();
 *   toast("success", "Saved");
 *   if (await confirm({ title, message, confirmLabel, danger })) ...
 *   ...render {ui} once in the page.
 */
export function useFeedback() {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);

  const toast = useCallback((type, text, ms = 4000) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((t) => [...t, { id, type, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms);
  }, []);

  const confirm = useCallback(
    (opts) => new Promise((resolve) => setDialog({ ...opts, resolve })),
    []
  );

  const close = (value) => {
    dialog?.resolve(value);
    setDialog(null);
  };

  const ui = (
    <>
      <div className="ad-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`ad-toast ${t.type}`} role={t.type === "error" ? "alert" : "status"}>
            <Icon name={t.type === "error" ? "alert" : "check"} size={18} />
            <span>{t.text}</span>
          </div>
        ))}
      </div>
      {dialog && (
        <Modal
          title={dialog.title || "Are you sure?"}
          width={440}
          onClose={() => close(false)}
          footer={
            <>
              <button className="ad-btn" onClick={() => close(false)}>Cancel</button>
              <button className={`ad-btn ${dialog.danger ? "danger" : "primary"}`} onClick={() => close(true)}>
                {dialog.confirmLabel || "Confirm"}
              </button>
            </>
          }
        >
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.55 }}>{dialog.message}</p>
        </Modal>
      )}
    </>
  );

  return { toast, confirm, ui };
}
