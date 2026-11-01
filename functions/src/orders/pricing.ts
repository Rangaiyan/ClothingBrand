import { couponDiscount, type Coupon } from "../coupons/calc";
import { OrderError } from "../errors";

export const FREE_SHIPPING_THRESHOLD = 1999;
export const FLAT_SHIPPING = 99;
export const MAX_QTY_PER_LINE = 10;
export const MAX_LINES = 20;

export interface RequestedItem {
  productId: string;
  sku: string;
  qty: number;
}

export interface CatalogVariant {
  productId: string;
  sku: string;
  name: string;
  colour: string;
  size: string;
  price: number;
  stock: number;
}

export interface PricedLine extends CatalogVariant {
  qty: number;
}

export interface PricedOrder {
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

export const shippingFor = (subtotal: number) =>
  subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;

/** Merges duplicate SKUs and enforces quantity bounds. */
export function normaliseItems(items: RequestedItem[]): RequestedItem[] {
  if (!items.length) throw new OrderError("invalid-argument", "Your bag is empty.");
  const merged = new Map<string, RequestedItem>();
  for (const it of items) {
    if (!Number.isInteger(it.qty) || it.qty < 1)
      throw new OrderError("invalid-argument", "Invalid quantity.");
    const key = `${it.productId}:${it.sku}`;
    const hit = merged.get(key);
    merged.set(key, hit ? { ...hit, qty: hit.qty + it.qty } : { ...it });
  }
  const out = [...merged.values()];
  if (out.length > MAX_LINES) throw new OrderError("invalid-argument", "Too many items in one order.");
  if (out.some((l) => l.qty > MAX_QTY_PER_LINE))
    throw new OrderError("invalid-argument", `You can order at most ${MAX_QTY_PER_LINE} of one item.`);
  return out;
}

/**
 * Prices an order entirely from server-side catalogue data. Prices and stock
 * are looked up by `lookup`; anything the client claimed about price is ignored.
 */
export function priceOrder(
  items: RequestedItem[],
  lookup: (productId: string, sku: string) => CatalogVariant | undefined,
  coupon: { coupon: Coupon; userUses: number } | undefined,
  now: Date,
): PricedOrder {
  const lines: PricedLine[] = normaliseItems(items).map((it) => {
    const v = lookup(it.productId, it.sku);
    if (!v) throw new OrderError("not-found", "An item in your bag is no longer available.");
    if (v.stock < it.qty)
      throw new OrderError("failed-precondition", `Only ${v.stock} left of ${v.name} (${v.colour}, ${v.size}).`);
    return { ...v, qty: it.qty };
  });

  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const discount = coupon ? couponDiscount(coupon.coupon, subtotal, coupon.userUses, now) : 0;
  const shipping = shippingFor(subtotal);
  return { lines, subtotal, discount, shipping, total: subtotal - discount + shipping };
}
