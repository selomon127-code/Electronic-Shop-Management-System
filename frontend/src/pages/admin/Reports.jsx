import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "../../api/adminApi";
import {
  AdminStyles, ErrorBanner, Kpi, PageHeader, useFeedback,
} from "./adminUi";
import BulkCostUpdater from "./BulkCostUpdater";

const today = () => new Date().toISOString().slice(0, 10);
const monthAgo = () => {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return date.toISOString().slice(0, 10);
};
const currency = (value) => Number(value || 0).toLocaleString(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const dateLabel = (value) => value ? new Date(value).toLocaleDateString() : "—";
const INTERVAL_OPTIONS = [
  ["day", "daily"],
  ["week", "weekly"],
  ["month", "monthly"],
  ["year", "annual"],
];

function Reports() {
  const { t } = useTranslation();
  const { toast } = useFeedback();
  const [interval, setInterval] = useState("day");
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [purchaseSaving, setPurchaseSaving] = useState(false);
  const [error, setError] = useState("");
  const [purchase, setPurchase] = useState({
    supplierName: "",
    productId: "",
    quantity: "1",
    unitCost: "",
    purchaseDate: today(),
    reference: "",
    notes: "",
  });

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: result } = await adminApi.getReports({ interval, startDate, endDate });
      setData(result);
      setProducts(result.inventory.items);
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("admin.failed_load_reports"));
    } finally {
      setLoading(false);
    }
  }, [interval, startDate, endDate, t]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const sections = useMemo(() => {
    if (!data) return [];
    const financials = data.profitLoss;
    return [
      {
        name: t("admin.sales_report"),
        sheet: "Sales",
        headers: ["Period", t("admin.orders"), t("admin.revenue_etb"), t("admin.discounts_etb")],
        rows: data.sales.map((item) => [item._id, item.orders, item.revenue, item.discounts]),
      },
      {
        name: t("admin.profit_loss_report"),
        sheet: "Profit and Loss",
        headers: [t("admin.revenue_etb"), t("admin.cost_of_goods_sold"), t("admin.gross_profit"), t("admin.missing_cost_lines")],
        rows: [[financials.revenue, financials.costOfGoodsSold, financials.isComplete ? financials.grossProfit : "Incomplete", financials.incompleteCostLines]],
      },
      {
        name: t("admin.inventory_valuation"),
        sheet: "Inventory",
        headers: [t("admin.product"), t("admin.stock_on_hand"), t("admin.unit_cost"), t("admin.valuation_etb"), t("admin.units_sold")],
        rows: data.inventory.items.map((item) => [item.name, item.stock, item.unitCost ?? "", item.valuation ?? "", item.unitsSold]),
      },
      {
        name: t("admin.stock_movement_report"),
        sheet: "Stock Movements",
        headers: [t("admin.purchase_date"), t("admin.product"), t("admin.movement"), t("admin.quantity"), t("admin.stock_after"), t("admin.notes")],
        rows: data.stockMovements.map((item) => [dateLabel(item.createdAt), item.productName, item.type, item.quantity, item.stockAfter ?? "", item.note]),
      },
      {
        name: t("admin.best_selling_products"),
        sheet: "Best Sellers",
        headers: [t("admin.product"), t("admin.quantity"), t("admin.revenue_etb")],
        rows: data.bestSelling.map((item) => [item.name, item.quantity, item.revenue]),
      },
      {
        name: t("admin.slow_moving_products"),
        sheet: "Slow Moving",
        headers: [t("admin.product"), t("admin.stock_on_hand"), t("admin.units_sold")],
        rows: data.slowMoving.map((item) => [item.name, item.stock, item.unitsSold]),
      },
      {
        name: t("admin.customer_purchase_report"),
        sheet: "Customers",
        headers: [t("admin.customer"), t("admin.email"), t("admin.orders"), t("admin.spent_etb"), t("admin.last_purchase")],
        rows: data.customers.map((item) => [item.name, item.email, item.orders, item.spent, dateLabel(item.lastPurchase)]),
      },
      {
        name: t("admin.payment_report"),
        sheet: "Payments",
        headers: [t("admin.method"), t("admin.payment_status"), t("admin.orders"), t("admin.amount_etb")],
        rows: data.payments.map((item) => [item.method, item.status, item.orders, item.amount]),
      },
      {
        name: t("admin.supplier_purchase_report"),
        sheet: "Supplier Purchases",
        headers: [t("admin.purchase_date"), t("admin.supplier"), t("admin.product"), t("admin.quantity"), t("admin.unit_cost_etb"), t("admin.amount_etb"), t("admin.reference"), t("admin.notes")],
        rows: data.supplierPurchases.map((item) => [dateLabel(item.purchaseDate), item.supplierName, item.productName, item.quantity, item.unitCost, item.totalCost, item.reference, item.notes]),
      },
    ];
  }, [data, t]);

  const paidRevenue = data?.sales.reduce((total, item) => total + Number(item.revenue || 0), 0) || 0;
  const paidOrders = data?.sales.reduce((total, item) => total + Number(item.orders || 0), 0) || 0;

  const handlePurchaseSubmit = async (event) => {
    event.preventDefault();
    setPurchaseSaving(true);
    try {
      await adminApi.recordSupplierPurchase({
        ...purchase,
        quantity: Number(purchase.quantity),
        unitCost: Number(purchase.unitCost),
      });
      toast("success", t("admin.purchase_saved"));
      setPurchase((current) => ({ ...current, supplierName: "", quantity: "1", unitCost: "", reference: "", notes: "" }));
      await loadReports();
    } catch (requestError) {
      toast("error", requestError.response?.data?.message || t("admin.failed_save_purchase"));
    } finally {
      setPurchaseSaving(false);
    }
  };

  const exportExcel = () => {
    try {
      const csvCell = (value) => {
        let text = value == null ? "" : String(value);
        if (typeof value === "string" && /^[=+\-@]/.test(text.trim())) text = `'${text}`;
        return `"${text.replaceAll('"', '""')}"`;
      };
      const csvRows = sections.flatMap((section) => [
        [section.name],
        section.headers,
        ...section.rows,
        [],
      ]);
      const csv = `\uFEFF${csvRows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `shop-reports-${startDate}-to-${endDate}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (exportError) {
      console.error("Excel report export failed:", exportError);
      toast("error", t("admin.export_failed"));
    }
  };

  const exportPdf = async () => {
    try {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const document = new jsPDF({ orientation: "landscape" });
    document.setFontSize(18);
    document.text(t("admin.reports"), 14, 18);
    document.setFontSize(10);
    document.text(`${startDate} — ${endDate}`, 14, 25);
    let startY = 32;
    sections.forEach((section) => {
      if (startY > 175) {
        document.addPage();
        startY = 18;
      }
      document.setFontSize(12);
      document.text(section.name, 14, startY);
      autoTable(document, {
        head: [section.headers],
        body: section.rows,
        startY: startY + 4,
        margin: { left: 14, right: 14 },
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [67, 56, 202] },
      });
      startY = document.lastAutoTable.finalY + 12;
    });
    document.save(`shop-reports-${startDate}-to-${endDate}.pdf`);
    } catch (exportError) {
      console.error("PDF report export failed:", exportError);
      toast("error", t("admin.export_failed"));
    }
  };

  const table = (section, rows) => (
    <section className="ad-card ad-panel" key={section}>
      <h2 className="ad-panel-title">{section}</h2>
      {rows.length ? (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr>{sections.find((item) => item.name === section)?.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
            <tbody>{rows.map((row, index) => (
              <tr key={`${section}-${index}`}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{typeof cell === "number" ? currency(cell) : cell ?? "—"}</td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <div className="ad-empty">{t("admin.no_report_rows")}</div>}
    </section>
  );

  return (
    <div className="ad">
      <AdminStyles />
      <PageHeader title={t("admin.reports")} subtitle={t("admin.reports_subtitle")}>
        <button className="ad-btn" disabled={!data} onClick={exportExcel}>{t("admin.export_excel")}</button>
        <button className="ad-btn" disabled={!data} onClick={exportPdf}>{t("admin.export_pdf")}</button>
      </PageHeader>

      <div className="ad-card ad-toolbar">
        <label>
          {t("admin.period")}
          <select className="ad-input auto" value={interval} onChange={(event) => setInterval(event.target.value)}>
            {INTERVAL_OPTIONS.map(([value, label]) => <option key={value} value={value}>{t(`admin.${label}`)}</option>)}
          </select>
        </label>
        <label>{t("admin.start_date")}<input className="ad-input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
        <label>{t("admin.end_date")}<input className="ad-input" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
        <button className="ad-btn primary" onClick={loadReports} disabled={loading}>{t("admin.load_reports")}</button>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadReports} />}
      {data && (
        <>
          <div className="ad-kpis">
            <Kpi label={t("admin.revenue_etb")} value={`${currency(paidRevenue)} ETB`} icon="revenue" color="#059669" bg="#d1fae5" />
            <Kpi label={t("admin.paid_orders")} value={paidOrders.toLocaleString()} icon="orders" color="#4f46e5" bg="#e0e7ff" />
            <Kpi label={t("admin.gross_profit")} value={data.profitLoss.isComplete ? `${currency(data.profitLoss.grossProfit)} ETB` : t("admin.incomplete")} icon="trend" color="#2563eb" bg="#dbeafe" />
            <Kpi label={t("admin.valuation_etb")} value={`${currency(data.inventory.valuation)} ETB`} icon="products" color="#7c3aed" bg="#ede9fe" />
          </div>
          {!data.profitLoss.isComplete && <ErrorBanner message={`${t("admin.profit_warning")} ${data.profitLoss.incompleteCostLines} ${t("admin.missing_cost_lines").toLowerCase()}.`} />}
          {data.inventory.itemsWithoutCost > 0 && <p className="ad-muted">{t("admin.valuation_warning")} {data.inventory.itemsWithoutCost} products are missing cost.</p>}

          <BulkCostUpdater products={data.inventory.items} onSaved={loadReports} />

          <div style={{ display: "grid", gap: "1rem" }}>
            {sections.slice(0, 1).map((section) => table(section.name, section.rows))}
            {sections.slice(1, 2).map((section) => table(section.name, [[
              data.profitLoss.revenue,
              data.profitLoss.costOfGoodsSold,
              data.profitLoss.isComplete ? data.profitLoss.grossProfit : t("admin.incomplete"),
              data.profitLoss.incompleteCostLines,
            ]]))}
            {sections.slice(2).map((section) => table(section.name, section.rows))}
          </div>

          <section className="ad-card ad-panel" style={{ marginTop: "1.25rem" }}>
            <h2 className="ad-panel-title">{t("admin.record_purchase")}</h2>
            <p className="ad-muted">{t("admin.stock_warning")}</p>
            <form onSubmit={handlePurchaseSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: ".75rem" }}>
              <label>{t("admin.supplier")} *
                <input className="ad-input" required maxLength={120} value={purchase.supplierName}
                  onChange={(event) => setPurchase({ ...purchase, supplierName: event.target.value })} />
              </label>
              <label>{t("admin.product")} *
                <select className="ad-input" required value={purchase.productId}
                  onChange={(event) => setPurchase({ ...purchase, productId: event.target.value })}>
                  <option value="">—</option>
                  {products.map((product) => <option key={product.productId} value={product.productId}>{product.name}</option>)}
                </select>
              </label>
              <label>{t("admin.quantity")} *
                <input className="ad-input" type="number" min="1" step="1" required value={purchase.quantity}
                  onChange={(event) => setPurchase({ ...purchase, quantity: event.target.value })} />
              </label>
              <label>{t("admin.unit_cost_etb")} *
                <input className="ad-input" type="number" min="0" step="0.01" required value={purchase.unitCost}
                  onChange={(event) => setPurchase({ ...purchase, unitCost: event.target.value })} />
              </label>
              <label>{t("admin.purchase_date")} *
                <input className="ad-input" type="date" required value={purchase.purchaseDate}
                  onChange={(event) => setPurchase({ ...purchase, purchaseDate: event.target.value })} />
              </label>
              <label>{t("admin.reference")}
                <input className="ad-input" maxLength={120} value={purchase.reference}
                  onChange={(event) => setPurchase({ ...purchase, reference: event.target.value })} />
              </label>
              <label>{t("admin.notes")}
                <input className="ad-input" maxLength={1000} value={purchase.notes}
                  onChange={(event) => setPurchase({ ...purchase, notes: event.target.value })} />
              </label>
              <button className="ad-btn primary" type="submit" disabled={purchaseSaving}>{t("admin.record_purchase")}</button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}

export default Reports;
