/* eslint-disable no-unused-vars */
import React from 'react';
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, it, expect } from 'vitest';
import { http, HttpResponse } from "msw";
import App from './App';
import { server } from "./mocks/server";

const product = {
  _id: "cart-toast-product",
  name: "Cart toast headphones",
  price: 2500,
  stock: 5,
  category: "Audio",
  image: "",
};

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
    server.use(
      http.get("*/api/products", () => HttpResponse.json([product])),
    );
  });

  it('should render the app successfully', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it("shows a global toast when a signed-in user adds a product to the cart", async () => {
    localStorage.setItem("token", "test-token");
    localStorage.setItem("user", JSON.stringify({ id: "user-1", role: "customer" }));

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: /Add to Cart/ }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Added to Cart!");
    });
  });
});