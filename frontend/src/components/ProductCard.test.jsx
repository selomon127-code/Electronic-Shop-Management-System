import { fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import i18n from "../i18n";
import ProductCard from "./ProductCard";

describe("ProductCard discounts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the discount percentage, sale price, and original price", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <ProductCard
            product={{
              _id: "discounted-product",
              name: "Discounted headphones",
              category: "Audio",
              price: 5000,
              discount: 20,
              stock: 5,
              image: "",
            }}
            addToCart={() => {}}
            user={null}
          />
        </MemoryRouter>
      </I18nextProvider>,
    );

    expect(
      screen.getByText(
        (_, element) =>
          element.tagName === "SPAN" && element.textContent.trim() === "-20%",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("4,000 ETB")).toBeInTheDocument();
    expect(screen.getByText("5,000", { selector: "span" })).toHaveStyle({
      textDecoration: "line-through",
    });
  });

  it("records a product when its card is opened", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <ProductCard
            product={{
              _id: "recent-product",
              name: "Recently viewed headphones",
              category: "Audio",
              price: 2500,
              discount: 10,
              stock: 4,
              image: "/headphones.jpg",
            }}
            addToCart={() => {}}
            user={null}
          />
        </MemoryRouter>
      </I18nextProvider>,
    );

    fireEvent.click(screen.getByRole("link", { name: /Recently viewed headphones/ }));

    expect(JSON.parse(localStorage.getItem("recentlyViewedProducts"))[0]).toMatchObject({
      _id: "recent-product",
      name: "Recently viewed headphones",
    });
  });
});
