import { Suspense } from "react";
import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getSettings } from "@/services/content";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

async function Form() {
  const { codEnabled } = await getSettings();
  return <CheckoutForm codEnabled={codEnabled} />;
}

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
      <h1 className="mb-8 text-4xl md:text-5xl">Checkout</h1>
      <Suspense fallback={<div className="min-h-[40vh]" aria-busy="true" />}><Form /></Suspense>
    </div>
  );
}
