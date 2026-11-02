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
  { href: "/shop", label: "Shop" },
  { href: "/modern", label: "Modern" },
  { href: "/traditional", label: "Traditional" },
  { href: "/collections", label: "Collections" },
  { href: "/new-arrivals", label: "New Arrivals" },
];

const EXTRA = [
  { href: "/wishlist", label: "Wishlist" },
  { href: "/faqs", label: "Shipping & Returns" },
  { href: "/account/orders", label: "Track My Order" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  const wished = useWishlist((s) => s.ids.length);

  const close = () => setOpen(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-4 md:px-8">
        <div className="flex items-center">
          <button
            type="button"
            className="lg:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu size={22} />
          </button>
          <Link href="/search" aria-label="Search" className="hidden lg:block"><Search size={20} /></Link>
        </div>

        <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-semibold tracking-[0.25em] text-brand">
          <Image src={logo} alt="" width={32} height={32} className="size-8" priority />
          KAMELEON
        </Link>

        <div className="flex items-center justify-end gap-4">
          <Link href="/search" aria-label="Search" className="lg:hidden"><Search size={20} /></Link>
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

      {/* Desktop menu, on its own row under the brand name */}
      <nav aria-label="Primary" className="hidden border-t border-line lg:block">
        <ul className="mx-auto flex max-w-[1440px] justify-center gap-10 px-8 text-xs font-normal uppercase tracking-[0.18em]">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link href={n.href} aria-current={isActive(n.href) ? "page" : undefined}
                className={`block border-b-2 py-3.5 transition hover:text-brand ${isActive(n.href) ? "border-brand font-medium text-brand" : "border-transparent"}`}>
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
        <nav aria-label="Mobile" className={`absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-white transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-16 shrink-0 items-center border-b border-line px-5">
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)}><X size={22} /></button>
          </div>
          <ul className="py-3">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} tabIndex={open ? 0 : -1} onClick={close} aria-current={isActive(n.href) ? "page" : undefined}
                  className={`block border-l-2 px-5 py-3 text-xs uppercase tracking-[0.18em] ${isActive(n.href) ? "border-brand bg-brand/5 font-medium text-brand" : "border-transparent"}`}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-auto border-t border-line py-3">
            {EXTRA.map((n) => (
              <li key={n.href}><Link href={n.href} tabIndex={open ? 0 : -1} onClick={close} className="block px-5 py-3 text-xs uppercase tracking-[0.18em] text-muted">{n.label}</Link></li>
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
                className={`relative flex h-10 items-center justify-center gap-1.5 rounded-full text-xs transition-colors ${on ? "bg-white font-medium text-brand" : "text-white/70 hover:text-white"}`}>
                <Icon size={16} strokeWidth={1.5} />
                {label}
                {href === "/cart" && hydrated && count > 0 && (
                  <span className="absolute right-1.5 top-0.5 grid size-4 place-items-center rounded-full bg-white text-[10px] font-medium text-brand ring-1 ring-brand">{count}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
