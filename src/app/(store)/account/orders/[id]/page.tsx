import { Suspense } from "react";
import type { Metadata } from "next";
import { OrderView } from "@/components/account/OrderView";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

export default function Page(props: PageProps<"/account/orders/[id]">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-4xl md:text-5xl">Order details</h1>
      <Suspense fallback={null}><Content params={props.params} /></Suspense>
    </div>
  );
}

async function Content({ params }: { params: PageProps<"/account/orders/[id]">["params"] }) {
  return <OrderView id={(await params).id} />;
}
