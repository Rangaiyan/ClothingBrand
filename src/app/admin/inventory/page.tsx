import { InventoryAdmin } from "@/components/admin/InventoryAdmin";

export const metadata = { title: "Inventory" };

export default function Page() {
  return <InventoryAdmin />;
}

// Behind the admin login gate; cannot be an instant navigation.
export const instant = false;
