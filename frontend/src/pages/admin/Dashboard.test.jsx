import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminApi } from "../../api/adminApi";
import i18n from "../../i18n";
import Dashboard from "./Dashboard";

vi.mock("../../api/adminApi", () => ({
  adminApi: {
    getDashboard: vi.fn(),
    getRevenueAnalytics: vi.fn(),
    getSalesForecast: vi.fn(),
    getStockPredictions: vi.fn(),
    getCustomerInsights: vi.fn(),
  },
}));

const dashboardData = {
  stats: {},
  ordersByStatus: {},
  recentOrders: [],
};

const analyticsData = (range) => ({
  range,
  currency: "ETB",
  totalRevenue: 1200,
  totalOrders: 2,
  averageOrderValue: 600,
  revenueSeries: [
    { period: "2025-01-01", revenue: 600, orders: 1 },
    { period: "2025-01-02", revenue: 600, orders: 1 },
  ],
  paymentBreakdown: [{ method: "chapa", revenue: 1200, orders: 2 }],
});

function renderDashboard() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Dashboard />
    </I18nextProvider>,
  );
}

describe("Admin revenue analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.getDashboard.mockResolvedValue({ data: dashboardData });
    adminApi.getRevenueAnalytics.mockImplementation((range) =>
      Promise.resolve({ data: analyticsData(range) }),
    );
    adminApi.getSalesForecast.mockResolvedValue({
      data: { observed: [], forecast: [], expectedRevenue30d: 0, seasonality: {} },
    });
    adminApi.getStockPredictions.mockResolvedValue({
      data: { lowStock: [], slowMoving: [] },
    });
    adminApi.getCustomerInsights.mockResolvedValue({
      data: { segments: [] },
    });
  });

  it("loads the paid revenue chart and updates it when the period changes", async () => {
    renderDashboard();

    expect(await screen.findByRole("img", { name: "Revenue over time" })).toBeInTheDocument();
    expect(screen.getAllByText("1,200.00 ETB")).toHaveLength(2);
    expect(adminApi.getRevenueAnalytics).toHaveBeenCalledWith("30d");

    fireEvent.change(screen.getByRole("combobox", { name: "Revenue chart period" }), {
      target: { value: "7d" },
    });

    await waitFor(() => {
      expect(adminApi.getRevenueAnalytics).toHaveBeenCalledWith("7d");
    });
  });
});
