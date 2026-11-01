import { OrdersAdmin } from "@/components/admin/OrdersAdmin";

export const metadata = { title: "Orders" };

export default function Page() {
  return <OrdersAdmin />;
}

// Behind the admin login gate; cannot be an instant navigation.
export const instant = false;
