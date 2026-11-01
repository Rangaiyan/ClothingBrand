"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus } from "lucide-react";
import type { Product } from "@/types";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useHydrated } from "@/hooks/useHydrated";

export function PurchasePanel({ product }: { product: Product }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const { ids, toggle } = useWishlist();

  const colours = useMemo(() => [...new Set(product.variants.map((v) => v.colour))], [product]);
  const [colour, setColour] = useState(
    () => product.variants.find((v) => v.stock > 0)?.colour ?? colours[0],
  );
  const sizesForColour = product.variants.filter((v) => v.colour === colour);
  const [size, setSize] = useState<string | undefined>(() => sizesForColour[0]?.size);
  const [qty, setQty] = useState(1);

  const variant = product.variants.find((v) => v.colour === colour && v.size === size);
  const stock = variant?.stock ?? 0;
  const liked = useHydrated() && ids.includes(product.id);

  function addLine() {
    if (!variant || stock < 1) return false;
    add({
      sku: variant.sku, productId: product.id, slug: product.slug, name: product.name,
      colour: variant.colour, size: variant.size, price: product.price, qty: Math.min(qty, stock),
    });
    return true;
  }

  const chip = (active: boolean, disabled = false) =>
    `border px-4 py-2 text-sm ${active ? "border-foreground bg-foreground text-white" : "border-line"} ${disabled ? "text-muted line-through" : ""}`;

  return (
    <div className="mt-8 space-y-6">
      <fieldset>
        <legend className="mb-2 text-xs uppercase tracking-widest text-muted">Colour: {colour}</legend>
        <div className="flex flex-wrap gap-2">
          {colours.map((c) => (
            <button key={c} type="button" aria-pressed={c === colour} className={chip(c === colour)}
              onClick={() => {
                setColour(c);
                setSize(product.variants.find((v) => v.colour === c)?.size);
                setQty(1);
              }}>
              {c}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs uppercase tracking-widest text-muted">Size</legend>
        <div className="flex flex-wrap gap-2">
          {sizesForColour.map((v) => (
            <button key={v.sku} type="button" aria-pressed={v.size === size} className={chip(v.size === size, v.stock === 0)}
              onClick={() => { setSize(v.size); setQty(1); }}>
              {v.size}
            </button>
          ))}
        </div>
      </fieldset>

      <p className={`text-sm ${stock === 0 ? "text-red-700" : stock <= 5 ? "text-amber-700" : "text-brand"}`}>
        {stock === 0 ? "Out of stock" : stock <= 5 ? `Only ${stock} left` : "In stock"}
      </p>

      <div className="flex items-center gap-4">
        <div className="flex items-center border border-line">
          <button type="button" aria-label="Decrease quantity" className="p-3" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus size={14} /></button>
          <span className="w-8 text-center text-sm" aria-live="polite">{qty}</span>
          <button type="button" aria-label="Increase quantity" className="p-3" onClick={() => setQty((q) => Math.min(stock || 1, q + 1))}><Plus size={14} /></button>
        </div>
        <button type="button" onClick={() => toggle(product.id)} aria-pressed={liked} aria-label="Toggle wishlist" className="grid size-11 place-items-center border border-line">
          <Heart size={18} className={liked ? "fill-brand text-brand" : ""} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" disabled={stock < 1} onClick={() => { if (addLine()) router.push("/cart"); }}
          className="border border-foreground py-3 text-xs font-medium uppercase tracking-widest disabled:opacity-40">
          Add to Bag
        </button>
        <button type="button" disabled={stock < 1} onClick={() => { if (addLine()) router.push("/checkout"); }}
          className="bg-brand py-3 text-xs font-medium uppercase tracking-widest text-white disabled:opacity-40">
          Buy Now
        </button>
      </div>
    </div>
  );
}
