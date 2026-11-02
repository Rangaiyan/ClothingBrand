import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { CATEGORY_GROUPS } from "@/lib/taxonomy";
import { getActiveCollections, getProducts } from "@/services/catalog";

const STATIC = ["", "/shop", "/modern", "/traditional", "/collections", "/new-arrivals", "/about", "/contact", "/faqs", "/shipping-policy", "/return-policy", "/privacy-policy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([getProducts(), getActiveCollections()]);
  return [
    ...STATIC.map((p) => ({ url: `${SITE_URL}${p}` })),
    ...CATEGORY_GROUPS.flatMap((g) => g.subcategories.map((s) => ({ url: `${SITE_URL}/${g.slug}/${s.slug}` }))),
    ...collections.map((c) => ({ url: `${SITE_URL}/collections/${c.slug}` })),
    ...products.map((p) => ({ url: `${SITE_URL}/products/${p.slug}` })),
  ];
}
