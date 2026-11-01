"use client";

import { useState } from "react";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { useCart, type CartLine } from "@/store/cart";
import { previewCoupon } from "@/services/checkout";
import { estimateShipping } from "@/lib/utils/pricing";
import { formatINR } from "@/lib/utils/format";

// Totals here are estimates. The server recalculates prices, coupons and
// shipping before any payment is created.
export function OrderSummary({ lines, showCoupon = true }: { lines: CartLine[]; showCoupon?: boolean }) {
  const { coupon, setCoupon } = useCart();
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const shipping = estimateShipping(subtotal);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    if (!code) return;
    if (!isFirebaseConfigured) return setNote("Coupons will be available once the store is live.");
    setBusy(true);
    setNote("");
    try {
      const r = await previewCoupon(code, lines);
      setCoupon({ code: r.code, discount: r.discount });
      setCode("");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not apply coupon.");
    } finally {
      setBusy(false);
    }
  }

  const row = "flex justify-between text-sm";
  return (
    <div className="space-y-3">
      <h2 className="font-sans text-xs font-semibold uppercase tracking-widest">Order summary</h2>
      {showCoupon && (
        <div>
          {coupon ? (
            <p className="flex items-center justify-between text-sm">
              <span>Coupon <strong>{coupon.code}</strong> applied</span>
              <button type="button" className="text-xs underline" onClick={() => setCoupon(null)}>Remove</button>
            </p>
          ) : (
            <form className="flex gap-2" onSubmit={apply}>
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Coupon code" aria-label="Coupon code" className="w-full border border-line px-3 py-2 text-sm" />
              <button disabled={busy} className="border border-foreground px-4 text-xs uppercase tracking-widest disabled:opacity-50">Apply</button>
            </form>
          )}
          {note && <p className="mt-2 text-xs text-muted" role="status">{note}</p>}
        </div>
      )}
      <div className={row}><span className="text-muted">Subtotal</span><span>{formatINR(subtotal)}</span></div>
      {discount > 0 && <div className={row}><span className="text-muted">Discount</span><span>−{formatINR(discount)}</span></div>}
      <div className={row}><span className="text-muted">Shipping</span><span>{shipping ? formatINR(shipping) : "Free"}</span></div>
      <div className={`${row} border-t border-line pt-3 font-medium`}><span>Total</span><span>{formatINR(subtotal - discount + shipping)}</span></div>
    </div>
  );
}
