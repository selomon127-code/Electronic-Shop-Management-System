import { fn } from "storybook/test";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import i18n from "../i18n";
import ProductCard from "../components/ProductCard";

const image =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='240' viewBox='0 0 320 240'%3E%3Crect width='320' height='240' fill='%23f1f5f9'/%3E%3Ctext x='160' y='125' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2364748b'%3EHeadphones%3C/text%3E%3C/svg%3E";

const product = {
  _id: "storybook-product",
  name: "Wireless Noise-Cancelling Headphones",
  category: "Audio",
  price: 5000,
  stock: 12,
  image,
};

export default {
  title: "Shop/Product Card",
  component: ProductCard,
  decorators: [
    (Story) => (
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <div style={{ width: 280, minHeight: 420 }}>
            <Story />
          </div>
        </MemoryRouter>
      </I18nextProvider>
    ),
  ],
  args: {
    product,
    addToCart: fn(),
    user: null,
  },
};

export const InStock = {};

export const Discounted = {
  args: {
    product: { ...product, discount: 20 },
  },
};

export const OutOfStock = {
  args: {
    product: { ...product, stock: 0 },
  },
};
