import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminApi } from "../../api/adminApi";
import AIAnalyticsWidget from "./AIAnalyticsWidget";

vi.mock("../../api/adminApi", () => ({
  adminApi: {
    getSalesForecast: vi.fn(),
    getStockPredictions: vi.fn(),
    getCustomerInsights: vi.fn(),
  },
}));

describe("Business Owner AI analytics widget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.getSalesForecast.mockResolvedValue({
      data: {
        expectedRevenue30d: 25000,
        trend: "increasing",
        confidence: "moderate",
        activeSalesDays: 40,
        observed: [{ date: "2026-11-01", revenue: 800, orders: 1 }],
        forecast: [{ date: "2026-11-05", revenue: 900 }],
        seasonality: { insight: "Friday has the highest average sales." },
      },
    });
    adminApi.getStockPredictions.mockResolvedValue({
      data: {
        lowStockCount: 1,
        slowMovingCount: 0,
        lowStock: [{
          _id: "p1",
          name: "USB-C Charger",
          stock: 5,
          daysToOutOfStock: 5,
          monthlyBurnRate: 30,
          recommendedRestockQuantity: 55,
        }],
        slowMoving: [],
      },
    });
    adminApi.getCustomerInsights.mockResolvedValue({
      data: {
        totalCustomers: 3,
        purchasingCustomers: 2,
        segments: [{
          key: "high_value",
          label: "High-Value VIP",
          count: 1,
          totalSpend: 25000,
          suggestion: "Offer a loyalty reward.",
        }],
      },
    });
  });

  it("shows a historical sales forecast and seasonality note", async () => {
    render(<AIAnalyticsWidget />);

    expect(await screen.findByRole("img", { name: "Sales forecast chart" })).toBeInTheDocument();
    expect(screen.getByText("25,000 ETB")).toBeInTheDocument();
    expect(screen.getByText(/Friday has the highest average sales/)).toBeInTheDocument();
    expect(adminApi.getSalesForecast).toHaveBeenCalledWith("day");

    fireEvent.change(screen.getByRole("combobox", { name: "Forecast history grouping" }), {
      target: { value: "week" },
    });
    await waitFor(() => expect(adminApi.getSalesForecast).toHaveBeenCalledWith("week"));
  });

  it("shows restock recommendations and customer segments in their tabs", async () => {
    render(<AIAnalyticsWidget />);

    fireEvent.click(await screen.findByRole("tab", { name: "Inventory predictions" }));
    expect(await screen.findByText("USB-C Charger")).toBeInTheDocument();
    expect(screen.getByText("Restock 55")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Customer insights" }));
    expect(await screen.findByText(/High-Value VIP · 1/)).toBeInTheDocument();
    expect(screen.getByText("Offer a loyalty reward.")).toBeInTheDocument();
  });

  it("keeps other analytics available when one endpoint fails", async () => {
    adminApi.getStockPredictions.mockRejectedValue({
      response: { data: { message: "Stock data is unavailable." } },
    });
    render(<AIAnalyticsWidget />);

    fireEvent.click(await screen.findByRole("tab", { name: "Inventory predictions" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Stock data is unavailable.");
    fireEvent.click(screen.getByRole("tab", { name: "Sales forecast" }));
    await waitFor(() => expect(screen.getByRole("img", { name: "Sales forecast chart" })).toBeInTheDocument());
  });
});
