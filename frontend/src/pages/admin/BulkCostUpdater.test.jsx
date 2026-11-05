import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminApi } from "../../api/adminApi";
import BulkCostUpdater from "./BulkCostUpdater";

vi.mock("../../api/adminApi", () => ({
  adminApi: {
    bulkUpdateProductCosts: vi.fn(),
    getProducts: vi.fn(),
  },
}));

const products = [
  {
    productId: "507f1f77bcf86cd799439011",
    name: "USB-C Charger",
    category: "Accessories",
    stock: 10,
    price: 100,
    unitCost: null,
  },
  {
    productId: "507f1f77bcf86cd799439012",
    name: "Wireless Mouse",
    category: "Accessories",
    stock: 5,
    price: 200,
    unitCost: 80,
  },
];

describe("BulkCostUpdater", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.bulkUpdateProductCosts.mockResolvedValue({
      data: { updatedCount: 1, matchedCount: 1 },
    });
    adminApi.getProducts.mockResolvedValue({ data: { products: [] } });
  });

  it("highlights missing costs and calculates live inventory and margin previews", () => {
    render(<BulkCostUpdater products={products} />);

    expect(screen.getByText("Missing unit cost")).toBeInTheDocument();
    expect(screen.getAllByText("400.00 ETB")).toHaveLength(2);
    expect(screen.getByText("60.0%")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("spinbutton", { name: "Unit cost for USB-C Charger" }), {
      target: { value: "50" },
    });
    expect(screen.getByText("900.00 ETB")).toBeInTheDocument();
    expect(screen.getByText("55.0%")).toBeInTheDocument();
    expect(screen.getByText("1", { selector: "strong" })).toBeInTheDocument();
  });

  it("saves only changed costs and shows success feedback", async () => {
    const onSaved = vi.fn();
    render(<BulkCostUpdater products={products} onSaved={onSaved} />);
    fireEvent.change(screen.getByRole("spinbutton", { name: "Unit cost for USB-C Charger" }), {
      target: { value: "50.25" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save All Changes" }));

    await waitFor(() => {
      expect(adminApi.bulkUpdateProductCosts).toHaveBeenCalledWith([
        { id: "507f1f77bcf86cd799439011", costPrice: 50.25 },
      ]);
    });
    expect(await screen.findByRole("status")).toHaveTextContent("1 product cost saved.");
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("blocks negative or invalid values before making the request", async () => {
    render(<BulkCostUpdater products={products} />);
    fireEvent.change(screen.getByRole("spinbutton", { name: "Unit cost for USB-C Charger" }), {
      target: { value: "-5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save All Changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/non-negative unit cost/);
    expect(adminApi.bulkUpdateProductCosts).not.toHaveBeenCalled();
  });

  it("shows server errors without discarding entered values", async () => {
    adminApi.bulkUpdateProductCosts.mockRejectedValue({
      response: { data: { message: "Product was not found." } },
    });
    render(<BulkCostUpdater products={products} />);
    const input = screen.getByRole("spinbutton", { name: "Unit cost for USB-C Charger" });
    fireEvent.change(input, { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: "Save All Changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Product was not found.");
    expect(input).toHaveValue(50);
  });

  it("refreshes stale products after a missing-ID response and preserves edits for current products", async () => {
    adminApi.bulkUpdateProductCosts.mockRejectedValueOnce({
      response: {
        status: 404,
        data: { message: "Product not found: 507f1f77bcf86cd799439011. No costs were updated." },
      },
    });
    adminApi.getProducts.mockResolvedValueOnce({
      data: {
        products: [{
          _id: "507f1f77bcf86cd799439012",
          name: "Wireless Mouse",
          category: "Accessories",
          stock: 5,
          price: 200,
          costPrice: 80,
        }],
      },
    });
    render(<BulkCostUpdater products={products} />);
    fireEvent.change(screen.getByRole("spinbutton", { name: "Unit cost for USB-C Charger" }), {
      target: { value: "50" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Unit cost for Wireless Mouse" }), {
      target: { value: "75" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save All Changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/catalog was refreshed/);
    expect(adminApi.getProducts).toHaveBeenCalledWith({ limit: 500 });
    expect(screen.queryByRole("spinbutton", { name: "Unit cost for USB-C Charger" })).not.toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Unit cost for Wireless Mouse" })).toHaveValue(75);

    fireEvent.click(screen.getByRole("button", { name: "Save All Changes" }));
    await waitFor(() => {
      expect(adminApi.bulkUpdateProductCosts).toHaveBeenLastCalledWith([
        { id: "507f1f77bcf86cd799439012", costPrice: 75 },
      ]);
    });
  });
});
