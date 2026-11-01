import type { Metadata } from "next";
import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = { title: "Privacy Policy", description: "How we handle your information.", alternates: { canonical: "/privacy-policy" } };

export default function Page() {
  return (
    <InfoPage title="Privacy Policy" intro="How we handle your information.">
      <p>We collect the details you give us (name, email, phone, address) to process orders and support your account. Payments are handled by Razorpay; we do not store card details.</p>
      <p>We do not sell your personal information. You can ask us to update or delete your data using the details on our Contact page.</p>
      <p className="text-xs text-muted">Draft text. Have it reviewed against your business details before launch.</p>
    </InfoPage>
  );
}
