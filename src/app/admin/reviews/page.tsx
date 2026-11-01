import { ReviewsAdmin } from "@/components/admin/ReviewsAdmin";

export const metadata = { title: "Reviews" };

export default function Page() {
  return <ReviewsAdmin />;
}

// Behind the admin login gate; cannot be an instant navigation.
export const instant = false;
