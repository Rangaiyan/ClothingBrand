export interface Variant {
  sku: string;
  size: string;
  colour: string;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: "vesti" | "lungi" | string;
  price: number;
  originalPrice: number;
  images: string[];
  fabric: string;
  specifications: Record<string, string>;
  care: string[];
  variants: Variant[];
  featured: boolean;
  bestSeller: boolean;
  published: boolean;
  createdAt: string;
  soldCount: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  order: number;
  visible: boolean;
}

export interface Banner {
  id: string;
  heading: string;
  subheading: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  order: number;
  active: boolean;
}

export interface StoreSettings {
  announcement: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  instagram: string;
  facebook: string;
  codEnabled: boolean;
}

export interface Coupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount?: number;
  perUserLimit?: number;
  expiresAt?: { toDate(): Date } | null;
  active: boolean;
}
