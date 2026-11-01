export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export const discountPercent = (price: number, original: number) =>
  original > price ? Math.round(((original - price) / original) * 100) : 0;
