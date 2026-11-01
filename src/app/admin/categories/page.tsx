import { CategoriesAdmin } from "@/components/admin/CategoriesAdmin";

export const metadata = { title: "Categories" };

export default function Page() {
  return <CategoriesAdmin />;
}

// Behind the admin login gate; cannot be an instant navigation.
export const instant = false;
