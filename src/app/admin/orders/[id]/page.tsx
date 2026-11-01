import { Suspense } from "react";
import { OrderDetail } from "@/components/admin/OrderDetail";

export const metadata = { title: "Order" };

export default function Page(props: PageProps<"/admin/orders/[id]">) {
  return <Suspense fallback={null}><Content params={props.params} /></Suspense>;
}

async function Content({ params }: { params: PageProps<"/admin/orders/[id]">["params"] }) {
  const { id } = await params;
  return <OrderDetail key={id} id={id} />;
}

// Behind the admin login gate; cannot be an instant navigation.
export const instant = false;
