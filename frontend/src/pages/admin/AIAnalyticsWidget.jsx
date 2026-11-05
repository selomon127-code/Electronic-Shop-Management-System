import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../../api/adminApi";

const TABS = [
  ["forecast", "Sales forecast"],
  ["inventory", "Inventory predictions"],
  ["customers", "Customer insights"],
];
const INTERVAL_OPTIONS = [
  ["day", "Daily"],
  ["week", "Weekly"],
  ["month", "Monthly"],
];

const currency = (value) => `${Number(value || 0).toLocaleString("en-US", {
  maximumFractionDigits: 0,
})} ETB`;

function ForecastChart({ observed = [], forecast = [] }) {
  const history = observed.slice(-30);
  const values = [...history.map((item) => item.revenue), ...forecast.map((item) => item.revenue)];
  if (!values.length) {
    return <p className="aia-empty">No sales history is available for this forecast yet.</p>;
  }
  const width = 760;
  const height = 220;
  const padding = { top: 16, right: 12, bottom: 30, left: 64 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const max = Math.max(1, ...values);
  const pointFor = (value, index, length) => ({
    x: padding.left + (length <= 1 ? chartWidth : (index / (length - 1)) * chartWidth),
    y: padding.top + chartHeight - (value / max) * chartHeight,
  });
  const historyPoints = history.map((item, index) => pointFor(item.revenue, index, values.length));
  const forecastValues = [history.at(-1)?.revenue || 0, ...forecast.map((item) => item.revenue)];
  const forecastPoints = forecastValues.map((value, index) =>
    pointFor(value, Math.max(0, history.length - 1) + index, values.length),
  );
  const path = (points) => points.map((point, index) =>
    `${index ? "L" : "M"}${point.x},${point.y}`,
  ).join(" ");

  return (
    <svg
      className="aia-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Sales forecast chart"
    >
      {[0, 0.5, 1].map((fraction) => {
        const y = padding.top + chartHeight * fraction;
        return <line key={fraction} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />;
      })}
      <path d={path(historyPoints)} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinejoin="round" />
      {forecast.length > 0 && (
        <path d={path(forecastPoints)} fill="none" stroke="#0d9488" strokeWidth="3" strokeDasharray="7 5" strokeLinejoin="round" />
      )}
      <text x={padding.left} y={height - 5} fill="#64748b" fontSize="11">Historical</text>
      <text x={width - padding.right} y={height - 5} fill="#64748b" fontSize="11" textAnchor="end">Next 30 days</text>
    </svg>
  );
}

function LoadingPanel() {
  return <div className="aia-loading" aria-label="Loading business analytics" />;
}

function AIAnalyticsWidget() {
  const [activeTab, setActiveTab] = useState("forecast");
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [forecastInterval, setForecastInterval] = useState("day");

  useEffect(() => {
    let active = true;
    const endpoints = [
      ["forecast", () => adminApi.getSalesForecast(forecastInterval)],
      ["inventory", adminApi.getStockPredictions],
      ["customers", adminApi.getCustomerInsights],
    ];
    Promise.allSettled(endpoints.map(([, request]) => request())).then((results) => {
      if (!active) return;
      const nextData = {};
      const nextErrors = {};
      results.forEach((result, index) => {
        const [key] = endpoints[index];
        if (result.status === "fulfilled") nextData[key] = result.value.data;
        else nextErrors[key] = result.reason?.response?.data?.message || "Unable to load this insight.";
      });
      setData(nextData);
      setErrors(nextErrors);
      setLoading(false);
    });
    return () => { active = false; };
  }, [forecastInterval, refreshKey]);

  const totalSegmentCustomers = useMemo(
    () => data.customers?.totalCustomers || 0,
    [data.customers],
  );

  const retry = () => {
    setLoading(true);
    setRefreshKey((key) => key + 1);
  };

  return (
    <section className="aia" aria-labelledby="aia-title">
      <style>{`
        .aia { margin: 0 0 1.5rem; color:#0f172a; }
        .aia * { box-sizing:border-box; }
        .aia-card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:1.25rem; box-shadow:0 1px 2px rgba(15,23,42,.04); }
        .aia-head,.aia-toolbar,.aia-summary,.aia-item { display:flex; align-items:center; justify-content:space-between; gap:1rem; }
        .aia-head { margin-bottom:1rem; flex-wrap:wrap; }
        .aia-title { margin:0; font-size:1.1rem; font-weight:750; }
        .aia-subtitle,.aia-muted { color:#64748b; font-size:.85rem; }
        .aia-tabs { display:flex; gap:.4rem; overflow-x:auto; }
        .aia-interval-controls { display:flex; align-items:center; gap:.75rem; }
        .aia-tab,.aia-refresh { border:1px solid #e2e8f0; background:#fff; color:#475569; border-radius:9px; padding:.5rem .75rem; font:inherit; font-size:.82rem; font-weight:650; cursor:pointer; white-space:nowrap; }
        .aia-tab[aria-selected="true"] { background:#eef2ff; border-color:#c7d2fe; color:#4338ca; }
        .aia-select { border:1px solid #e2e8f0; border-radius:9px; padding:.5rem .7rem; background:#fff; color:#334155; font:inherit; font-size:.82rem; font-weight:650; }
        .aia-chart { width:100%; min-height:180px; display:block; margin-top:.75rem; }
        .aia-summary { justify-content:flex-start; flex-wrap:wrap; margin-top:1rem; }
        .aia-metric { min-width:155px; flex:1; padding:.8rem; border-radius:10px; background:#f8fafc; }
        .aia-metric span { display:block; color:#64748b; font-size:.75rem; font-weight:650; }
        .aia-metric strong { display:block; margin-top:.3rem; font-size:1rem; }
        .aia-note { margin:.85rem 0 0; color:#64748b; font-size:.85rem; line-height:1.5; }
        .aia-list { display:grid; gap:.55rem; margin-top:1rem; }
        .aia-item { padding:.75rem .85rem; border:1px solid #e2e8f0; border-radius:10px; align-items:flex-start; }
        .aia-item strong { display:block; font-size:.9rem; }
        .aia-item p { margin:.25rem 0 0; color:#64748b; font-size:.8rem; line-height:1.45; }
        .aia-pill { flex-shrink:0; padding:.25rem .55rem; border-radius:99px; background:#fff7ed; color:#c2410c; font-size:.75rem; font-weight:700; }
        .aia-error { padding:1rem; color:#991b1b; border:1px solid #fecaca; background:#fef2f2; border-radius:10px; }
        .aia-error button { margin-left:.5rem; }
        .aia-empty { color:#64748b; text-align:center; padding:1.5rem .5rem; }
        .aia-loading { height:290px; border-radius:12px; background:linear-gradient(90deg,#f1f5f9 25%,#f8fafc 50%,#f1f5f9 75%); background-size:200% 100%; animation:aia-shimmer 1.3s infinite; }
        @keyframes aia-shimmer { to { background-position:-200% 0; } }
        @media(max-width:600px) { .aia-card { padding:1rem; } .aia-toolbar { align-items:flex-start; flex-direction:column; } .aia-item { flex-direction:column; } }
      `}</style>
      <div className="aia-card">
        <div className="aia-interval-controls">
          <div>
            <h2 className="aia-title" id="aia-title">Business AI insights</h2>
            <p className="aia-subtitle">Forecasts and recommendations from paid and delivered order history.</p>
          </div>
          <button type="button" className="aia-refresh" onClick={retry}>Refresh insights</button>
        </div>
        <div className="aia-toolbar">
          <div className="aia-tabs" role="tablist" aria-label="Business AI insight categories">
            {TABS.map(([key, label]) => (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === key}
                className="aia-tab"
                key={key}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="aia-head">
            {activeTab === "forecast" && (
              <select
                className="aia-select"
                aria-label="Forecast history grouping"
                value={forecastInterval}
                onChange={(event) => {
                  setLoading(true);
                  setForecastInterval(event.target.value);
                }}
              >
                {INTERVAL_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            )}
            <span className="aia-muted">Updated from current store data</span>
          </div>
        </div>
        {loading ? <LoadingPanel /> : (
          <div role="tabpanel">
            {errors[activeTab] ? (
              <div className="aia-error" role="alert">
                {errors[activeTab]}
                <button type="button" className="aia-refresh" onClick={retry}>Retry</button>
              </div>
            ) : activeTab === "forecast" ? (
              <div>
                <div className="aia-summary">
                  <div className="aia-metric"><span>Projected revenue · next 30 days</span><strong>{currency(data.forecast?.expectedRevenue30d)}</strong></div>
                  <div className="aia-metric"><span>Sales trend</span><strong>{data.forecast?.trend?.replace("_", " ") || "—"}</strong></div>
                  <div className="aia-metric"><span>Forecast confidence</span><strong>{data.forecast?.confidence || "—"}</strong></div>
                </div>
                <ForecastChart observed={data.forecast?.observed} forecast={data.forecast?.forecast} />
                <p className="aia-note">
                  {data.forecast?.seasonality?.insight || "Seasonality insights will appear when enough history is available."}
                  {" "}Projection uses {data.forecast?.activeSalesDays || 0} days with paid or delivered sales; limited history falls back to the historical daily average.
                </p>
              </div>
            ) : activeTab === "inventory" ? (
              <div>
                <div className="aia-summary">
                  <div className="aia-metric"><span>Low-stock products</span><strong>{data.inventory?.lowStockCount || 0}</strong></div>
                  <div className="aia-metric"><span>Slow-moving products</span><strong>{data.inventory?.slowMovingCount || 0}</strong></div>
                  <div className="aia-metric"><span>Sales lookback</span><strong>90 days</strong></div>
                </div>
                {data.inventory?.lowStock?.length ? (
                  <div className="aia-list">
                    {data.inventory.lowStock.slice(0, 8).map((item) => (
                      <div className="aia-item" key={item._id}>
                        <div>
                          <strong>{item.name}</strong>
                          <p>{item.stock} in stock · {item.daysToOutOfStock === null ? "No recent sales velocity" : `About ${item.daysToOutOfStock} days of stock`} · {item.monthlyBurnRate} units/month average</p>
                        </div>
                        <span className="aia-pill">Restock {item.recommendedRestockQuantity}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="aia-empty">No products currently meet the low-stock threshold.</p>}
                <p className="aia-note">Restock quantities target two months of recent average demand. Slow-moving items are flagged separately and are not automatically recommended for replenishment.</p>
              </div>
            ) : (
              <div>
                <div className="aia-summary">
                  <div className="aia-metric"><span>Customer profiles</span><strong>{totalSegmentCustomers}</strong></div>
                  <div className="aia-metric"><span>With paid purchases</span><strong>{data.customers?.purchasingCustomers || 0}</strong></div>
                </div>
                <div className="aia-list">
                  {(data.customers?.segments || []).map((segment) => (
                    <div className="aia-item" key={segment.key}>
                      <div>
                        <strong>{segment.label} · {segment.count}</strong>
                        <p>{segment.suggestion}</p>
                      </div>
                      <span className="aia-pill">{currency(segment.totalSpend)} spend</span>
                    </div>
                  ))}
                </div>
                <p className="aia-note">Segments use purchase history: VIP at ETB 20,000 lifetime spend, frequent at 3+ purchases, and inactive after 90 days without a purchase. Suggestions are advisory and do not send messages automatically.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default AIAnalyticsWidget;
