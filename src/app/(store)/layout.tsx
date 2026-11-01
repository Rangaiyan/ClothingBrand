import { Suspense } from "react";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav, Header } from "@/components/layout/Header";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={null}><AnnouncementBar /></Suspense>
      <Header />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Suspense fallback={null}><Footer /></Suspense>
      <BottomNav />
    </>
  );
}
