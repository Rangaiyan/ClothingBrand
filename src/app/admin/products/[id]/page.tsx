import { Suspense } from "react";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "Product" };

export default function Page(props: PageProps<"/admin/products/[id]">) {
  return <Suspense fallback={null}><Content params={props.params} /></Suspense>;
}

async function Content({ params }: { params: PageProps<"/admin/products/[id]">["params"] }) {
  const { id } = await params;
  return <ProductForm key={id} id={id} />;
}

// Behind the admin login gate; cannot be an instant navigation.
export const instant = false;
