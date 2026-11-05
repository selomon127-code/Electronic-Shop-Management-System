import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import API from "../api/axios";
import CouponPromotions, { PromotionalBanner } from "./CouponPromotions";
import { CouponCard } from "./CouponCard";
import PromoCodeInput from "./PromoCodeInput";
import CouponAppliedMessage from "./CouponAppliedMessage";
import CouponErrorMessage from "./CouponErrorMessage";
import CouponSelector from "./CouponSelector";

vi.mock("../api/axios", () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

describe("customer coupon promotions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    API.get.mockResolvedValue({
      data: {
        coupons: [
          {
            code: "SAVE20",
            type: "percentage",
            value: 20,
            minimumSubtotal: 2000,
          },
        ],
      },
    });
  });

  it("shows active offers and confirms when a code is copied", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    render(<CouponPromotions />);

    expect(await screen.findByText("20% off on orders over 2,000 ETB")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("SAVE20");
    expect(await screen.findByRole("button", { name: "Copied!" })).toBeInTheDocument();
  });

  it("shows an explicit message if active coupons cannot be loaded", async () => {
    API.get.mockRejectedValueOnce(new Error("network unavailable"));

    render(<CouponPromotions />);

    expect(
      await screen.findByText("Promotions are temporarily unavailable."),
    ).toBeInTheDocument();
  });

  it("renders multiple active promotions in a horizontally scrollable strip with navigation", async () => {
    API.get.mockResolvedValueOnce({
      data: {
        coupons: [
          {
            code: "DEAL10",
            type: "percentage",
            value: 10,
            minimumSubtotal: 1000,
          },
          {
            code: "FLAT150",
            type: "fixed",
            value: 150,
            minimumSubtotal: 0,
          },
        ],
      },
    });

    render(<PromotionalBanner />);

    expect(await screen.findByText("10% off on orders over 1,000 ETB")).toBeInTheDocument();
    expect(screen.getByText("150 ETB off")).toBeInTheDocument();
    expect(screen.getByText("150 ETB OFF")).toBeInTheDocument();
    expect(screen.getByText("2 active offers")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Promotion cards" })).toBeInTheDocument();
  });

  it("renders nothing when no coupons are available", async () => {
    API.get.mockResolvedValueOnce({ data: { coupons: [] } });

    const { container } = render(<PromotionalBanner />);
    await waitFor(() => {
      expect(API.get).toHaveBeenCalled();
    });
    expect(container.firstChild).toBeNull();
  });
});

describe("Coupon modular components", () => {
  it("renders CouponCard with copy and apply capabilities", async () => {
    const handleApply = vi.fn();
    render(
      <CouponCard
        coupon={{
          code: "FESTIVE50",
          type: "fixed",
          value: 50,
          minimumSubtotal: 500,
        }}
        onApply={handleApply}
        showApplyButton
      />,
    );

    expect(screen.getByText("50 ETB off on orders over 500 ETB")).toBeInTheDocument();
    expect(screen.getByText("FESTIVE50")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(handleApply).toHaveBeenCalledWith("FESTIVE50");
  });

  it("renders PromoCodeInput and fires onApply when user clicks Apply or presses Enter", () => {
    const handleApply = vi.fn();
    const handleChange = vi.fn();

    render(
      <PromoCodeInput
        value="TESTCODE"
        onChange={handleChange}
        onApply={handleApply}
        onRemove={vi.fn()}
      />,
    );

    const input = screen.getByLabelText("Promo code");
    expect(input).toHaveValue("TESTCODE");

    fireEvent.keyDown(input, { key: "Enter" });
    expect(handleApply).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(handleApply).toHaveBeenCalledTimes(2);
  });

  it("renders CouponAppliedMessage with discount savings and remove action", () => {
    const handleRemove = vi.fn();
    render(
      <CouponAppliedMessage
        appliedCoupon={{
          coupon: { code: "MEGA100", type: "fixed", value: 100 },
          couponDiscount: 100,
        }}
        onRemove={handleRemove}
        showRemoveButton
      />,
    );

    expect(screen.getByText(/Coupon/)).toHaveTextContent("MEGA100");
    expect(screen.getByText(/You save/)).toHaveTextContent("100 ETB");
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(handleRemove).toHaveBeenCalled();
  });

  it("renders CouponErrorMessage with role=status", () => {
    render(<CouponErrorMessage message="This coupon has expired." />);
    expect(screen.getByRole("status")).toHaveTextContent("This coupon has expired.");
  });

  it("renders CouponSelector and allows selecting a coupon", async () => {
    API.get.mockResolvedValueOnce({
      data: {
        coupons: [
          {
            code: "SEL20",
            type: "percentage",
            value: 20,
            minimumSubtotal: 0,
          },
        ],
      },
    });

    const handleSelect = vi.fn();
    render(<CouponSelector onSelectCoupon={handleSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /View available coupons/ }));
    const couponButton = await screen.findByRole("button", { name: /SEL20/ });
    fireEvent.click(couponButton);
    expect(handleSelect).toHaveBeenCalledWith("SEL20");
  });
});
