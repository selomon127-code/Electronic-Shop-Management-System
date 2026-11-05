export function getDiscountedPrice(product) {
  const price = Number(product?.price);
  const discount = Number(product?.discount) || 0;
  const safeDiscount = Math.min(100, Math.max(0, discount));

  if (!Number.isFinite(price)) return 0;
  return Number((price * (1 - safeDiscount / 100)).toFixed(2));
}
