import { fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import API from "../api/axios";
import i18n from "../i18n";
import Home from "./Home";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("../components/WishlistButton", () => ({
  default: () => null,
}));

const recentProduct = {
  _id: "recent-product",
  name: "Recently viewed headphones",
  price: 2500,
  discount: 10,
  category: "Audio",
  stock: 4,
  image: "/headphones.jpg",
};

function renderHome() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <Home addToCart={vi.fn()} user={null} />
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("Home recently viewed products", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    API.get.mockResolvedValue({ data: [] });
  });

  it("shows previously viewed products using the saved product details", async () => {
    localStorage.setItem("recentlyViewedProducts", JSON.stringify([recentProduct]));

    renderHome();

    expect(
      await screen.findByRole("region", { name: "Recently Viewed Products" }),
    ).toBeInTheDocument();
    expect(screen.getByText(recentProduct.name)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(recentProduct.name) }))
      .toHaveAttribute("href", `/product/${recentProduct._id}`);
  });

  it("does not show an empty recently viewed section", async () => {
    renderHome();

    await screen.findByText("Featured Products");
    expect(
      screen.queryByRole("region", { name: "Recently Viewed Products" }),
    ).not.toBeInTheDocument();
  });

  it("refreshes the section when the homepage regains focus", async () => {
    renderHome();
    await screen.findByText("Featured Products");

    localStorage.setItem("recentlyViewedProducts", JSON.stringify([recentProduct]));
    fireEvent.focus(window);

    expect(
      await screen.findByRole("region", { name: "Recently Viewed Products" }),
    ).toBeInTheDocument();
    expect(screen.getByText(recentProduct.name)).toBeInTheDocument();
  });
});
