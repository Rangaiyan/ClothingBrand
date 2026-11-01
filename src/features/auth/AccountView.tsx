"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { logout } from "./actions";

export function AccountView() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return <div className="min-h-[40vh]" aria-busy="true" />;
  if (!user) {
    return (
      <div className="py-12">
        <p className="text-muted">Log in to see your profile, orders and saved addresses.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/login" className="bg-brand px-8 py-3 text-xs uppercase tracking-widest text-white">Log in</Link>
          <Link href="/register" className="border border-foreground px-8 py-3 text-xs uppercase tracking-widest">Register</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="py-6">
      <p className="text-sm text-muted">Signed in as</p>
      <p className="text-lg">{user.displayName ?? user.email}</p>
      <ul className="mt-8 divide-y divide-line border-y border-line text-sm">
        <li className="py-4"><Link href="/account/orders">My orders</Link></li>
        <li className="py-4"><Link href="/wishlist">Wishlist</Link></li>
      </ul>
      <button onClick={async () => { await logout(); router.push("/"); }} className="mt-8 border border-foreground px-8 py-3 text-xs uppercase tracking-widest">
        Log out
      </button>
    </div>
  );
}
