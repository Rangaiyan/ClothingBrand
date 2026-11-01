"use client";

import Link from "next/link";
import { collection, orderBy, query, where, type Timestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { useAuth } from "@/features/auth/AuthProvider";
import { useCollection } from "@/features/admin/hooks";
import { formatINR } from "@/lib/utils/format";

interface MyOrder { total: number; createdAt: Timestamp; items: { name: string; qty: number }[]; payment: { status: string }; fulfilment: { status: string } }

export function OrdersList() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-[30vh]" aria-busy="true" />;
  if (!user) return <p className="text-muted">Please <Link href="/login" className="underline">log in</Link> to see your orders.</p>;
  return <List uid={user.uid} />;
}

function List({ uid }: { uid: string }) {
  const { rows, loading, error } = useCollection<MyOrder>(
    () => query(collection(getDb(), "orders"), where("uid", "==", uid), orderBy("createdAt", "desc")), uid);
  if (error) return <p className="text-sm text-red-700" role="alert">Could not load your orders.</p>;
  if (!rows.length) return <p className="text-muted">{loading ? "Loading…" : "You have not placed any orders yet."}</p>;
  return (
    <ul className="divide-y divide-line border-y border-line">
      {rows.map((o) => (
        <li key={o.id}>
          <Link href={`/account/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 py-4 text-sm">
            <span>
              <span className="block font-medium">{o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}</span>
              <span className="text-xs text-muted">{o.createdAt?.toDate().toLocaleDateString("en-IN")} · {o.fulfilment.status}</span>
            </span>
            <span className="font-medium">{formatINR(o.total)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
