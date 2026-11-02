import { Suspense } from "react";
import Link from "next/link";
import { Loader } from "@/components/layout/Loader";
import { ProductFilters } from "@/components/product/ProductFilters";
import { ProductGrid } from "@/components/product/ProductGrid";
import { parseListingParams } from "@/lib/utils/listing";
import { getProducts, sizesOf } from "@/services/catalog";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

type Base = Parameters<typeof getProducts>[0];
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export interface ListingProps {
  title: string;
  description?: string;
  crumbs: Crumb[];
  base: Base;
  searchParams: SearchParams;
  /** Category chips shown above the filters; `active` marks the current one. */
  chips?: { label: string; href: string; active?: boolean }[];
  emptyText?: string;
}

/** Shared layout for every category, collection and new-arrivals page. */
export function Listing({ title, description, crumbs, base, searchParams, chips, emptyText }: ListingProps) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-8 md:py-12">
      <Breadcrumbs items={crumbs} />
      <h1 className="text-4xl md:text-5xl">{title}</h1>
      {description && <p className="mt-3 max-w-xl text-muted">{description}</p>}
      {chips && chips.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Categories">
          {chips.map((c) => (
            <li key={c.href}>
              <Link href={c.href} aria-current={c.active ? "page" : undefined}
                className={`block border px-4 py-2 text-xs uppercase tracking-widest transition ${c.active ? "border-brand bg-brand text-white" : "border-line hover:border-brand hover:text-brand"}`}>
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8">
        <Suspense fallback={<Loader size={180} />}>
          <Results base={base} searchParams={searchParams} emptyText={emptyText} />
        </Suspense>
      </div>
    </div>
  );
}

async function Results({ base, searchParams, emptyText }: { base: Base; searchParams: SearchParams; emptyText?: string }) {
  const { values, query } = parseListingParams(await searchParams);
  const all = await getProducts(base);
  // No products at all in this section: say so plainly instead of showing filters for nothing.
  if (!all.length) return <p className="py-16 text-center text-muted">{emptyText ?? "New styles are on the way. Please check back soon."}</p>;
  const products = await getProducts({ ...base, ...query, sort: query.sort ?? base?.sort });
  const colours = [...new Set(all.flatMap((p) => p.variants.map((v) => v.colour)))];
  return (
    <>
      <ProductFilters values={values} colours={colours} sizes={sizesOf(all)} />
      <ProductGrid products={products} />
    </>
  );
}
