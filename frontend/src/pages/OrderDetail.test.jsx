import { render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import API from "../api/axios";
import i18n from "../i18n";
import OrderDetail from "./OrderDetail";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const order = (overrides = {}) => ({
  _id: "order-123456",
  createdAt: "2026-11-05T10:00:00.000Z",
  status: "pending",
  paymentStatus: "pending",
  paymentMethod: "cod",
  totalPrice: 1250,
  subtotal: 1250,
  shippingFee: 0,
  products: [],
  user: { name: "Customer", email: "customer@example.test" },
  shippingAddress: { fullName: "Customer", street: "Main Street", city: "Addis Ababa" },
  ...overrides,
});

function renderOrderDetail() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/orders/order-123456"]}>
        <Routes>
          <Route path="/orders/:id" element={<OrderDetail addToCart={vi.fn()} />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("OrderDetail tracking timeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a COD timeline without suggesting payment is pending", async () => {
    API.get.mockResolvedValue({ data: order() });
    renderOrderDetail();

    expect(await screen.findByRole("heading", { name: "Track your order" })).toBeInTheDocument();
    const steps = await screen.findAllByRole("listitem");
    expect(steps).toHaveLength(4);
    expect(steps[0]).toHaveTextContent("Pending");
    expect(steps[0]).toHaveAttribute("aria-current", "step");
    expect(steps.map((step) => step.textContent).join(" ")).not.toContain("Pending payment");
  });

  it("shows payment as the first stage for an online order", async () => {
    API.get.mockResolvedValue({
      data: order({ status: "pending_payment", paymentMethod: "chapa" }),
    });
    renderOrderDetail();

    const steps = await screen.findAllByRole("listitem");
    expect(steps[0]).toHaveTextContent("Pending payment");
    expect(steps[0]).toHaveAttribute("aria-current", "step");
  });

  it("explains cancelled orders instead of showing an active delivery timeline", async () => {
    API.get.mockResolvedValue({ data: order({ status: "cancelled", paymentStatus: "cancelled" }) });
    renderOrderDetail();

    expect(await screen.findByText("This order was cancelled")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("listitem")).not.toBeInTheDocument());
  });
});
