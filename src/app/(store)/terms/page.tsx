import type { Metadata } from "next";
import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = { title: "Terms and Conditions", description: "The terms of using this store.", alternates: { canonical: "/terms" } };

export default function Page() {
  return (
    <InfoPage title="Terms and Conditions" intro="The terms of using this store.">
      <p>By placing an order you agree to provide accurate information and to pay the listed price. Prices are in Indian rupees and inclusive of applicable taxes. We may cancel orders affected by pricing or stock errors and will refund any payment received.</p>
      <p className="text-xs text-muted">Draft text. Have it reviewed against your business details before launch.</p>
    </InfoPage>
  );
}
