import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductFilters } from "@/components/product/ProductFilters";
import { ProductGrid } from "@/components/product/ProductGrid";
import { parseListingParams } from "@/lib/utils/listing";
import { getCategories, getProducts } from "@/services/catalog";

const SPECIAL: Record<string, { title: string; base: Parameters<typeof getProducts>[0] }> = {
  "new-arrivals": { title: "New Arrivals", base: { sort: "newest" } },
  "best-sellers": { title: "Best Sellers", base: { sort: "best", bestSeller: true } },
};

async function resolve(slug: string) {
  if (SPECIAL[slug]) return { title: SPECIAL[slug].title, description: "", base: SPECIAL[slug].base };
  const cat = (await getCategories()).find((c) => c.slug === slug);
  return cat ? { title: cat.name, description: cat.description, base: { category: cat.slug } } : null;
}

export async function generateStaticParams() {
  const cats = await getCategories();
  return [...Object.keys(SPECIAL), ...cats.map((c) => c.slug)].map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const c = await resolve(slug);
  return c ? { title: c.title, description: c.description || undefined, alternates: { canonical: `/collections/${slug}` } } : {};
}

export default function CollectionPage(props: PageProps<"/collections/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto min-h-[60vh] max-w-[1440px] px-4 py-12 md:px-8" aria-busy="true" />}>
      <CollectionPageContent {...props} />
    </Suspense>
  );
}

async function CollectionPageContent(props: PageProps<"/collections/[slug]">) {
  const { slug } = await props.params;
  const c = await resolve(slug);
  if (!c) notFound();

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
      <h1 className="text-4xl md:text-5xl">{c.title}</h1>
      {c.description && <p className="mt-3 mb-8 max-w-xl text-muted">{c.description}</p>}
      <Suspense fallback={<p className="text-muted">Loading products…</p>}>
        <CollectionResults base={c.base} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function CollectionResults({
  base,
  searchParams,
}: {
  base: Parameters<typeof getProducts>[0];
  searchParams: PageProps<"/collections/[slug]">["searchParams"];
}) {
  const { values, query } = parseListingParams(await searchParams);
  const products = await getProducts({ ...base, ...query, sort: query.sort ?? base?.sort });
  const all = await getProducts(base);
  const colours = [...new Set(all.flatMap((p) => p.variants.map((v) => v.colour)))];

  return (
    <>
      <ProductFilters values={values} colours={colours} />
      <ProductGrid products={products} />
    </>
  );
}
