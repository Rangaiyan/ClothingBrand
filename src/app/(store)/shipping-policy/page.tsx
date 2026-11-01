import type { Metadata } from "next";
import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = { title: "Shipping Policy", description: "How and when we deliver.", alternates: { canonical: "/shipping-policy" } };

export default function Page() {
  return (
    <InfoPage title="Shipping Policy" intro="How and when we deliver.">
      <ul><li>We ship across India.</li><li>Orders are dispatched within 2–4 business days.</li><li>Shipping is free on orders of ₹1,999 and above; otherwise a flat ₹99 applies.</li><li>You will receive tracking details once your order ships.</li></ul>
      <p>Delivery times are estimates and may vary by location and carrier.</p>
      <p className="text-xs text-muted">Draft text. Have it reviewed against your business details before launch.</p>
    </InfoPage>
  );
}
