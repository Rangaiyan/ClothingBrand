"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { isFirebaseConfigured } from "@/lib/firebase/client";

const NAV = [
  ["/admin", "Overview"],
  ["/admin/products", "Products"],
  ["/admin/categories", "Categories"],
  ["/admin/orders", "Orders"],
  ["/admin/inventory", "Inventory"],
  ["/admin/coupons", "Coupons"],
  ["/admin/content", "Store content"],
  ["/admin/team", "Team"],
] as const;

// This gate only decides what to render. Real enforcement is in Firestore/Storage
// rules and the Cloud Functions, which check the admin custom claim themselves.
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<"checking" | "admin" | "denied">("checking");

  useEffect(() => {
    if (!user) return;
    let live = true;
    user.getIdTokenResult(true).then((r) => live && setRole(r.claims.admin === true ? "admin" : "denied"));
    return () => { live = false; };
  }, [user]);

  const msg = (text: string, action?: React.ReactNode) => (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-muted">{text}</p>
      {action}
    </div>
  );

  if (!isFirebaseConfigured) return msg("Add your Firebase keys to .env.local to use the dashboard.");
  if (loading || (user && role === "checking")) return <div className="min-h-screen" aria-busy="true" />;
  if (!user) return msg("Log in with an admin account.", <Link href="/login" className="mt-6 inline-block underline">Log in</Link>);
  if (role !== "admin") return msg("This account does not have admin access.");

  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b border-line bg-white md:border-b-0 md:border-r">
        <div className="px-5 py-5 font-serif text-xl font-semibold tracking-[0.25em] text-brand">KAMELEON</div>
        <Suspense fallback={null}><AdminNav /></Suspense>
      </aside>
      <div className="min-w-0 bg-neutral-50 p-4 md:p-8">{children}</div>
    </div>
  );
}

function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
      {NAV.map(([href, label]) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap px-3 py-2 text-sm ${active ? "bg-brand text-white" : "hover:bg-neutral-100"}`}>
            {label}
          </Link>
        );
      })}
      <Link href="/" className="whitespace-nowrap px-3 py-2 text-sm text-muted md:mt-6">View store ↗</Link>
    </nav>
  );
}
