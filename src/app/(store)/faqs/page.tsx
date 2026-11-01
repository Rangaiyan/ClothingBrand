import type { Metadata } from "next";
import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = { title: "FAQs", description: "Quick answers to common questions.", alternates: { canonical: "/faqs" } };

export default function Page() {
  return (
    <InfoPage title="FAQs" intro="Quick answers to common questions.">
      <h2>Orders and payment</h2>
      <p><strong>Which payment methods do you accept?</strong> UPI, debit and credit cards, net banking, and Cash on Delivery where available.</p>
      <p><strong>Is my payment secure?</strong> Payments are processed by Razorpay. We never see or store your card details.</p>
      <h2>Delivery</h2>
      <p><strong>How long does delivery take?</strong> Orders ship within 2–4 business days and usually arrive within 3–7 days after that.</p>
      <p><strong>Can I track my order?</strong> Yes. Once shipped, tracking details appear in My Account under My Orders.</p>
      <h2>Returns</h2>
      <p><strong>Can I return an item?</strong> Unused items can be returned within 7 days of delivery. See our <a href="/return-policy">Return and Refund Policy</a>.</p>
    </InfoPage>
  );
}
