"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardList, Package, Boxes, Menu, X } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import { Loader } from "@/components/layout/Loader";
import { isFirebaseConfigured } from "@/lib/firebase/client";

const NAV = [
  ["/admin", "Analytics"],
  ["/admin/products", "Products"],
  ["/admin/categories", "Categories"],
  ["/admin/orders", "Orders"],
  ["/admin/inventory", "Inventory"],
  ["/admin/reviews", "Reviews"],
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
    user.getIdTokenResult(true)
      .then((r) => live && setRole(r.claims.admin === true ? "admin" : "denied"))
      // Never hang on the loader if the token refresh fails (offline, expired session).
      .catch(() => live && setRole("denied"));
    return () => { live = false; };
  }, [user]);

  const msg = (text: string, action?: React.ReactNode) => (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-muted">{text}</p>
      {action}
    </div>
  );

  if (!isFirebaseConfigured) return msg("Add your Firebase keys to .env.local to use the dashboard.");
  if (loading || (user && role === "checking")) return <Loader fullScreen />;
  if (!user) return msg("Log in with an admin account.", <Link href="/login" className="mt-6 inline-block underline">Log in</Link>);
  if (role !== "admin") return msg("This account does not have admin access.");

  return (
    <div className="admin-root min-h-screen bg-neutral-50 text-neutral-900">
      <aside className="hidden border-r border-line bg-white md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-[220px] md:flex-col md:overflow-y-auto">
        <div className="px-5 py-5 text-lg font-semibold tracking-[0.15em] text-brand">KAMELEON</div>
        <Suspense fallback={null}><AdminNav /></Suspense>
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-3 md:hidden">
        <span className="text-base font-semibold tracking-[0.15em] text-brand">KAMELEON</span>
        <Link href="/" className="text-xs font-semibold text-neutral-600">View store ↗</Link>
      </header>
      <main className="min-w-0 p-4 pb-28 md:ml-[220px] md:p-8 md:pb-8">{children}</main>
      <Suspense fallback={null}><AdminBottomNav /></Suspense>
    </div>
  );
}

const TABS = [
  ["/admin", "Analytics", BarChart3],
  ["/admin/orders", "Orders", ClipboardList],
  ["/admin/products", "Products", Package],
  ["/admin/inventory", "Inventory", Boxes],
] as const;

function AdminBottomNav() {
  const path = usePathname();
  const [more, setMore] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? path === href : path.startsWith(href));
  const moreActive = !TABS.some(([h]) => isActive(h));
  const cls = (on: boolean) => `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${on ? "text-brand" : "text-neutral-500"}`;
  return (
    <>
      {more && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMore(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-xl bg-white p-4 pb-24" onClick={(e) => e.stopPropagation()}>
            <p className="mb-2 text-sm font-semibold">More</p>
            <div className="grid grid-cols-2 gap-2">
              {NAV.filter(([h]) => !TABS.some(([t]) => t === h)).map(([href, label]) => (
                <Link key={href} href={href} onClick={() => setMore(false)} className={`border border-line px-3 py-3 text-sm font-semibold ${isActive(href) ? "bg-brand text-white" : ""}`}>{label}</Link>
              ))}
              <Link href="/" onClick={() => setMore(false)} className="border border-line px-3 py-3 text-sm font-semibold text-neutral-600">View store ↗</Link>
            </div>
          </div>
        </div>
      )}
      <nav aria-label="Admin bottom" className="fixed inset-x-0 bottom-0 z-50 flex border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {TABS.map(([href, label, Icon]) => (
          <Link key={href} href={href} onClick={() => setMore(false)} aria-current={isActive(href) ? "page" : undefined} className={cls(isActive(href))}>
            <Icon size={20} strokeWidth={isActive(href) ? 2.5 : 2} />{label}
          </Link>
        ))}
        <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} className={cls(moreActive || more)}>
          {more ? <X size={20} /> : <Menu size={20} />}More
        </button>
      </nav>
    </>
  );
}

function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-col gap-1 px-3 pb-4">
      {NAV.map(([href, label]) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap px-3 py-2 text-sm font-semibold ${active ? "bg-brand text-white" : "text-neutral-800 hover:bg-neutral-100"}`}>
            {label}
          </Link>
        );
      })}
      <Link href="/" className="mt-6 whitespace-nowrap px-3 py-2 text-sm font-semibold text-neutral-600">View store ↗</Link>
    </nav>
  );
}
