import { z } from "zod";

const num = (label: string) => z.coerce.number({ error: `${label} is required` }).min(0, `${label} can't be negative`);

export const productSchema = z
  .object({
    name: z.string().min(2, "Enter a name"),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only"),
    description: z.string().min(10, "Add a short description"),
    category: z.string().min(1, "Choose a category"),
    price: num("Price"),
    originalPrice: num("Original price"),
    fabric: z.string().min(2, "Enter the fabric"),
    specifications: z.string(),
    care: z.string(),
    published: z.boolean(),
    featured: z.boolean(),
    bestSeller: z.boolean(),
    variants: z
      .array(z.object({
        sku: z.string().min(2, "SKU required"),
        size: z.string().min(1, "Size required"),
        colour: z.string().min(1, "Colour required"),
        stock: z.coerce.number().int().min(0),
      }))
      .min(1, "Add at least one variant"),
  })
  .refine((v) => v.originalPrice >= v.price, { path: ["originalPrice"], message: "Original price must be at least the selling price" })
  .refine((v) => new Set(v.variants.map((x) => x.sku)).size === v.variants.length, { path: ["variants"], message: "SKUs must be unique" });

export type ProductForm = z.input<typeof productSchema>;
export type ProductValues = z.output<typeof productSchema>;
