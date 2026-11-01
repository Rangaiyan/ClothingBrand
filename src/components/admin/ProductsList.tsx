"use client";

import Link from "next/link";
import { collection, deleteDoc, doc, orderBy, query, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { formatINR } from "@/lib/utils/format";
import { useCollection } from "@/features/admin/hooks";
import type { Product } from "@/types";
import { Badge, btn, btnGhost, PageHeader, td, th } from "./ui";

export function ProductsList() {
  const { rows, loading, error } = useCollection<Product>(() => query(collection(getDb(), "products"), orderBy("name")), "products");
  const flip = (p: Product & { id: string }, field: "published" | "featured" | "bestSeller") =>
    updateDoc(doc(getDb(), "products", p.id), { [field]: !p[field] });

  return (
    <>
      <PageHeader title="Products">
        <Link href="/admin/products/new" className={btn}>New product</Link>
      </PageHeader>
      <p className="mb-4 text-xs text-muted">Featured and Best seller flags control the homepage sections.</p>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <div className="overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[720px]">
          <thead><tr><th className={th}>Name</th><th className={th}>Category</th><th className={th}>Price</th><th className={th}>Stock</th><th className={th}>Status</th><th className={th}>Flags</th><th /></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className={td}><Link href={`/admin/products/${p.id}`} className="font-medium underline">{p.name}</Link></td>
                <td className={td}>{p.category}</td>
                <td className={td}>{formatINR(p.price)}</td>
                <td className={td}>{p.variants.reduce((n, v) => n + v.stock, 0)}</td>
                <td className={td}><Badge tone={p.published ? "good" : "neutral"}>{p.published ? "Published" : "Draft"}</Badge></td>
                <td className={td}>
                  <button className="mr-2 underline" onClick={() => flip(p, "featured")}>{p.featured ? "★ Featured" : "Feature"}</button>
                  <button className="underline" onClick={() => flip(p, "bestSeller")}>{p.bestSeller ? "★ Best seller" : "Best seller"}</button>
                </td>
                <td className={td}>
                  <button className={btnGhost} onClick={() => flip(p, "published")}>{p.published ? "Unpublish" : "Publish"}</button>{" "}
                  <button className="text-xs text-red-700 underline"
                    onClick={() => { if (confirm(`Delete "${p.name}" permanently? Unpublish instead to keep its history.`)) void deleteDoc(doc(getDb(), "products", p.id)); }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className={td} colSpan={7}>{loading ? "Loading…" : "No products yet."}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
