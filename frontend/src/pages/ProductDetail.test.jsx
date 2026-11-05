import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import API from "../api/axios";
import i18n from "../i18n";
import ProductDetail from "./ProductDetail";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("../components/WishlistButton", () => ({
  default: () => null,
}));

const product = {
  _id: "product-1",
  name: "Reviewable phone",
  price: 1000,
  discount: 0,
  category: "Smartphones",
  description: "Test product",
  stock: 3,
  image: "",
};

const review = {
  _id: "review-1",
  rating: 5,
  comment: "Works very well",
  user: { name: "Sam" },
  createdAt: "2026-11-04T00:00:00.000Z",
  images: [{ url: "https://images.example.test/review.jpg" }],
};

function renderProductDetail(user = null) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/product/product-1"]}>
        <Routes>
          <Route
            path="/product/:id"
            element={
              <ProductDetail addToCart={vi.fn()} user={user} />
            }
          />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe("ProductDetail reviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    API.get.mockImplementation((path) =>
      Promise.resolve({
        data: path.startsWith("/products/") ? product : [review],
      }),
    );
    API.post.mockResolvedValue({ data: { message: "Review created" } });
  });

  it("shows customer review photos and requests selected sorting and rating filters", async () => {
    renderProductDetail();

    expect(
      await screen.findByAltText("Photo 1 in Sam's review"),
    ).toHaveAttribute("src", review.images[0].url);
    expect(JSON.parse(localStorage.getItem("recentlyViewedProducts"))[0]).toMatchObject({
      _id: product._id,
      name: product.name,
    });

    fireEvent.change(screen.getByLabelText("Sort by"), {
      target: { value: "highest" },
    });
    fireEvent.change(screen.getByLabelText("Filter by rating"), {
      target: { value: "5" },
    });

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith(
        "/reviews/product-1",
        { params: { sort: "highest", rating: "5" } },
      );
    });
  });

  it("submits a signed-in customer's rating, comment, and selected photo", async () => {
    renderProductDetail({ name: "Customer" });

    fireEvent.click(await screen.findByRole("button", { name: "5 stars" }));
    fireEvent.change(screen.getByLabelText("Your review"), {
      target: { value: "Excellent phone" },
    });
    const file = new File(["photo"], "phone.webp", { type: "image/webp" });
    fireEvent.change(screen.getByLabelText("Photos"), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit review" }));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith(
        "/reviews",
        expect.any(FormData),
        expect.objectContaining({
          headers: { "Content-Type": "multipart/form-data" },
        }),
      );
    });

    const submittedForm = API.post.mock.calls[0][1];
    expect(submittedForm.get("productId")).toBe("product-1");
    expect(submittedForm.get("rating")).toBe("5");
    expect(submittedForm.get("comment")).toBe("Excellent phone");
    expect(submittedForm.get("images")).toBe(file);
    expect(await screen.findByText("Your review was submitted.")).toBeInTheDocument();
  });
});
