const getDiscountedPrice = (price, discount = 0) =>
  Number((price * (1 - discount / 100)).toFixed(2));

module.exports = { getDiscountedPrice };
