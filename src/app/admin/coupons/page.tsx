import { CouponsAdmin } from "@/components/admin/CouponsAdmin";

export const metadata = { title: "Coupons" };

export default function Page() {
  return <CouponsAdmin />;
}

// Behind the admin login gate; cannot be an instant navigation.
export const instant = false;
