import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Order placed", robots: { index: false } };

export default function SuccessPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-4xl md:text-5xl">Thank you.</h1>
      <p className="mt-4 text-muted">
        Your order is confirmed. We&apos;ll notify you as it is packed and shipped.
      </p>
      <Link href="/shop" className="mt-8 inline-block bg-brand px-8 py-3 text-xs uppercase tracking-widest text-white">
        Continue shopping
      </Link>
    </div>
  );
}
