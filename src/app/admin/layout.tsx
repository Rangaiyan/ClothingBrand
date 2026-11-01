import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";

// The admin renders only after the login/admin-claim check, so it can't be an instant
// navigation. Opt the whole /admin tree out of that dev-time validation.
export const instant = false;

export const metadata: Metadata = { title: { default: "Admin", template: "%s | KAMELEON Admin" }, robots: { index: false, follow: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
