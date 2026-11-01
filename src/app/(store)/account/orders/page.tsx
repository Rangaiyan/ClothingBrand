import type { Metadata } from "next";
import { OrdersList } from "@/components/account/OrdersList";

export const metadata: Metadata = { title: "My Orders", robots: { index: false } };

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-4xl md:text-5xl">My Orders</h1>
      <OrdersList />
    </div>
  );
}
