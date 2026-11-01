import { Suspense } from "react";
import type { Metadata } from "next";
import { InfoPage } from "@/components/layout/InfoPage";
import { getSettings } from "@/services/content";

export const metadata: Metadata = { title: "Contact Us", description: "Get in touch with KAMELEON.", alternates: { canonical: "/contact" } };

async function Details() {
  const s = await getSettings();
  const rows = [["Email", s.contactEmail, `mailto:${s.contactEmail}`], ["Phone", s.contactPhone, `tel:${s.contactPhone}`], ["Address", s.address, ""]].filter(([, v]) => v);
  if (!rows.length) return <p>Contact details will appear here soon.</p>;
  return <ul>{rows.map(([k, v, href]) => <li key={k}>{k}: {href ? <a href={href}>{v}</a> : v}</li>)}</ul>;
}

export default function Page() {
  return (
    <InfoPage title="Contact Us" intro="We would love to hear from you.">
      <Suspense fallback={null}><Details /></Suspense>
    </InfoPage>
  );
}
