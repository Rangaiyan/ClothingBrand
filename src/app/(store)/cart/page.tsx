import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Shopping Bag", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
      <h1 className="mb-8 text-4xl md:text-5xl">Shopping Bag</h1>
      <CartView />
    </div>
  );
}
