import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "../../i18n";
import { adminApi } from "../../api/adminApi";
import EditProduct from "./EditProduct";

vi.mock("../../api/adminApi", () => ({
  adminApi: {
    getProduct: vi.fn(),
    updateProduct: vi.fn(),
  },
}));

const existingProduct = {
  _id: "product-1",
  name: "Test phone",
  price: 1000,
  discount: 0,
  category: "Smartphones",
  description: "Test description",
  stock: 5,
  image: "",
};

function renderEditProduct() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/admin/edit-product/product-1"]}>
        <Routes>
          <Route
            path="/admin/edit-product/:id"
            element={<EditProduct />}
          />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("EditProduct discount persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.getProduct.mockResolvedValue({ data: existingProduct });
  });

  it("sends the chosen percentage and confirms it in the saved product", async () => {
    adminApi.updateProduct.mockResolvedValue({ data: { message: "Updated" } });
    adminApi.getProduct
      .mockResolvedValueOnce({ data: existingProduct })
      .mockResolvedValueOnce({
      data: { product: { ...existingProduct, discount: 20 } },
    });

    const { container } = renderEditProduct();
    const discountInput = await screen.findByDisplayValue("0");
    fireEvent.change(discountInput, { target: { value: "20" } });
    fireEvent.submit(container.querySelector("form"));

    await waitFor(() => {
      expect(adminApi.updateProduct).toHaveBeenCalledWith(
        "product-1",
        expect.objectContaining({ discount: 20 }),
      );
    });
    expect(adminApi.getProduct).toHaveBeenCalledTimes(2);
    expect(await screen.findByText(/20% discount saved/)).toBeInTheDocument();
  });

  it("shows an error instead of success when the server returns a different discount", async () => {
    adminApi.updateProduct.mockResolvedValue({ data: { message: "Updated" } });
    adminApi.getProduct
      .mockResolvedValueOnce({ data: existingProduct })
      .mockResolvedValueOnce({ data: existingProduct });

    const { container } = renderEditProduct();
    const discountInput = await screen.findByDisplayValue("0");
    fireEvent.change(discountInput, { target: { value: "20" } });
    fireEvent.submit(container.querySelector("form"));

    expect(
      await screen.findByText(/requested 20%, but the API returned 0%/i),
    ).toBeInTheDocument();
  });
});
