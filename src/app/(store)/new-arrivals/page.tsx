import type { Metadata } from "next";
import { Listing } from "@/components/catalog/Listing";

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "The latest additions across Modern and Traditional.",
  alternates: { canonical: "/new-arrivals" },
};

export default function Page(props: PageProps<"/new-arrivals">) {
  return (
    <Listing title="New Arrivals" description="The latest additions across Modern and Traditional."
      crumbs={[{ label: "New Arrivals" }]} base={{ sort: "newest" }} searchParams={props.searchParams} />
  );
}
