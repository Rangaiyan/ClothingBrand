import { cacheLife, cacheTag } from "next/cache";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type { Category, Product } from "@/types";
import { seedCategories, seedProducts } from "./seed-data";

// Single seam for catalogue reads. Uses Firestore when Firebase is configured,
// otherwise the bundled seed data. Cached for about a minute, so admin edits
// reach the storefront shortly after saving.

async function loadProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  if (!isFirebaseConfigured) return seedProducts.filter((p) => p.published);
  const snap = await getDocs(query(collection(getDb(), "products"), where("published", "==", true)));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Product, "id">), id: d.id }));
}

async function loadCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  if (!isFirebaseConfigured) return seedCategories;
  const snap = await getDocs(query(collection(getDb(), "categories"), where("visible", "==", true)));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Category, "id">), id: d.id }));
}

export type SortKey = "featured" | "newest" | "best" | "price-asc" | "price-desc";

export async function getCategories(): Promise<Category[]> {
  return (await loadCategories()).sort((a, b) => a.order - b.order);
}

export async function getProducts(opts: {
  category?: string;
  sort?: SortKey;
  q?: string;
  inStock?: boolean;
  colour?: string;
  maxPrice?: number;
  featured?: boolean;
  bestSeller?: boolean;
  limit?: number;
} = {}): Promise<Product[]> {
  let list = await loadProducts();
  if (opts.category) list = list.filter((p) => p.category === opts.category);
  if (opts.featured) list = list.filter((p) => p.featured);
  if (opts.bestSeller) list = list.filter((p) => p.bestSeller);
  if (opts.inStock) list = list.filter((p) => p.variants.some((v) => v.stock > 0));
  if (opts.colour) list = list.filter((p) => p.variants.some((v) => v.colour === opts.colour));
  if (opts.maxPrice) list = list.filter((p) => p.price <= opts.maxPrice!);
  if (opts.q) {
    const q = opts.q.toLowerCase();
    list = list.filter((p) => `${p.name} ${p.fabric} ${p.category}`.toLowerCase().includes(q));
  }
  const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
    featured: (a, b) => Number(b.featured) - Number(a.featured),
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    best: (a, b) => b.soldCount - a.soldCount,
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
  };
  list = [...list].sort(sorters[opts.sort ?? "featured"]);
  return opts.limit ? list.slice(0, opts.limit) : list;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return (await loadProducts()).find((p) => p.slug === slug) ?? null;
}

export async function getRelatedProducts(p: Product, limit = 4): Promise<Product[]> {
  return (await loadProducts()).filter((x) => x.id !== p.id && x.category === p.category).slice(0, limit);
}

export const totalStock = (p: Product) => p.variants.reduce((n, v) => n + v.stock, 0);
