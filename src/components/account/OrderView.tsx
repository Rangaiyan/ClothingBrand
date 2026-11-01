"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthProvider";
import { formatINR } from "@/lib/utils/format";
import type { AdminOrder } from "@/components/admin/OrdersAdmin";

const STEPS = ["placed", "confirmed", "packed", "shipped", "delivered"];

export function OrderView({ id }: { id: string }) {
  const { user, loading } = useAuth();
  const [o, setO] = useState<AdminOrder | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    // Security rules only allow reading your own order, so a foreign id simply errors.
    return onSnapshot(doc(getDb(), "orders", id), (s) => setO(s.exists() ? (s.data() as AdminOrder) : null), () => setO(null));
  }, [user, id]);

  if (loading || (user && o === undefined)) return <div className="min-h-[30vh]" aria-busy="true" />;
  if (!user) return <p className="text-muted">Please <Link href="/login" className="underline">log in</Link> to see this order.</p>;
  if (!o) return <p>Order not found. <Link href="/account/orders" className="underline">Back to orders</Link></p>;

  const cancelled = o.fulfilment.status === "cancelled";
  const at = STEPS.indexOf(o.fulfilment.status);
  return (
    <div className="space-y-8">
      {cancelled ? <p className="text-sm text-red-700">This order was cancelled.{o.refundDue && " Your refund is being processed."}</p> : (
        <ol className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Order progress">
          {STEPS.map((s, i) => <li key={s} aria-current={i === at ? "step" : undefined} className={i <= at ? "font-medium text-brand" : "text-muted"}>{i <= at ? "● " : "○ "}{s}</li>)}
        </ol>
      )}
      {o.fulfilment.trackingId && <p className="text-sm">Tracking: {o.fulfilment.carrier} {o.fulfilment.trackingId}</p>}
      <ul className="divide-y divide-line border-y border-line text-sm">
        {o.items.map((i) => <li key={i.sku} className="flex justify-between py-3"><span>{i.name} · {i.colour} · {i.size} × {i.qty}</span><span>{formatINR(i.price * i.qty)}</span></li>)}
      </ul>
      <dl className="max-w-xs space-y-1 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatINR(o.subtotal)}</dd></div>
        {o.discount > 0 && <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd>−{formatINR(o.discount)}</dd></div>}
        <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{o.shipping ? formatINR(o.shipping) : "Free"}</dd></div>
        <div className="flex justify-between font-medium"><dt>Total</dt><dd>{formatINR(o.total)}</dd></div>
      </dl>
      <p className="text-sm text-muted">Shipping to {o.address.line1}, {o.address.city}, {o.address.state} {o.address.pincode}</p>
    </div>
  );
}
