import type { Metadata } from "next";
import { Listing } from "@/components/catalog/Listing";
import { CATEGORY_GROUPS } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Shop All", alternates: { canonical: "/shop" } };

export default function ShopPage(props: PageProps<"/shop">) {
  return (
    <Listing
      title="Shop All"
      crumbs={[{ label: "Shop" }]}
      base={{}}
      searchParams={props.searchParams}
      chips={CATEGORY_GROUPS.map((g) => ({ label: g.name, href: `/${g.slug}` }))}
    />
  );
}
