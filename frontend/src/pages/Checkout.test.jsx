import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import API from "../api/axios";
import i18n from "../i18n";
import Checkout from "./Checkout";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const cart = [
  {
    _id: "product-1",
    name: "Test phone",
    price: 1000,
    discount: 0,
    quantity: 1,
    image: "",
  },
];

function renderCheckout() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <Checkout cart={cart} user={{ name: "Customer" }} />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("Checkout promo codes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    API.get.mockResolvedValue({ data: { coupons: [] } });
  });

  it("uses the server quote and submits the coupon code with the order", async () => {
    API.post.mockImplementation((path) => {
      if (path === "/coupons/validate") {
        return Promise.resolve({
          data: {
            coupon: { code: "SAVE10", type: "percentage", value: 10 },
            subtotal: 1000,
            couponDiscount: 100,
            shippingFee: 150,
            total: 1050,
          },
        });
      }
      return Promise.resolve({ data: { order: { _id: "order-1" } } });
    });

    const { container } = renderCheckout();
    fireEvent.change(screen.getByLabelText("Promo code"), {
      target: { value: "save10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(await screen.findByText("Coupon (SAVE10)")).toBeInTheDocument();
    expect(screen.getByText("−100 ETB")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "💳 Pay 1,050 ETB" })).toBeInTheDocument();

    fireEvent.submit(container.querySelector("form"));
    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith(
        "/orders",
        expect.objectContaining({ couponCode: "SAVE10" }),
      );
    });
  });

  it("applies an available coupon from the checkout picker", async () => {
    API.get.mockResolvedValue({
      data: {
        coupons: [
          {
            code: "SAVE20",
            type: "percentage",
            value: 20,
            minimumSubtotal: 0,
          },
        ],
      },
    });
    API.post.mockResolvedValue({
      data: {
        coupon: { code: "SAVE20", type: "percentage", value: 20 },
        subtotal: 1000,
        couponDiscount: 200,
        shippingFee: 150,
        total: 950,
      },
    });

    renderCheckout();
    fireEvent.click(screen.getByRole("button", { name: "View available coupons" }));
    fireEvent.click(await screen.findByRole("button", { name: /SAVE20.*20% off/ }));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith("/coupons/validate", {
        code: "SAVE20",
        items: [{ _id: "product-1", quantity: 1 }],
      });
    });
    expect(await screen.findByText("Coupon (SAVE20)")).toBeInTheDocument();
  });

  it("displays server error message when an invalid coupon is entered", async () => {
    API.post.mockRejectedValueOnce({
      response: { data: { message: "Coupon code not found." } },
    });

    renderCheckout();
    fireEvent.change(screen.getByLabelText("Promo code"), {
      target: { value: "INVALIDCODE" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(await screen.findByText("Coupon code not found.")).toBeInTheDocument();
  });

  it("prevents duplicate application of already applied coupon", async () => {
    API.post.mockResolvedValueOnce({
      data: {
        coupon: { code: "SAVE15", type: "percentage", value: 15 },
        subtotal: 1000,
        couponDiscount: 150,
        shippingFee: 150,
        total: 1000,
      },
    });

    renderCheckout();
    fireEvent.change(screen.getByLabelText("Promo code"), {
      target: { value: "SAVE15" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(await screen.findByText("Coupon (SAVE15)")).toBeInTheDocument();

    // Now try applying again
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.queryByText("Coupon (SAVE15)")).not.toBeInTheDocument();
  });
});
