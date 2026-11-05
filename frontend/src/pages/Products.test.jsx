import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import API from "../api/axios";
import i18n from "../i18n";
import Products from "./Products";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const product = {
  _id: "laptop-1",
  name: "Programming Laptop",
  price: 42000,
  category: "Laptops",
  stock: 2,
  image: "",
};

describe("natural-language product search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    API.get.mockResolvedValue({ data: [product] });
    API.post.mockResolvedValue({ data: { products: [product] } });
  });

  it("sends a natural-language query to the AI search endpoint and renders its results", async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <Products addToCart={vi.fn()} user={null} />
        </MemoryRouter>
      </I18nextProvider>,
    );

    fireEvent.change(await screen.findByLabelText(/AI product search/), {
      target: { value: "Laptop for programming under 50,000 ETB" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith("/ai/search", {
        query: "Laptop for programming under 50,000 ETB",
      });
    });
    expect(await screen.findByRole("heading", { name: "AI search results (1)" })).toBeInTheDocument();
  });

  it("uses natural-language search for the normal catalog search box", async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={["/products?search=Laptop%20for%20programming%20under%2050%2C000%20ETB"]}>
          <Products addToCart={vi.fn()} user={null} />
        </MemoryRouter>
      </I18nextProvider>,
    );

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith("/ai/search", {
        query: "Laptop for programming under 50,000 ETB",
      });
    });
    expect(await screen.findByText("Programming Laptop")).toBeInTheDocument();
  });
});
