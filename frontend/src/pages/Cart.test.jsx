import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import API from "../api/axios";
import i18n from "../i18n";
import ToastNotifications from "../components/ToastNotifications";
import Cart from "./Cart";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { coupons: [] } }),
  },
}));

describe("Cart notifications", () => {
  it("shows a global toast after confirming item removal", async () => {
    API.get.mockImplementation((path) =>
      Promise.resolve({ data: path === "/coupons/available" ? { coupons: [] } : {} }),
    );
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <Cart
            cart={[
              {
                _id: "cart-product",
                name: "Cart headphones",
                price: 2500,
                quantity: 1,
                stock: 5,
              },
            ]}
            removeFromCart={vi.fn()}
            updateQuantity={vi.fn()}
          />
          <ToastNotifications />
        </MemoryRouter>
      </I18nextProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Remove/ }));
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));

    await waitFor(
      () => {
        expect(screen.getByRole("status")).toHaveTextContent(
          "Item removed from cart",
        );
      },
      { timeout: 1500 },
    );
  });
});
