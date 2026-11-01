"use client";

import { useState } from "react";
import Link from "next/link";
import { collection, limit, orderBy, query, type Timestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { adjustStock } from "@/features/admin/callables";
import { errMsg, useCollection } from "@/features/admin/hooks";
import type { Product } from "@/types";
import { Badge, btnGhost, Notice, PageHeader, td, th } from "./ui";

interface Log { productId: string; sku: string; delta: number; reason: string; note?: string | null; orderId?: string; at: Timestamp | null }
const LOW = 5;

export function InventoryAdmin() {
  const products = useCollection<Product>(() => query(collection(getDb(), "products"), orderBy("name")), "inv-products");
  const logs = useCollection<Log>(() => query(collection(getDb(), "inventoryLogs"), orderBy("at", "desc"), limit(40)), "inv-logs");
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [lowOnly, setLowOnly] = useState(false);

  const variants = products.rows.flatMap((p) => p.variants.map((v) => ({ p, v })))
    .filter(({ v }) => !lowOnly || v.stock <= LOW);

  async function save(productId: string, sku: string) {
    const n = Number(edits[sku]);
    if (!Number.isInteger(n) || n < 0) return setMsg({ kind: "error", text: "Enter a whole number, 0 or more." });
    try {
      await adjustStock({ productId, sku, newStock: n, note: "Manual update" });
      setEdits((cur) => Object.fromEntries(Object.entries(cur).filter(([k]) => k !== sku)));
      setMsg({ kind: "ok", text: `${sku} set to ${n}.` });
    } catch (e) { setMsg({ kind: "error", text: errMsg(e) }); }
  }

  return (
    <>
      <PageHeader title="Inventory"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} /> Low stock only</label></PageHeader>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[640px]">
          <thead><tr><th className={th}>Product</th><th className={th}>SKU</th><th className={th}>Variant</th><th className={th}>Stock</th><th className={th}>Set to</th></tr></thead>
          <tbody>
            {variants.map(({ p, v }) => (
              <tr key={v.sku} className="border-t border-line">
                <td className={td}><Link className="underline" href={`/admin/products/${p.id}`}>{p.name}</Link></td>
                <td className={`${td} font-mono text-xs`}>{v.sku}</td>
                <td className={td}>{v.colour} · {v.size}</td>
                <td className={td}><Badge tone={v.stock === 0 ? "bad" : v.stock <= LOW ? "warn" : "good"}>{v.stock}</Badge></td>
                <td className={td}>
                  <input type="number" min={0} aria-label={`New stock for ${v.sku}`} className="w-20 border border-line px-2 py-1 text-sm" value={edits[v.sku] ?? ""}
                    onChange={(e) => setEdits({ ...edits, [v.sku]: e.target.value })} />{" "}
                  <button className={btnGhost} disabled={edits[v.sku] === undefined || edits[v.sku] === ""} onClick={() => save(p.id, v.sku)}>Save</button>
                </td>
              </tr>
            ))}
            {!variants.length && <tr><td className={td} colSpan={5}>{products.loading ? "Loading…" : "No variants to show."}</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 mt-10 font-serif text-2xl">Recent stock changes</h2>
      <div className="overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[560px]">
          <thead><tr><th className={th}>When</th><th className={th}>SKU</th><th className={th}>Change</th><th className={th}>Reason</th></tr></thead>
          <tbody>
            {logs.rows.map((l) => (
              <tr key={l.id} className="border-t border-line">
                <td className={td}>{l.at?.toDate().toLocaleString("en-IN")}</td>
                <td className={`${td} font-mono text-xs`}>{l.sku}</td>
                <td className={td}>{l.delta > 0 ? `+${l.delta}` : l.delta}</td>
                <td className={td}>{l.reason.replace(/_/g, " ")}{l.note ? ` · ${l.note}` : ""}</td>
              </tr>
            ))}
            {!logs.rows.length && <tr><td className={td} colSpan={4}>{logs.loading ? "Loading…" : "No stock changes yet."}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
