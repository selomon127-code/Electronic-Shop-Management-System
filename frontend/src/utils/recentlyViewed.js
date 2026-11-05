const STORAGE_KEY = "recentlyViewedProducts";
const MAX_RECENT_PRODUCTS = 8;

export function getRecentlyViewedProducts() {
  try {
    const products = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(products)) return [];

    return products
      .filter((product) => product && product._id && product.name)
      .slice(0, MAX_RECENT_PRODUCTS);
  } catch (error) {
    console.error("Failed to read recently viewed products:", error);
    return [];
  }
}

export function trackRecentlyViewedProduct(product) {
  if (!product?._id || !product.name) return;

  const recentProduct = {
    _id: product._id,
    name: product.name,
    price: product.price,
    discount: product.discount,
    category: product.category,
    stock: product.stock,
    image: product.image,
    averageRating: product.averageRating,
    numReviews: product.numReviews,
  };
  const products = getRecentlyViewedProducts().filter(
    (item) => String(item._id) !== String(product._id),
  );

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([recentProduct, ...products].slice(0, MAX_RECENT_PRODUCTS)),
    );
  } catch (error) {
    console.error("Failed to save recently viewed product:", error);
  }
}
