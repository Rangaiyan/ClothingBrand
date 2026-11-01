"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/app/icon.png";
import { usePathname } from "next/navigation";
import { Heart, Home, Menu, Store, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useHydrated } from "@/hooks/useHydrated";

const NAV = [
  { href: "/shop", label: "Shop", Icon: Store },
  { href: "/collections/vesti", label: "Vesti" },
  { href: "/collections/lungi", label: "Lungi" },
  { href: "/collections/new-arrivals", label: "New Arrivals" },
];

const DRAWER = [
  { href: "/collections/new-arrivals", label: "New Arrivals" },
  { href: "/shop", label: "Shop All" },
  { href: "/collections/vesti", label: "Vesti" },
  { href: "/collections/lungi", label: "Lungi" },
  { href: "/collections/best-sellers", label: "Best Sellers", highlight: true },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/faqs", label: "Shipping & Returns" },
  { href: "/account/orders", label: "Track My Order" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  const wished = useWishlist((s) => s.ids.length);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-8">
        <button
          type="button"
          className="md:hidden"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Menu size={22} />
        </button>

        <nav aria-label="Primary" className="hidden gap-8 text-xs font-normal uppercase tracking-[0.18em] md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="transition hover:text-brand">
              {n.label}
            </Link>
          ))}
        </nav>

        <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-semibold tracking-[0.25em] text-brand">
          <Image src={logo} alt="" width={32} height={32} className="size-8" priority />
          KAMELEON
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/search" aria-label="Search"><Search size={20} /></Link>
          <Link href="/account" aria-label="Account" className="hidden sm:block"><User size={20} /></Link>
          <Link href="/wishlist" aria-label="Wishlist" className="relative hidden sm:block">
            <Heart size={20} />
            {hydrated && wished > 0 && <Badge n={wished} />}
          </Link>
          <Link href="/cart" aria-label="Cart" className="relative hidden md:block">
            <ShoppingBag size={20} />
            {hydrated && count > 0 && <Badge n={count} />}
          </Link>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
        <nav aria-label="Mobile" className={`absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-white transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-16 shrink-0 items-center border-b border-line px-5">
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)}><X size={22} /></button>
          </div>
          <ul className="py-3">
            {DRAWER.map((n) => (
              <li key={n.href}>
                <Link href={n.href} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}
                  className={`block px-5 py-3 text-xs uppercase tracking-[0.18em] ${n.highlight ? "bg-brand text-white" : ""}`}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-brand text-[10px] text-white">
      {n}
    </span>
  );
}

const TABS = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/shop", label: "Shop", Icon: Store },
  { href: "/cart", label: "Bag", Icon: ShoppingBag },
  { href: "/account", label: "Account", Icon: User },
];

/** Mobile-only bottom tab bar. */
export function BottomNav() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav aria-label="Bottom" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <ul className="pointer-events-auto mx-auto grid max-w-md grid-cols-4 gap-1 rounded-full border border-white/15 bg-brand p-1.5 shadow-sm">
        {TABS.map(({ href, label, Icon }) => {
          const on = active(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={on ? "page" : undefined}
                className={`relative flex h-10 items-center justify-center gap-1.5 rounded-full text-xs transition-colors ${on ? "border border-white/20 bg-white/15 font-medium text-white" : "text-white/60 hover:text-white"}`}>
                <Icon size={16} strokeWidth={1.5} />
                {label}
                {href === "/cart" && hydrated && count > 0 && (
                  <span className="absolute right-1.5 top-0.5 grid size-4 place-items-center rounded-full bg-white text-[10px] font-medium text-brand">{count}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
