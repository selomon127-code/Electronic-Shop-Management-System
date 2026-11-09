import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import API from "../api/axios";
import i18n from "../i18n";
import OrderHistory from "./OrderHistory";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const pendingOrder = {
  _id: "507f1f77bcf86cd799439011",
  createdAt: "2026-11-05T10:00:00.000Z",
  status: "pending",
  paymentStatus: "pending",
  totalPrice: 500,
  products: [{ name: "Charger", quantity: 1, price: 500 }],
};

const deliveredOrder = {
  _id: "507f1f77bcf86cd799439022",
  createdAt: "2026-11-01T10:00:00.000Z",
  status: "delivered",
  paymentStatus: "paid",
  totalPrice: 2500,
  products: [{ name: "Speaker", quantity: 1, price: 2500 }],
};

function renderHistory() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <OrderHistory />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("Order history receipt download", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("en");
    window.URL.createObjectURL = vi.fn(() => "blob:receipt");
    window.URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = () => {};
  });

  it("shows Download Receipt beside Cancel for pending orders and as the action for delivered orders", async () => {
    API.get.mockResolvedValue({ data: [pendingOrder, deliveredOrder] });
    renderHistory();

    const downloadButtons = await screen.findAllByRole("button", { name: "Download Receipt" });
    expect(downloadButtons).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Cancel Order" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Cancel Order" })).toHaveLength(1);

    const pendingCard = screen.getByText("#439011").parentElement.parentElement.parentElement;
    expect(pendingCard).toContainElement(screen.getByRole("button", { name: "Cancel Order" }));
    expect(pendingCard).toContainElement(downloadButtons[0]);
  });

  it("downloads the receipt blob and shows a loading label while the request is in flight", async () => {
    let resolveReceipt;
    API.get.mockImplementation((url) => {
      if (String(url).includes("/receipt")) {
        return new Promise((resolve) => {
          resolveReceipt = resolve;
        });
      }
      return Promise.resolve({ data: [deliveredOrder] });
    });
    const user = userEvent.setup();
    renderHistory();

    const button = await screen.findByRole("button", { name: "Download Receipt" });
    await user.click(button);

    expect(button).toHaveTextContent("Downloading...");
    expect(button).toBeDisabled();
    expect(API.get).toHaveBeenCalledWith(
      `/orders/${deliveredOrder._id}/receipt`,
      { responseType: "blob" },
    );

    resolveReceipt({ data: new Blob(["%PDF-1.4"], { type: "application/pdf" }) });

    await waitFor(() => expect(button).toHaveTextContent("Download Receipt"));
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:receipt");
  });

  it("shows an error notification when the receipt download fails", async () => {
    API.get.mockImplementation((url) => {
      if (String(url).includes("/receipt")) {
        return Promise.reject(new Error("network down"));
      }
      return Promise.resolve({ data: [pendingOrder] });
    });
    const user = userEvent.setup();
    renderHistory();

    await user.click(await screen.findByRole("button", { name: "Download Receipt" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not download the receipt. Please try again.",
    );
    expect(screen.getByRole("button", { name: "Download Receipt" })).toBeEnabled();
  });
});
