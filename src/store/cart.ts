import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  sku: string;
  productId: string;
  slug: string;
  name: string;
  colour: string;
  size: string;
  price: number;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  coupon: { code: string; discount: number } | null;
  setCoupon: (c: { code: string; discount: number } | null) => void;
  clear: () => void;
  add: (line: CartLine) => void;
  remove: (sku: string) => void;
  setQty: (sku: string, qty: number) => void;
}

// Guest cart in localStorage. Prices here are display-only; the server
// re-prices everything at checkout.
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      coupon: null,
      setCoupon: (coupon) => set({ coupon }),
      clear: () => set({ lines: [], coupon: null }),
      add: (line) =>
        set((s) => {
          const hit = s.lines.find((l) => l.sku === line.sku);
          return {
            lines: hit
              ? s.lines.map((l) => (l.sku === line.sku ? { ...l, qty: l.qty + line.qty } : l))
              : [...s.lines, line],
          };
        }),
      remove: (sku) => set((s) => ({ lines: s.lines.filter((l) => l.sku !== sku) })),
      setQty: (sku, qty) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.sku === sku ? { ...l, qty: Math.max(1, qty) } : l)),
        })),
    }),
    { name: "kameleon-cart" },
  ),
);
