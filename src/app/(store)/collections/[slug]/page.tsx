import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Listing } from "@/components/catalog/Listing";
import { COLLECTIONS, getCollection } from "@/lib/taxonomy";
import { getActiveCollections } from "@/services/catalog";

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const c = getCollection((await props.params).slug);
  return c ? { title: c.name, description: c.description, alternates: { canonical: `/collections/${c.slug}` } } : {};
}

export default function Page(props: PageProps<"/collections/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto min-h-[60vh] max-w-[1440px] px-4 py-12 md:px-8" aria-busy="true" />}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content(props: PageProps<"/collections/[slug]">) {
  const c = getCollection((await props.params).slug);
  // Collections with no active products aren't shown anywhere, so their URL 404s too.
  if (!c || !(await getActiveCollections()).some((x) => x.slug === c.slug)) notFound();
  return (
    <Listing title={c.name} description={c.description}
      crumbs={[{ label: "Collections", href: "/collections" }, { label: c.name }]}
      base={{ collection: c.slug }} searchParams={props.searchParams} />
  );
}
