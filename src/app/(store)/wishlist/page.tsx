import type { Metadata } from "next";
import { WishlistView } from "@/components/product/WishlistView";
import { getProducts } from "@/services/catalog";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const products = await getProducts();
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 md:px-8">
      <h1 className="mb-8 text-4xl md:text-5xl">Wishlist</h1>
      <WishlistView products={products} />
    </div>
  );
}
