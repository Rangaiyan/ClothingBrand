import type { Metadata } from "next";
import { AccountView } from "@/features/auth/AccountView";

export const metadata: Metadata = { title: "My Account", robots: { index: false } };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl md:text-5xl">My Account</h1>
      <AccountView />
    </div>
  );
}
