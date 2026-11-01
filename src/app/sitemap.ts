import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getCategories, getProducts } from "@/services/catalog";

const STATIC = ["", "/shop", "/collections/new-arrivals", "/collections/best-sellers", "/about", "/contact", "/faqs", "/shipping-policy", "/return-policy", "/privacy-policy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return [
    ...STATIC.map((p) => ({ url: `${SITE_URL}${p}` })),
    ...categories.map((c) => ({ url: `${SITE_URL}/collections/${c.slug}` })),
    ...products.map((p) => ({ url: `${SITE_URL}/products/${p.slug}` })),
  ];
}
