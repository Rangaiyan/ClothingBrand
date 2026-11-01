import { Suspense } from "react";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={null}><AnnouncementBar /></Suspense>
      <Header />
      <main className="flex-1">{children}</main>
      <Suspense fallback={null}><Footer /></Suspense>
    </>
  );
}
