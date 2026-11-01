export const FREE_SHIPPING_THRESHOLD = 1999;
export const FLAT_SHIPPING = 99;

// Display estimate only. The Cloud Function recomputes this at checkout.
export const estimateShipping = (subtotal: number) =>
  subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
