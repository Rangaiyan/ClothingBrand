import type { Category, Product } from "@/types";

// Legacy flat categories, kept only so old scripts still run. The storefront taxonomy lives in lib/taxonomy.ts.
export const seedCategories: Category[] = [
  { id: "vesti", slug: "vesti", name: "Vesti", description: "Classic veshtis woven for everyday and ceremony.", image: "", order: 1, visible: true },
  { id: "lungi", slug: "lungi", name: "Lungi", description: "Soft, breathable lungis in timeless checks and solids.", image: "", order: 2, visible: true },
];

const sizes = ["Free Size"];
const mk = (sku: string, colour: string, stock: number) =>
  sizes.map((size) => ({ sku: `${sku}-${colour.slice(0, 3).toUpperCase()}`, size, colour, stock }));

const vestiCare = ["Cold hand wash separately for the first wash", "Do not bleach", "Dry in shade", "Iron on medium heat"];
const lungiCare = ["Machine wash cold on gentle cycle", "Do not bleach", "Line dry", "Iron on low heat"];

export const seedProducts: Product[] = [
  {
    id: "p1", slug: "classic-white-vesti", name: "Classic White Vesti",
    description: "A pure white cotton vesti with a fine gold-thread border, woven for comfort through long days.",
    category: "traditional", subcategory: "cotton-vesti", collections: ["everyday-essentials"], price: 1299, originalPrice: 1599, images: [], fabric: "100% Cotton",
    specifications: { Length: "4 m", Border: "Gold zari, 1 inch", Weave: "Handloom" },
    care: vestiCare, variants: [...mk("VST-001", "White", 24), ...mk("VST-001", "Ivory", 10)],
    featured: true, bestSeller: true, published: true, createdAt: "2026-10-20", soldCount: 340,
  },
  {
    id: "p2", slug: "green-border-vesti", name: "Kameleon Green Border Vesti",
    description: "White cotton vesti finished with a deep Kameleon green border, a modern take on a temple classic.",
    category: "traditional", subcategory: "border-vesti", collections: ["trending-now"], price: 1499, originalPrice: 1499, images: [], fabric: "Cotton",
    specifications: { Length: "4 m", Border: "Green, 1.5 inch", Weave: "Power loom" },
    care: vestiCare, variants: mk("VST-002", "White", 18),
    featured: true, bestSeller: false, published: true, createdAt: "2026-10-28", soldCount: 120,
  },
  {
    id: "p3", slug: "silk-blend-vesti", name: "Silk Blend Festive Vesti",
    description: "A festive vesti in a cotton-silk blend with a rich sheen and a woven zari border.",
    category: "traditional", subcategory: "silk-vesti", collections: ["premium", "festive"], price: 2799, originalPrice: 3499, images: [], fabric: "Cotton-Silk Blend",
    specifications: { Length: "4 m", Border: "Zari, 2 inch", Weave: "Handloom" },
    care: ["Dry clean recommended", "Do not wring", "Iron on low heat"], variants: mk("VST-003", "Cream", 6),
    featured: false, bestSeller: true, published: true, createdAt: "2026-09-12", soldCount: 210,
  },
  {
    id: "p4", slug: "checked-cotton-lungi", name: "Checked Cotton Lungi",
    description: "A soft everyday lungi in a classic check, pre-washed for a gentle hand feel.",
    category: "traditional", subcategory: "printed-lungi", collections: ["everyday-essentials"], price: 699, originalPrice: 899, images: [], fabric: "100% Cotton",
    specifications: { Length: "2.2 m", Width: "1.2 m", Weave: "Power loom" },
    care: lungiCare, variants: [...mk("LNG-001", "Navy", 40), ...mk("LNG-001", "Maroon", 22)],
    featured: true, bestSeller: true, published: true, createdAt: "2026-08-02", soldCount: 560,
  },
  {
    id: "p5", slug: "solid-green-lungi", name: "Solid Green Lungi",
    description: "A solid Kameleon green lungi with a subtle contrast hem.",
    category: "traditional", subcategory: "traditional-lungi", collections: [], price: 799, originalPrice: 799, images: [], fabric: "Cotton",
    specifications: { Length: "2.2 m", Width: "1.2 m", Weave: "Power loom" },
    care: lungiCare, variants: mk("LNG-002", "Green", 0),
    featured: false, bestSeller: false, published: true, createdAt: "2026-10-30", soldCount: 40,
  },
  {
    id: "p6", slug: "premium-double-lungi", name: "Premium Double Layer Lungi",
    description: "A heavier double-layer lungi that keeps its drape wash after wash.",
    category: "traditional", subcategory: "premium-lungi", collections: ["premium"], price: 1099, originalPrice: 1399, images: [], fabric: "Cotton",
    specifications: { Length: "2.3 m", Width: "1.2 m", Weave: "Power loom" },
    care: lungiCare, variants: [...mk("LNG-003", "Grey", 15), ...mk("LNG-003", "Black", 9)],
    featured: true, bestSeller: false, published: true, createdAt: "2026-10-25", soldCount: 150,
  },
];
