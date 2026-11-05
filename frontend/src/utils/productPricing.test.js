import { describe, expect, it } from "vitest";
import { getDiscountedPrice } from "./productPricing";

describe("getDiscountedPrice", () => {
  it("returns the regular price when no discount is set", () => {
    expect(getDiscountedPrice({ price: 5000 })).toBe(5000);
  });

  it("applies percentage discounts and rounds to cents", () => {
    expect(getDiscountedPrice({ price: 5000, discount: 20 })).toBe(4000);
    expect(getDiscountedPrice({ price: 4999, discount: 20 })).toBe(3999.2);
  });

  it("returns zero for a full discount", () => {
    expect(getDiscountedPrice({ price: 5000, discount: 100 })).toBe(0);
  });

  it("treats missing or invalid discounts as no discount", () => {
    expect(getDiscountedPrice({ price: 5000, discount: "invalid" })).toBe(5000);
  });
});
