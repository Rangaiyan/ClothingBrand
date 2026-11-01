"use client";

import { useState } from "react";
import Link from "next/link";
import { collection, limit, orderBy, query, type Timestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { formatINR } from "@/lib/utils/format";
import { useCollection } from "@/features/admin/hooks";
import { Badge, input, PageHeader, td, th } from "./ui";

export interface AdminOrder {
  uid: string; total: number; createdAt: Timestamp; refundDue?: boolean;
  contact: { name: string; email: string; phone: string };
  address: { line1: string; city: string; state: string; pincode: string };
  items: { name: string; sku: string; colour: string; size: string; qty: number; price: number }[];
  subtotal: number; discount: number; shipping: number; couponCode: string | null;
  payment: { method: string; status: string; razorpayPaymentId: string | null; refundedAmount?: number };
  fulfilment: { status: string; trackingId: string | null; carrier: string | null };
}

export const payTone = (s: string) => (s === "paid" ? "good" : s === "failed" || s === "expired" || s === "paid_needs_refund" ? "bad" : "warn") as "good" | "bad" | "warn";

export function OrdersAdmin() {
  const { rows, loading, error } = useCollection<AdminOrder>(() => query(collection(getDb(), "orders"), orderBy("createdAt", "desc"), limit(200)), "orders");
  const [status, setStatus] = useState("");
  const [pay, setPay] = useState("");
  const [q, setQ] = useState("");

  const needle = q.trim().toLowerCase();
  const shown = rows.filter((o) =>
    (!status || o.fulfilment.status === status) &&
    (!pay || o.payment.status === pay) &&
    (!needle || [o.id, o.contact.name, o.contact.email, o.contact.phone].some((x) => x.toLowerCase().includes(needle))));

  return (
    <>
      <PageHeader title="Orders" />
      <div className="mb-4 flex flex-wrap gap-2">
        <input className={`${input} max-w-xs`} placeholder="Search id, name, email, phone" aria-label="Search orders" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${input} w-auto`} aria-label="Fulfilment status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All fulfilment</option>
          {["placed", "confirmed", "packed", "shipped", "delivered", "cancelled"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={`${input} w-auto`} aria-label="Payment status" value={pay} onChange={(e) => setPay(e.target.value)}>
          <option value="">All payment</option>
          {["pending", "paid", "cod_pending", "failed", "expired", "paid_needs_refund", "partially_refunded", "refunded"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <div className="overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[720px]">
          <thead><tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Date</th><th className={th}>Total</th><th className={th}>Payment</th><th className={th}>Fulfilment</th></tr></thead>
          <tbody>
            {shown.map((o) => (
              <tr key={o.id} className="border-t border-line">
                <td className={td}><Link className="font-mono text-xs underline" href={`/admin/orders/${o.id}`}>{o.id.slice(0, 8)}</Link></td>
                <td className={td}>{o.contact.name}<br /><span className="text-xs text-muted">{o.contact.phone}</span></td>
                <td className={td}>{o.createdAt?.toDate().toLocaleDateString("en-IN")}</td>
                <td className={td}>{formatINR(o.total)}</td>
                <td className={td}><Badge tone={payTone(o.payment.status)}>{o.payment.status}</Badge>{o.refundDue && <Badge tone="bad">refund due</Badge>}</td>
                <td className={td}><Badge>{o.fulfilment.status}</Badge></td>
              </tr>
            ))}
            {!shown.length && <tr><td className={td} colSpan={6}>{loading ? "Loading…" : "No matching orders."}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
