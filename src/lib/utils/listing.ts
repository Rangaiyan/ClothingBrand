import type { SortKey } from "@/services/catalog";

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const SORTS: SortKey[] = ["featured", "newest", "best", "price-asc", "price-desc"];

export function parseListingParams(sp: Params) {
  const sort = one(sp.sort) as SortKey | undefined;
  const maxPrice = Number(one(sp.maxPrice));
  return {
    values: {
      colour: one(sp.colour),
      size: one(sp.size),
      maxPrice: one(sp.maxPrice),
      inStock: one(sp.inStock),
      sort: one(sp.sort),
      q: one(sp.q),
    },
    query: {
      sort: sort && SORTS.includes(sort) ? sort : undefined,
      colour: one(sp.colour) || undefined,
      size: one(sp.size) || undefined,
      maxPrice: maxPrice > 0 ? maxPrice : undefined,
      inStock: one(sp.inStock) === "1",
      q: one(sp.q) || undefined,
    },
  };
}
