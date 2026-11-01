import { Dashboard } from "@/components/admin/Dashboard";

export default function AdminHome() {
  return <Dashboard />;
}

// Behind the admin login gate; cannot be an instant navigation.
export const instant = false;
