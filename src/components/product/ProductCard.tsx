"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/types";
import { discountPercent, formatINR } from "@/lib/utils/format";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useHydrated } from "@/hooks/useHydrated";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const add = useCart((s) => s.add);
  const { ids, toggle } = useWishlist();
  const liked = useHydrated() && ids.includes(product.id);
  const off = discountPercent(product.price, product.originalPrice);
  const firstInStock = product.variants.find((v) => v.stock > 0);

  return (
    <div className="group">
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
        <Link href={`/products/${product.slug}`} aria-label={product.name}>
          <ProductImage
            src={product.images[0]}
            name={product.name}
            seed={index}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          />
        </Link>
        {off > 0 && (
          <span className="absolute left-3 top-3 bg-brand px-2 py-1 text-[11px] font-medium tracking-wide text-white">
            {off}% OFF
          </span>
        )}
        <button
          type="button"
          onClick={() => toggle(product.id)}
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={liked}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 transition hover:bg-white"
        >
          <Heart size={18} className={liked ? "fill-brand text-brand" : "text-foreground"} />
        </button>
        {firstInStock ? (
          <button
            type="button"
            onClick={() =>
              add({
                sku: firstInStock.sku,
                productId: product.id,
                slug: product.slug,
                name: product.name,
                colour: firstInStock.colour,
                size: firstInStock.size,
                price: product.price,
                qty: 1,
              })
            }
            className="absolute inset-x-0 bottom-0 translate-y-full bg-foreground py-3 text-xs font-medium uppercase tracking-widest text-white transition-transform group-hover:translate-y-0 focus-visible:translate-y-0 max-md:translate-y-0"
          >
            Quick add
          </button>
        ) : (
          <span className="absolute inset-x-0 bottom-0 bg-white/90 py-3 text-center text-xs uppercase tracking-widest text-muted">
            Sold out
          </span>
        )}
      </div>
      <Link href={`/products/${product.slug}`} className="mt-3 block">
        <h3 className="font-sans text-sm font-medium">{product.name}</h3>
        <p className="mt-1 text-sm">
          <span className="font-medium">{formatINR(product.price)}</span>
          {off > 0 && (
            <span className="ml-2 text-muted line-through">{formatINR(product.originalPrice)}</span>
          )}
        </p>
      </Link>
    </div>
  );
}
