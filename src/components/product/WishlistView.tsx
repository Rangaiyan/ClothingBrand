"use client";

import Link from "next/link";
import type { Product } from "@/types";
import { useWishlist } from "@/store/wishlist";
import { useHydrated } from "@/hooks/useHydrated";
import { ProductGrid } from "./ProductGrid";

export function WishlistView({ products }: { products: Product[] }) {
  const hydrated = useHydrated();
  const ids = useWishlist((s) => s.ids);
  if (!hydrated) return <div className="min-h-[40vh]" aria-busy="true" />;
  const saved = products.filter((p) => ids.includes(p.id));
  if (!saved.length) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted">Nothing saved yet. Tap the heart on any product.</p>
        <Link href="/shop" className="mt-6 inline-block underline underline-offset-4">Browse the shop</Link>
      </div>
    );
  }
  return <ProductGrid products={saved} />;
}
