import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { getActiveCollections } from "@/services/catalog";

export const metadata: Metadata = {
  title: "Collections",
  description: "Curated KAMELEON collections.",
  alternates: { canonical: "/collections" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-8 md:py-12">
      <Breadcrumbs items={[{ label: "Collections" }]} />
      <h1 className="text-4xl md:text-5xl">Collections</h1>
      <p className="mt-3 max-w-xl text-muted">Curated edits across Modern and Traditional.</p>
      <Suspense fallback={<div className="mt-10 min-h-[40vh]" aria-busy="true" />}><List /></Suspense>
    </div>
  );
}

async function List() {
  const cols = await getActiveCollections();
  if (!cols.length) return <p className="py-16 text-center text-muted">Collections are coming soon.</p>;
  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cols.map((c) => (
        <li key={c.slug}>
          <Link href={`/collections/${c.slug}`} className="group flex aspect-[4/3] flex-col justify-end bg-neutral-100 p-6 transition hover:bg-brand hover:text-white">
            <h2 className="text-2xl">{c.name}</h2>
            <p className="mt-1 text-sm text-muted group-hover:text-white/80">{c.description}</p>
            <span className="mt-3 text-xs uppercase tracking-widest underline-offset-4 group-hover:underline">Explore</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
