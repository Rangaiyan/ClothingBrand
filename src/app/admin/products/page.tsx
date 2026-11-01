import { ProductsList } from "@/components/admin/ProductsList";

export const metadata = { title: "Products" };

export default function Page() {
  return <ProductsList />;
}

// Behind the admin login gate; cannot be an instant navigation.
export const instant = false;
