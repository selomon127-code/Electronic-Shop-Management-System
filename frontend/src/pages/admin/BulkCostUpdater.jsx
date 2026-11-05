import { useMemo, useState } from "react";
import { adminApi } from "../../api/adminApi";

const formatMoney = (value) => `${Number(value || 0).toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})} ETB`;

function BulkCostUpdater({ products, onSaved }) {
  const [inventory, setInventory] = useState(() => products.map((product) => ({
    ...product,
    costInput: product.unitCost == null ? "" : String(product.unitCost),
  })));
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const totals = useMemo(() => inventory.reduce((result, product) => {
    const cost = product.costInput.trim() === "" ? null : Number(product.costInput);
    if (cost === null || !Number.isFinite(cost) || cost < 0) return result;
    result.valuation += (Number(product.stock) || 0) * cost;
    result.costedProducts += 1;
    if (Number.isFinite(Number(product.price)) && Number(product.price) > 0) {
      result.salesValue += (Number(product.stock) || 0) * Number(product.price);
      result.costValue += (Number(product.stock) || 0) * cost;
    }
    return result;
  }, { valuation: 0, salesValue: 0, costValue: 0, costedProducts: 0 }), [inventory]);

  const estimatedMargin = totals.salesValue > 0
    ? ((totals.salesValue - totals.costValue) / totals.salesValue) * 100
    : null;

  const pendingUpdates = inventory.filter((product) => {
    if (product.costInput.trim() === "") return product.unitCost != null;
    const enteredCost = Number(product.costInput);
    return product.unitCost == null ||
      !Number.isFinite(enteredCost) ||
      enteredCost !== Number(product.unitCost);
  });

  const updateCost = (productId, value) => {
    setInventory((current) => current.map((product) =>
      product.productId === productId ? { ...product, costInput: value } : product,
    ));
    setError("");
    setMessage("");
  };

  const refreshCatalog = async () => {
    setRefreshing(true);
    try {
      const { data } = await adminApi.getProducts({ limit: 500 });
      const editsById = new Map(inventory.map((product) => [String(product.productId), product.costInput]));
      setInventory((data.products || []).map((product) => {
        const productId = String(product._id);
        const hasUnsavedEdit = editsById.has(productId);
        return {
          productId,
          name: product.name,
          category: product.category,
          stock: product.stock,
          price: product.price,
          unitCost: product.costPrice,
          costInput: hasUnsavedEdit
            ? editsById.get(productId)
            : product.costPrice == null ? "" : String(product.costPrice),
        };
      }));
      setMessage("Catalog refreshed. Unsaved costs for products still in the catalog were preserved.");
      return true;
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to refresh the product catalog.");
      return false;
    } finally {
      setRefreshing(false);
    }
  };

  const saveChanges = async (event) => {
    event.preventDefault();
    if (!pendingUpdates.length) {
      setMessage("There are no cost changes to save.");
      return;
    }

    const invalid = pendingUpdates.find((product) =>
      product.costInput.trim() === "" ||
      !Number.isFinite(Number(product.costInput)) ||
      Number(product.costInput) < 0,
    );
    if (invalid) {
      setError(`Enter a valid non-negative unit cost for ${invalid.name}.`);
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    const updates = pendingUpdates.map((product) => ({
      id: product.productId,
      costPrice: Number(product.costInput),
    }));
    try {
      const { data } = await adminApi.bulkUpdateProductCosts(updates);
      setInventory((current) => current.map((product) => {
        const update = updates.find((item) => item.id === product.productId);
        return update ? { ...product, unitCost: update.costPrice, costInput: String(update.costPrice) } : product;
      }));
      setMessage(`${data.updatedCount} product cost${data.updatedCount === 1 ? "" : "s"} saved.`);
      await onSaved?.();
    } catch (requestError) {
      if (requestError.response?.status === 404) {
        const refreshed = await refreshCatalog();
        setMessage("");
        setError(refreshed
          ? `${requestError.response?.data?.message || "A submitted product is no longer in the catalog."} The catalog was refreshed; saved edits for products still present were kept. Review the list and save again.`
          : `${requestError.response?.data?.message || "A submitted product is no longer in the catalog."} The catalog could not be refreshed; use Refresh catalog and try again.`);
      } else {
        setError(requestError.response?.data?.message || "Unable to save product costs. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="ad-card ad-panel bcu" aria-labelledby="bcu-title">
      <style>{`
        .bcu { margin:1.25rem 0; }
        .bcu-help { color:#64748b; font-size:.88rem; margin:-.5rem 0 1rem; line-height:1.5; }
        .bcu-summary { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:.75rem; margin-bottom:1rem; }
        .bcu-metric { padding:.8rem; background:#f8fafc; border-radius:10px; }
        .bcu-metric span { display:block; color:#64748b; font-size:.75rem; font-weight:650; }
        .bcu-metric strong { display:block; margin-top:.3rem; }
        .bcu-missing { background:#fff7ed; }
        .bcu-cost { max-width:170px; }
        .bcu-status { margin:.75rem 0; font-size:.88rem; }
        .bcu-status.error { color:#b91c1c; }
        .bcu-status.success { color:#047857; }
        .bcu-actions { display:flex; justify-content:flex-end; margin-top:1rem; }
        .bcu-table { min-width:720px; }
      `}</style>
      <h2 className="ad-panel-title" id="bcu-title">Bulk inventory unit costs</h2>
      <p className="bcu-help">
        Enter or correct purchase unit costs. Highlighted products are missing cost data.
        Preview values include products with a valid cost; estimated margin assumes those units sell at listed prices.
      </p>
      <div className="bcu-actions" style={{ justifyContent: "flex-start", margin: "0 0 .75rem" }}>
        <button type="button" className="ad-btn" onClick={refreshCatalog} disabled={refreshing || saving}>
          {refreshing ? "Refreshing…" : "Refresh catalog"}
        </button>
      </div>
      <div className="bcu-summary" aria-live="polite">
        <div className="bcu-metric"><span>Inventory value · {totals.costedProducts} costed products</span><strong>{formatMoney(totals.valuation)}</strong></div>
        <div className="bcu-metric"><span>Estimated gross margin · costed stock</span><strong>{estimatedMargin === null ? "—" : `${estimatedMargin.toFixed(1)}%`}</strong></div>
        <div className="bcu-metric"><span>Unsaved changes</span><strong>{pendingUpdates.length}</strong></div>
      </div>
      {error && <div className="bcu-status error" role="alert">{error}</div>}
      {message && <div className="bcu-status success" role="status">{message}</div>}
      <form onSubmit={saveChanges}>
        <div className="ad-table-wrap">
          <table className="ad-table bcu-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Stock</th>
                <th>Selling price</th>
                <th>Purchase unit cost</th>
                <th>Current valuation</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((product) => {
                const missing = product.unitCost == null;
                const cost = product.costInput.trim() === "" ? null : Number(product.costInput);
                const valuation = cost === null || !Number.isFinite(cost) ? null : cost * (Number(product.stock) || 0);
                return (
                  <tr key={product.productId} className={missing ? "bcu-missing" : undefined}>
                    <td>
                      <strong>{product.name}</strong>
                      {missing && <div className="ad-muted ad-small">Missing unit cost</div>}
                    </td>
                    <td>{Number(product.stock) || 0}</td>
                    <td>{formatMoney(product.price)}</td>
                    <td>
                      <input
                        className="ad-input bcu-cost"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        aria-label={`Unit cost for ${product.name}`}
                        value={product.costInput}
                        onChange={(event) => updateCost(product.productId, event.target.value)}
                        onInvalid={(event) => {
                          event.preventDefault();
                          setError(`Enter a valid non-negative unit cost for ${product.name}.`);
                        }}
                      />
                    </td>
                    <td>{valuation === null ? "—" : formatMoney(valuation)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="bcu-actions">
          <button type="submit" className="ad-btn primary" disabled={saving || refreshing || !pendingUpdates.length}>
            {saving ? "Saving…" : "Save All Changes"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default BulkCostUpdater;
