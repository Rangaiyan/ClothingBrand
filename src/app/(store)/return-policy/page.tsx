import type { Metadata } from "next";
import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = { title: "Return and Refund Policy", description: "Our returns and refunds process.", alternates: { canonical: "/return-policy" } };

export default function Page() {
  return (
    <InfoPage title="Return and Refund Policy" intro="Our returns and refunds process.">
      <ul><li>Unused, unwashed items in original condition can be returned within 7 days of delivery.</li><li>Orders can be cancelled before they ship.</li><li>Approved refunds for online payments go back to the original payment method.</li></ul>
      <p>Refunds usually reach your account within 5–7 business days after approval.</p>
      <p className="text-xs text-muted">Draft text. Have it reviewed against your business details before launch.</p>
    </InfoPage>
  );
}
