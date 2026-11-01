"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useHydrated } from "@/hooks/useHydrated";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/collections/vesti", label: "Vesti" },
  { href: "/collections/lungi", label: "Lungi" },
  { href: "/collections/new-arrivals", label: "New Arrivals" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const hydrated = useHydrated();
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.qty, 0));
  const wished = useWishlist((s) => s.ids.length);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-8">
        <button
          type="button"
          className="md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav aria-label="Primary" className="hidden gap-8 text-sm md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="transition hover:text-brand">
              {n.label}
            </Link>
          ))}
        </nav>

        <Link href="/" className="font-serif text-2xl font-semibold tracking-[0.25em] text-brand">
          KAMELEON
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/search" aria-label="Search"><Search size={20} /></Link>
          <Link href="/account" aria-label="Account" className="hidden sm:block"><User size={20} /></Link>
          <Link href="/wishlist" aria-label="Wishlist" className="relative hidden sm:block">
            <Heart size={20} />
            {hydrated && wished > 0 && <Badge n={wished} />}
          </Link>
          <Link href="/cart" aria-label="Cart" className="relative">
            <ShoppingBag size={20} />
            {hydrated && count > 0 && <Badge n={count} />}
          </Link>
        </div>
      </div>

      {open && (
        <nav aria-label="Mobile" className="border-t border-line bg-white px-4 py-4 md:hidden">
          <ul className="space-y-4 text-sm">
            {[...NAV, { href: "/account", label: "Account" }, { href: "/wishlist", label: "Wishlist" }].map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setOpen(false)}>{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
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
