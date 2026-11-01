import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductImage } from "@/components/product/ProductImage";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { discountPercent, formatINR } from "@/lib/utils/format";
import { getProducts, getProductBySlug, getRelatedProducts, totalStock } from "@/services/catalog";

export async function generateStaticParams() {
  const slugs = (await getProducts()).map((p) => ({ slug: p.slug }));
  // Cache Components needs at least one entry; an empty store gets a placeholder that 404s.
  return slugs.length ? slugs : [{ slug: "_" }];
}

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
  const p = await getProductBySlug((await props.params).slug);
  if (!p) return {};
  return {
    title: p.name,
    description: p.description,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title: p.name, description: p.description, type: "website", images: p.images.slice(0, 1) },
  };
}

export default function ProductPage(props: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto min-h-[60vh] max-w-[1440px] px-4 py-12 md:px-8" aria-busy="true" />}>
      <ProductPageContent {...props} />
    </Suspense>
  );
}

async function ProductPageContent(props: PageProps<"/products/[slug]">) {
  const p = await getProductBySlug((await props.params).slug);
  if (!p) notFound();
  const related = await getRelatedProducts(p);
  const off = discountPercent(p.price, p.originalPrice);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    sku: p.variants[0]?.sku,
    brand: { "@type": "Brand", name: "KAMELEON" },
    image: p.images,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: p.price,
      availability: totalStock(p) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  const info: [string, React.ReactNode][] = [
    ["Fabric & material", p.fabric],
    ["Specifications", <dl key="s" className="grid grid-cols-2 gap-1">{Object.entries(p.specifications).map(([k, v]) => (<div key={k} className="contents"><dt className="text-muted">{k}</dt><dd>{v}</dd></div>))}</dl>],
    ["Care instructions", <ul key="c" className="list-disc pl-5">{p.care.map((c) => <li key={c}>{c}</li>)}</ul>],
    ["Shipping & returns", "Ships within 2–4 business days across India. Unused items can be returned within 7 days of delivery."],
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="grid gap-10 md:grid-cols-2">
        <div className="grid gap-3">
          {(p.images.length ? p.images : [""]).map((src, i) => (
            <div key={i} className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
              <ProductImage src={src || undefined} name={p.name} seed={i} priority={i === 0} sizes="(min-width: 768px) 50vw, 100vw" />
            </div>
          ))}
        </div>

        <div className="md:sticky md:top-24 md:self-start">
          <h1 className="text-4xl md:text-5xl">{p.name}</h1>
          <p className="mt-4 text-xl">
            <span className="font-medium">{formatINR(p.price)}</span>
            {off > 0 && (<>
              <span className="ml-3 text-muted line-through">{formatINR(p.originalPrice)}</span>
              <span className="ml-3 text-sm text-brand">{off}% off</span>
            </>)}
          </p>
          <p className="mt-1 text-xs text-muted">Inclusive of all taxes</p>
          <p className="mt-6 text-sm leading-relaxed text-muted">{p.description}</p>
          <PurchasePanel product={p} />
          <div className="mt-10 divide-y divide-line border-y border-line">
            {info.map(([title, body]) => (
              <details key={title} className="group py-4">
                <summary className="cursor-pointer text-sm font-medium">{title}</summary>
                <div className="mt-3 text-sm text-muted">{body}</div>
              </details>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 text-3xl">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
