import type { Metadata } from "next";
import { Listing } from "@/components/catalog/Listing";
import { getGroup } from "@/lib/taxonomy";

const group = getGroup("modern")!;

export const metadata: Metadata = {
  title: `${group.name} · ${group.tagline}`,
  description: group.description,
  alternates: { canonical: "/modern" },
};

export default function Page(props: PageProps<"/modern">) {
  return (
    <Listing
      title={group.name}
      description={group.tagline + ". " + group.description}
      crumbs={[{ label: group.name }]}
      base={{ category: group.slug }}
      searchParams={props.searchParams}
      chips={group.subcategories.map((s) => ({ label: s.name, href: `/${group.slug}/${s.slug}` }))}
    />
  );
}
