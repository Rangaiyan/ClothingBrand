import { Loader } from "@/components/layout/Loader";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductFilters } from "@/components/product/ProductFilters";
import { ProductGrid } from "@/components/product/ProductGrid";
import { parseListingParams } from "@/lib/utils/listing";
import { getProducts } from "@/services/catalog";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
      <h1 className="mb-6 text-4xl md:text-5xl">Search</h1>
      <Suspense fallback={<Loader size={180} />}>
        <SearchResults searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchResults({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const { values, query } = parseListingParams(await searchParams);
  const products = query.q ? await getProducts(query) : [];
  const all = await getProducts();
  const colours = [...new Set(all.flatMap((p) => p.variants.map((v) => v.colour)))];

  return (
    <>
      <form action="/search" className="mb-8 flex gap-2" role="search">
        <input name="q" defaultValue={values.q} placeholder="Search vesti, lungi…" aria-label="Search products" className="w-full max-w-md border border-line px-4 py-2 text-sm" />
        <button className="bg-foreground px-5 py-2 text-xs uppercase tracking-widest text-white">Search</button>
      </form>
      {query.q ? (
        <>
          <ProductFilters values={values} colours={colours} />
          <ProductGrid products={products} />
        </>
      ) : (
        <p className="text-muted">Type something to search the KAMELEON collection.</p>
      )}
    </>
  );
}
