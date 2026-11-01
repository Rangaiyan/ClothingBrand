import { Loader } from "@/components/layout/Loader";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductFilters } from "@/components/product/ProductFilters";
import { ProductGrid } from "@/components/product/ProductGrid";
import { parseListingParams } from "@/lib/utils/listing";
import { getProducts } from "@/services/catalog";

export const metadata: Metadata = { title: "Shop All", alternates: { canonical: "/shop" } };

export default function ShopPage(props: PageProps<"/shop">) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
      <h1 className="mb-8 text-4xl md:text-5xl">Shop All</h1>
      <Suspense fallback={<Loader size={180} />}>
        <ShopResults searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function ShopResults({ searchParams }: { searchParams: PageProps<"/shop">["searchParams"] }) {
  const { values, query } = parseListingParams(await searchParams);
  const [products, all] = await Promise.all([getProducts(query), getProducts()]);
  const colours = [...new Set(all.flatMap((p) => p.variants.map((v) => v.colour)))];

  return (
    <>
      <ProductFilters values={values} colours={colours} />
      <ProductGrid products={products} />
    </>
  );
}
