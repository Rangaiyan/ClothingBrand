// Single source of truth for the storefront category tree and curated collections.
// Plain data and pure helpers only (no aliased value imports) so scripts can import it too.
// Products reference these by slug: `category` (main), `subcategory`, `collections[]`.

export type MainCategory = "modern" | "traditional";

export interface SubCategory { slug: string; name: string }
export interface CategoryGroup {
  slug: MainCategory;
  name: string;
  tagline: string;
  description: string;
  subcategories: SubCategory[];
}
export interface CollectionDef { slug: string; name: string; description: string }

const sub = (slug: string, name: string): SubCategory => ({ slug, name });

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    slug: "modern",
    name: "Modern",
    tagline: "Contemporary Fashion",
    description: "Contemporary menswear: everyday essentials and streetwear, cut for today.",
    subcategories: [
      sub("t-shirts", "T-Shirts"), sub("shirts", "Shirts"), sub("jeans", "Jeans"),
      sub("formal-pants", "Formal Pants"), sub("casual-pants", "Casual Pants"),
      sub("cargo-pants", "Cargo Pants"), sub("streetwear", "Streetwear"), sub("shorts", "Shorts"),
    ],
  },
  {
    slug: "traditional",
    name: "Traditional",
    tagline: "Timeless Indian Wear",
    description: "Vestis and lungis woven in honest cotton and silk, made to be worn for generations.",
    subcategories: [
      sub("premium-vesti", "Premium Vesti"), sub("cotton-vesti", "Cotton Vesti"),
      sub("border-vesti", "Border Vesti"), sub("silk-vesti", "Silk Vesti"),
      sub("traditional-lungi", "Traditional Lungi"), sub("printed-lungi", "Printed Lungi"),
      sub("premium-lungi", "Premium Lungi"),
    ],
  },
];

export const COLLECTIONS: CollectionDef[] = [
  { slug: "best-sellers", name: "Best Sellers", description: "The pieces our customers come back for." },
  { slug: "trending-now", name: "Trending Now", description: "What's catching eyes right now." },
  { slug: "everyday-essentials", name: "Everyday Essentials", description: "Dependable staples for every day of the week." },
  { slug: "premium", name: "Premium Collection", description: "Our finest fabrics and finishing." },
  { slug: "festive", name: "Festive Collection", description: "Dressed for celebrations and ceremony." },
  { slug: "exclusive", name: "Exclusive Collection", description: "Limited pieces, made in small runs." },
];

export const getGroup = (slug: string) => CATEGORY_GROUPS.find((g) => g.slug === slug);
export const getSubcategory = (group: string, slug: string) =>
  getGroup(group)?.subcategories.find((s) => s.slug === slug);
export const getCollection = (slug: string) => COLLECTIONS.find((c) => c.slug === slug);

/** Where a product's listing lives. */
export const productPath = (category: string, subcategory?: string) =>
  `/${category}${subcategory ? `/${subcategory}` : ""}`;

interface Taxonomised {
  name?: string; fabric?: string; category?: string; subcategory?: string;
  collections?: string[]; featured?: boolean; bestSeller?: boolean;
}

/** Best-guess subcategory for products saved before the Modern/Traditional split. */
function legacySubcategory(p: Taxonomised): string {
  const text = `${p.name ?? ""} ${p.fabric ?? ""}`.toLowerCase();
  if (p.category === "lungi") {
    if (/premium|double/.test(text)) return "premium-lungi";
    if (/print|check/.test(text)) return "printed-lungi";
    return "traditional-lungi";
  }
  if (/silk/.test(text)) return "silk-vesti";
  if (/border/.test(text)) return "border-vesti";
  if (/premium/.test(text)) return "premium-vesti";
  return "cotton-vesti";
}

/**
 * Fills in category / subcategory / collections on any product document, including ones
 * saved with the old flat `vesti` / `lungi` category. Reads never need a data migration.
 */
export function taxonomise<T extends Taxonomised>(p: T): T & { category: string; subcategory: string; collections: string[] } {
  let category = p.category ?? "";
  let subcategory = p.subcategory ?? "";
  if (category === "vesti" || category === "lungi") {
    subcategory = getSubcategory("traditional", subcategory) ? subcategory : legacySubcategory(p);
    category = "traditional";
  }
  const collections = new Set((p.collections ?? []).filter((c) => getCollection(c)));
  if (p.bestSeller) collections.add("best-sellers");
  if (p.featured) collections.add("trending-now");
  return { ...p, category, subcategory, collections: [...collections] };
}
