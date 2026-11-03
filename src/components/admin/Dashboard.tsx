"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, doc, getAggregateFromServer, getCountFromServer, getDoc, limit, orderBy, query, sum, where } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { formatINR } from "@/lib/utils/format";
import { WELCOME_OFFER } from "@/lib/welcome-offer";
import { errMsg, useCollection } from "@/features/admin/hooks";
import type { Product } from "@/types";
import { Badge, Notice, PageHeader, td, th } from "./ui";

interface OrderRow {
  total: number;
  contact: { name: string };
  payment: { status: string };
  fulfilment: { status: string };
}

const LOW_STOCK = 5;
const PAID = ["paid", "partially_refunded"];

export function Dashboard() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [welcome, setWelcome] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const db = getDb();
    const orders = collection(db, "orders");
    const count = (q = query(orders)) => getCountFromServer(q).then((s) => s.data().count);
    Promise.all([
      getAggregateFromServer(query(orders, where("payment.status", "in", PAID)), { sales: sum("total") }),
      count(),
      count(query(collection(db, "users"))),
      count(query(collection(db, "products"))),
      count(query(orders, where("fulfilment.status", "in", ["placed", "confirmed", "packed"]))),
      count(query(orders, where("fulfilment.status", "==", "delivered"))),
    ])
      .then(([sales, total, customers, products, pending, completed]) =>
        setStats({ sales: sales.data().sales ?? 0, total, customers, products, pending, completed }))
      .catch((e) => setError(errMsg(e)));
  }, []);

  useEffect(() => {
    const db = getDb();
    Promise.all([getDoc(doc(db, "popupStats", "welcome")), getDoc(doc(db, "coupons", WELCOME_OFFER.code))])
      .then(([stats, coupon]) => setWelcome({ ...(stats.data() as Record<string, number> | undefined), orders: coupon.data()?.usedCount ?? 0 }))
      .catch(() => setWelcome({}));
  }, []);

  const recent = useCollection<OrderRow>(() => query(collection(getDb(), "orders"), orderBy("createdAt", "desc"), limit(5)), "recent");
  const products = useCollection<Product>(() => query(collection(getDb(), "products")), "all-products");

  const low = products.rows.flatMap((p) =>
    p.variants.filter((v) => v.stock <= LOW_STOCK).map((v) => ({ p, v })));

  const cards: [string, string | number | undefined][] = [
    ["Total sales", stats ? formatINR(stats.sales) : undefined],
    ["Total orders", stats?.total],
    ["Customers", stats?.customers],
    ["Products", stats?.products],
    ["Pending orders", stats?.pending],
    ["Completed orders", stats?.completed],
  ];

  return (
    <>
      <PageHeader title="Analytics" />
      <Notice>{error}</Notice>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="border border-line bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
            <p className="mt-2 text-[26px] font-semibold">{value ?? "—"}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 border border-line bg-white">
        <h2 className="border-b border-line px-4 py-3 text-sm font-semibold">Welcome offer ({WELCOME_OFFER.code})</h2>
        <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-5">
          {([["Popup views", "impressions"], ["Dismissed", "dismissals"], ["Subscribed", "subscriptions"], ["Codes copied", "copies"], ["Orders placed", "orders"]] as const).map(([label, k]) => (
            <div key={k} className="bg-white p-4">
              <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
              <dd className="mt-1 text-xl font-semibold">{welcome ? (welcome[k] ?? 0) : "—"}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="border border-line bg-white">
          <h2 className="border-b border-line px-4 py-3 text-sm font-semibold">Recent orders</h2>
          <table className="w-full">
            <thead><tr><th className={th}>Customer</th><th className={th}>Total</th><th className={th}>Status</th></tr></thead>
            <tbody>
              {recent.rows.map((o) => (
                <tr key={o.id} className="border-t border-line">
                  <td className={td}><Link className="underline" href={`/admin/orders/${o.id}`}>{o.contact.name}</Link></td>
                  <td className={td}>{formatINR(o.total)}</td>
                  <td className={td}><Badge>{o.fulfilment.status}</Badge></td>
                </tr>
              ))}
              {!recent.rows.length && <tr><td className={td} colSpan={3}>{recent.loading ? "Loading…" : "No orders yet."}</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="border border-line bg-white">
          <h2 className="border-b border-line px-4 py-3 text-sm font-semibold">Low stock (≤ {LOW_STOCK})</h2>
          <table className="w-full">
            <thead><tr><th className={th}>Product</th><th className={th}>Variant</th><th className={th}>Left</th></tr></thead>
            <tbody>
              {low.map(({ p, v }) => (
                <tr key={v.sku} className="border-t border-line">
                  <td className={td}><Link className="underline" href={`/admin/products/${p.id}`}>{p.name}</Link></td>
                  <td className={td}>{v.colour} · {v.size}</td>
                  <td className={td}><Badge tone={v.stock === 0 ? "bad" : "warn"}>{v.stock}</Badge></td>
                </tr>
              ))}
              {!low.length && <tr><td className={td} colSpan={3}>{products.loading ? "Loading…" : "Nothing running low."}</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
