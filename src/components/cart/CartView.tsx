"use client";

import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/store/cart";
import { useHydrated } from "@/hooks/useHydrated";
import { estimateShipping, FREE_SHIPPING_THRESHOLD } from "@/lib/utils/pricing";
import { formatINR } from "@/lib/utils/format";
import { OrderSummary } from "./OrderSummary";

export function CartView() {
  const hydrated = useHydrated();
  const { lines, setQty, remove } = useCart();

  if (!hydrated) return <div className="min-h-[40vh]" aria-busy="true" />;
  if (!lines.length) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted">Your bag is empty.</p>
        <Link href="/shop" className="mt-6 inline-block bg-foreground px-8 py-3 text-xs uppercase tracking-widest text-white">
          Continue shopping
        </Link>
      </div>
    );
  }

  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const toFree = FREE_SHIPPING_THRESHOLD - subtotal;

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
      <div>
        {estimateShipping(subtotal) > 0 && (
          <p className="mb-6 bg-neutral-50 p-3 text-sm text-muted">
            Add {formatINR(toFree)} more for free shipping.
          </p>
        )}
        <ul className="divide-y divide-line border-y border-line">
          {lines.map((l) => (
            <li key={l.sku} className="flex gap-4 py-5">
              <div className="grid size-24 shrink-0 place-items-center bg-neutral-100 font-serif text-xs tracking-widest text-brand/40">K</div>
              <div className="flex-1">
                <Link href={`/products/${l.slug}`} className="text-sm font-medium">{l.name}</Link>
                <p className="mt-1 text-xs text-muted">{l.colour} · {l.size}</p>
                <div className="mt-3 flex items-center border border-line w-fit">
                  <button type="button" aria-label="Decrease quantity" className="p-2" onClick={() => setQty(l.sku, l.qty - 1)}><Minus size={12} /></button>
                  <span className="w-8 text-center text-sm">{l.qty}</span>
                  <button type="button" aria-label="Increase quantity" className="p-2" onClick={() => setQty(l.sku, l.qty + 1)}><Plus size={12} /></button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button type="button" aria-label={`Remove ${l.name}`} onClick={() => remove(l.sku)}><X size={16} /></button>
                <span className="text-sm font-medium">{formatINR(l.price * l.qty)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="h-fit border border-line p-6">
        <OrderSummary lines={lines} />
        <Link href="/checkout" className="mt-6 block bg-brand py-3 text-center text-xs font-medium uppercase tracking-widest text-white">
          Checkout
        </Link>
      </aside>
    </div>
  );
}
