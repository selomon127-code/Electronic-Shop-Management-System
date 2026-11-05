import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminApi } from "../../api/adminApi";
import i18n from "../../i18n";
import Reports from "./Reports";

vi.mock("../../api/adminApi", () => ({
  adminApi: {
    getReports: vi.fn(),
    recordSupplierPurchase: vi.fn(),
  },
}));

const reportData = {
  sales: [{ _id: "2026-11-01", orders: 2, revenue: 1000, discounts: 50 }],
  profitLoss: {
    revenue: 950,
    costOfGoodsSold: 500,
    grossProfit: 450,
    incompleteCostLines: 0,
    isComplete: true,
  },
  inventory: {
    valuation: 750,
    itemsWithoutCost: 0,
    items: [{ productId: "product-1", name: "Test phone", stock: 3, unitCost: 250, valuation: 750, unitsSold: 2 }],
  },
  stockMovements: [],
  bestSelling: [{ _id: "product-1", name: "Test phone", quantity: 2, revenue: 1000 }],
  slowMoving: [],
  customers: [],
  payments: [],
  supplierPurchases: [],
};

function renderReports() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Reports />
    </I18nextProvider>,
  );
}

describe("Reports & analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.getReports.mockResolvedValue({ data: reportData });
    adminApi.recordSupplierPurchase.mockResolvedValue({ data: {} });
  });

  it("loads the requested interval and displays reports", async () => {
    renderReports();
    expect(await screen.findByText("Sales report")).toBeInTheDocument();
    expect(adminApi.getReports).toHaveBeenCalledWith(expect.objectContaining({ interval: "day" }));

    fireEvent.change(screen.getByLabelText("Period"), { target: { value: "week" } });
    await waitFor(() => {
      expect(adminApi.getReports).toHaveBeenLastCalledWith(expect.objectContaining({ interval: "week" }));
    });
    expect(screen.getByText("Inventory valuation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export Excel (CSV)" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Export PDF" })).toBeEnabled();
  });

  it("records a supplier purchase with numeric quantity and unit cost", async () => {
    renderReports();
    await screen.findByText("Sales report");

    fireEvent.change(screen.getByLabelText(/Supplier/), { target: { value: "Local supplier" } });
    fireEvent.change(screen.getByLabelText(/Product/), { target: { value: "product-1" } });
    fireEvent.change(screen.getByLabelText(/Unit cost \(ETB\)/), { target: { value: "200" } });
    fireEvent.click(screen.getByRole("button", { name: "Record purchase" }));

    await waitFor(() => {
      expect(adminApi.recordSupplierPurchase).toHaveBeenCalledWith(expect.objectContaining({
        supplierName: "Local supplier",
        productId: "product-1",
        quantity: 1,
        unitCost: 200,
      }));
    });
  });
});
