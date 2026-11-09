import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminApi } from "../../api/adminApi";
import Coupons from "./Coupons";

vi.mock("../../api/adminApi", () => ({
  adminApi: {
    getCoupons: vi.fn(),
    createCoupon: vi.fn(),
    updateCoupon: vi.fn(),
    deactivateCoupon: vi.fn(),
  },
}));


describe("Admin coupon management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.getCoupons.mockResolvedValue({ data: [] });
  });

  it("creates a percentage coupon with optional limits left unset", async () => {
    adminApi.createCoupon.mockResolvedValue({ data: { code: "SAVE10" } });
    adminApi.getCoupons
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: [{ _id: "coupon-1", code: "SAVE10", type: "percentage", value: 10, isActive: true }],
      });

    render(<Coupons />);
    fireEvent.change(await screen.findByLabelText("Code"), {
      target: { value: "save10" },
    });
    fireEvent.change(screen.getByLabelText("Percent off"), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create coupon" }));

    await waitFor(() => {
      expect(adminApi.createCoupon).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "SAVE10",
          type: "percentage",
          value: 10,
          minimumSubtotal: 0,
          isActive: true,
        }),
      );
    });
    expect(await screen.findByText("SAVE10")).toBeInTheDocument();
  });
});
