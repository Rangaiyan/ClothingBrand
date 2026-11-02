import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Listing } from "@/components/catalog/Listing";
import { getGroup, getSubcategory } from "@/lib/taxonomy";

const group = getGroup("traditional")!;

export function generateStaticParams() {
  return group.subcategories.map((s) => ({ sub: s.slug }));
}

export async function generateMetadata(props: PageProps<"/traditional/[sub]">): Promise<Metadata> {
  const sub = getSubcategory(group.slug, (await props.params).sub);
  if (!sub) return {};
  return {
    title: `${sub.name} · ${group.name}`,
    description: `Shop ${sub.name} from KAMELEON's ${group.name} range.`,
    alternates: { canonical: `/${group.slug}/${sub.slug}` },
  };
}

export default function Page(props: PageProps<"/traditional/[sub]">) {
  return (
    <Suspense fallback={<div className="mx-auto min-h-[60vh] max-w-[1440px] px-4 py-12 md:px-8" aria-busy="true" />}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content(props: PageProps<"/traditional/[sub]">) {
  const sub = getSubcategory(group.slug, (await props.params).sub);
  if (!sub) notFound();
  return (
    <Listing
      title={sub.name}
      crumbs={[{ label: group.name, href: `/${group.slug}` }, { label: sub.name }]}
      base={{ category: group.slug, subcategory: sub.slug }}
      searchParams={props.searchParams}
      chips={group.subcategories.map((s) => ({ label: s.name, href: `/${group.slug}/${s.slug}`, active: s.slug === sub.slug }))}
      emptyText={`${sub.name} are coming soon. Browse the rest of ${group.name} in the meantime.`}
    />
  );
}
