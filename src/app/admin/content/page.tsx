import { ContentAdmin } from "@/components/admin/ContentAdmin";

export const metadata = { title: "Store content" };

export default function Page() {
  return <ContentAdmin />;
}

// Behind the admin login gate; cannot be an instant navigation.
export const instant = false;
