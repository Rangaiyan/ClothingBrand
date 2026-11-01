import { OrderError } from "../errors";

export interface StockVariant {
  sku: string;
  stock: number;
  [k: string]: unknown;
}

/** Returns a new variants array with `delta` applied per SKU. Never lets stock go negative. */
export function applyStockDeltas<T extends StockVariant>(
  variants: T[],
  deltas: { sku: string; delta: number }[],
): T[] {
  const next = variants.map((v) => ({ ...v }));
  for (const { sku, delta } of deltas) {
    const v = next.find((x) => x.sku === sku);
    if (!v) throw new OrderError("not-found", `Unknown SKU ${sku}.`);
    if (v.stock + delta < 0) throw new OrderError("failed-precondition", `Not enough stock for ${sku}.`);
    v.stock += delta;
  }
  return next;
}
