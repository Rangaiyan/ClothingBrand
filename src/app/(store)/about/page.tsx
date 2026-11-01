import type { Metadata } from "next";
import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = { title: "About Kameleon", description: "Tradition, Reimagined.", alternates: { canonical: "/about" } };

export default function Page() {
  return (
    <InfoPage title="About Kameleon" intro="Tradition, Reimagined.">
      <p>KAMELEON is an Indian textile brand rethinking the garments our grandfathers wore. We begin with honest cotton and careful weaving, then refine fit, finish and colour for the way people live today.</p>
      <p>Our range starts with the vesti and the lungi, and grows from there. Like the animal we are named after, we adapt without losing what we are.</p>
    </InfoPage>
  );
}
