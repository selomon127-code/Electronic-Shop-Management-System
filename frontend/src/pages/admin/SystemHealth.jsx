import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "../../api/adminApi";
import {
  AdminStyles, ErrorBanner, PageHeader, TableSkeleton,
} from "./adminUi";

function SystemHealth() {
  const { t } = useTranslation();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHealth = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await adminApi.getSystemHealth();
      setHealth(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || t("admin.failed_load_system_health"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  return (
    <div className="ad">
      <AdminStyles />
      <PageHeader title={t("admin.system_health")} subtitle={t("admin.system_health_subtitle")}>
        <button className="ad-btn" onClick={loadHealth} disabled={loading}>{t("admin.refresh")}</button>
      </PageHeader>
      {error && <ErrorBanner message={error} onRetry={loadHealth} />}
      {loading && !health ? (
        <TableSkeleton />
      ) : health ? (
        <div className="ad-card" style={{ padding: "1.5rem", maxWidth: 640 }}>
          <dl className="ad-kv" style={{ margin: 0 }}>
            <dt>{t("admin.application")}</dt>
            <dd>{health.status}</dd>
            <dt>{t("admin.database")}</dt>
            <dd>{health.database}</dd>
            <dt>Node.js</dt>
            <dd>{health.nodeVersion}</dd>
            <dt>{t("admin.process_uptime")}</dt>
            <dd>{Math.floor(health.uptime)} seconds</dd>
            <dt>{t("admin.checked_at")}</dt>
            <dd>{new Date(health.timestamp).toLocaleString()}</dd>
          </dl>
        </div>
      ) : null}
    </div>
  );
}

export default SystemHealth;
