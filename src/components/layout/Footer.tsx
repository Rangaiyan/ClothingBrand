import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/app/icon.png";
import { getSettings } from "@/services/content";

const COLS = [
  {
    title: "Shop",
    links: [
      ["All products", "/shop"],
      ["Vesti", "/collections/vesti"],
      ["Lungi", "/collections/lungi"],
      ["Best Sellers", "/collections/best-sellers"],
    ],
  },
  {
    title: "Help",
    links: [
      ["Contact Us", "/contact"],
      ["FAQs", "/faqs"],
      ["Shipping Policy", "/shipping-policy"],
      ["Returns & Refunds", "/return-policy"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About Kameleon", "/about"],
      ["Privacy Policy", "/privacy-policy"],
      ["Terms & Conditions", "/terms"],
    ],
  },
];

async function Year() {
  "use cache";
  return <>{new Date().getFullYear()}</>;
}

export async function Footer() {
  const st = await getSettings();
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-14 md:grid-cols-4 md:px-8">
        <div>
          <div className="flex items-center gap-3">
            <Image src={logo} alt="" width={40} height={40} className="size-10" />
            <p className="font-serif text-2xl font-semibold tracking-[0.25em] text-brand">KAMELEON</p>
          </div>
          <p className="mt-3 text-sm text-muted">Tradition, Reimagined.</p>
          <ul className="mt-4 space-y-1 text-sm text-muted">
            {st.contactEmail && <li><a href={`mailto:${st.contactEmail}`}>{st.contactEmail}</a></li>}
            {st.contactPhone && <li><a href={`tel:${st.contactPhone}`}>{st.contactPhone}</a></li>}
            {st.instagram && <li><a href={st.instagram} rel="noopener noreferrer" target="_blank">Instagram</a></li>}
            {st.facebook && <li><a href={st.facebook} rel="noopener noreferrer" target="_blank">Facebook</a></li>}
          </ul>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h2 className="font-sans text-xs font-semibold uppercase tracking-widest">{c.title}</h2>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              {c.links.map(([label, href]) => (
                <li key={href}><Link href={href} className="hover:text-foreground">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="border-t border-line py-5 text-center text-xs text-muted">
        © <Suspense fallback="2026"><Year /></Suspense> KAMELEON. All rights reserved.
      </p>
    </footer>
  );
}
