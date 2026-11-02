"use client";

import { collection, query } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { useCollection } from "@/features/admin/hooks";
import { CATEGORY_GROUPS, COLLECTIONS, taxonomise } from "@/lib/taxonomy";
import type { Product } from "@/types";
import { PageHeader } from "./ui";

/** Read-only view of the store structure. Assign a product's category and collections on its edit page. */
export function CategoriesAdmin() {
  const { rows } = useCollection<Product>(() => query(collection(getDb(), "products")), "products-taxonomy");
  const products = rows.map(taxonomise);
  const count = (f: (p: Product) => boolean) => products.filter(f).length;

  return (
    <>
      <PageHeader title="Categories and collections" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        The Modern / Traditional structure is fixed. Choose a product&apos;s category, subcategory and collections on its edit page and it appears on the matching storefront pages automatically.
        Counts include drafts.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        {CATEGORY_GROUPS.map((g) => (
          <section key={g.slug} className="border border-line bg-white p-5">
            <h2 className="font-sans text-sm font-medium">{g.name} <span className="text-muted">· {g.tagline} · /{g.slug}</span></h2>
            <ul className="mt-3 divide-y divide-line text-sm">
              {g.subcategories.map((s) => (
                <li key={s.slug} className="flex justify-between py-2">
                  <span>{s.name} <span className="text-muted">/{g.slug}/{s.slug}</span></span>
                  <span className="text-muted">{count((p) => p.category === g.slug && p.subcategory === s.slug)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section className="border border-line bg-white p-5">
          <h2 className="font-sans text-sm font-medium">Collections</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {COLLECTIONS.map((c) => (
              <li key={c.slug} className="flex justify-between py-2">
                <span>{c.name} <span className="text-muted">/collections/{c.slug}</span></span>
                <span className="text-muted">{count((p) => p.collections.includes(c.slug))}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
