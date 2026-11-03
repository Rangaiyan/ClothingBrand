"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { formatINR } from "@/lib/utils/format";
import { cancelOrder, refundOrder, updateFulfilment } from "@/features/admin/callables";
import { errMsg } from "@/features/admin/hooks";
import type { AdminOrder } from "./OrdersAdmin";
import { payTone } from "./OrdersAdmin";
import { Badge, btn, btnGhost, Field, Input, Notice, PageHeader } from "./ui";

const NEXT: Record<string, string[]> = { placed: ["confirmed"], confirmed: ["packed"], packed: ["shipped"], shipped: ["delivered"], delivered: [], cancelled: [] };
const CANCELLABLE = ["placed", "confirmed", "packed"];
const REFUNDABLE = ["paid", "paid_needs_refund", "partially_refunded"];

export function OrderDetail({ id }: { id: string }) {
  const [o, setO] = useState<AdminOrder | null | undefined>(undefined);
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");
  const [refundAmt, setRefundAmt] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => onSnapshot(doc(getDb(), "orders", id), (s) => setO(s.exists() ? (s.data() as AdminOrder) : null)), [id]);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true); setMsg(null);
    try { await fn(); setMsg({ kind: "ok", text: ok }); } catch (e) { setMsg({ kind: "error", text: errMsg(e) }); } finally { setBusy(false); }
  }

  if (o === undefined) return <p className="text-sm text-muted">Loading…</p>;
  if (o === null) return <p className="text-sm">Order not found. <Link className="underline" href="/admin/orders">Back</Link></p>;

  const next = NEXT[o.fulfilment.status] ?? [];
  const refundable = o.payment.method === "razorpay" && REFUNDABLE.includes(o.payment.status);
  const remaining = o.total - (o.payment.refundedAmount ?? 0);
  const box = "border border-line bg-white p-5";

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title={`Order ${id.slice(0, 8)}`}><Link href="/admin/orders" className="text-xs uppercase tracking-wider underline">Back</Link></PageHeader>
      <div className="flex flex-wrap gap-2">
        <Badge tone={payTone(o.payment.status)}>Payment: {o.payment.status}</Badge>
        <Badge>Fulfilment: {o.fulfilment.status}</Badge>
        {o.refundDue && <Badge tone="bad">Refund due</Badge>}
      </div>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <div className="grid gap-6 md:grid-cols-2">
        <section className={box}>
          <h2 className="mb-2 text-sm font-semibold">Customer</h2>
          <p className="text-sm">{o.contact.name}<br />{o.contact.email}<br />{o.contact.phone}</p>
          <h2 className="mb-2 mt-4 text-sm font-semibold">Ship to</h2>
          <p className="text-sm">{o.address.line1}<br />{o.address.city}, {o.address.state} {o.address.pincode}</p>
        </section>
        <section className={box}>
          <h2 className="mb-2 text-sm font-semibold">Items</h2>
          <ul className="space-y-1 text-sm">
            {o.items.map((i) => <li key={i.sku} className="flex justify-between"><span>{i.name} · {i.colour} · {i.size} × {i.qty}</span><span>{formatINR(i.price * i.qty)}</span></li>)}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatINR(o.subtotal)}</dd></div>
            {o.discount > 0 && <div className="flex justify-between"><dt className="text-muted">Discount {o.couponCode && `(${o.couponCode})`}</dt><dd>−{formatINR(o.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{formatINR(o.shipping)}</dd></div>
            <div className="flex justify-between font-medium"><dt>Total</dt><dd>{formatINR(o.total)}</dd></div>
          </dl>
        </section>
      </div>

      <section className={`${box} space-y-4`}>
        <h2 className="text-sm font-semibold">Fulfilment</h2>
        {o.fulfilment.trackingId && <p className="text-sm">Tracking: {o.fulfilment.carrier} {o.fulfilment.trackingId}</p>}
        {next.includes("shipped") && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Carrier"><Input value={carrier} onChange={(e) => setCarrier(e.target.value)} /></Field>
            <Field label="Tracking ID"><Input value={tracking} onChange={(e) => setTracking(e.target.value)} /></Field>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {next.map((s) => (
            <button key={s} disabled={busy} className={btn}
              onClick={() => run(() => updateFulfilment({ orderId: id, status: s, ...(s === "shipped" ? { trackingId: tracking.trim(), carrier: carrier.trim() } : {}) }), `Marked ${s}.`)}>
              Mark {s}
            </button>
          ))}
          {CANCELLABLE.includes(o.fulfilment.status) && (
            <button disabled={busy} className={btnGhost}
              onClick={() => { if (confirm("Cancel this order and return its stock?")) void run(() => cancelOrder({ orderId: id }), "Order cancelled."); }}>
              Cancel order
            </button>
          )}
          {!next.length && !CANCELLABLE.includes(o.fulfilment.status) && <p className="text-sm text-muted">No further actions.</p>}
        </div>
      </section>

      {refundable && (
        <section className={`${box} space-y-3`}>
          <h2 className="text-sm font-semibold">Refund</h2>
          <p className="text-sm text-muted">Refunded so far {formatINR(o.payment.refundedAmount ?? 0)} · refundable {formatINR(remaining)}</p>
          <div className="flex items-end gap-2">
            <Field label="Amount (₹), blank = full balance"><Input type="number" min={1} max={remaining} value={refundAmt} onChange={(e) => setRefundAmt(e.target.value)} /></Field>
            <button disabled={busy} className={btn}
              onClick={() => { if (confirm("Issue this refund through Razorpay? This cannot be undone.")) void run(() => refundOrder({ orderId: id, ...(refundAmt ? { amount: Number(refundAmt) } : {}) }), "Refund issued."); }}>
              Refund
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
