import { TeamAdmin } from "@/components/admin/TeamAdmin";

export const metadata = { title: "Team" };

export default function Page() {
  return <TeamAdmin />;
}

// Behind the admin login gate; cannot be an instant navigation.
export const instant = false;
