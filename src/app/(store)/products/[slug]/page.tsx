import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductImage } from "@/components/product/ProductImage";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { getGroup, getSubcategory } from "@/lib/taxonomy";
import { discountPercent, formatINR } from "@/lib/utils/format";
import { getReviews } from "@/services/reviews";
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
  const [related, reviews] = await Promise.all([getRelatedProducts(p), getReviews(p.id)]);
  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;
  const off = discountPercent(p.price, p.originalPrice);
  const group = getGroup(p.category);
  const sub = getSubcategory(p.category, p.subcategory);
  const crumbs = [
    ...(group ? [{ label: group.name, href: `/${group.slug}` }] : [{ label: "Shop", href: "/shop" }]),
    ...(group && sub ? [{ label: sub.name, href: `/${group.slug}/${sub.slug}` }] : []),
    { label: p.name },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    sku: p.variants[0]?.sku,
    brand: { "@type": "Brand", name: "KAMELEON" },
    image: p.images,
    ...(reviews.length && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: reviews.length },
      review: reviews.slice(0, 10).map((r) => ({
        "@type": "Review", author: { "@type": "Person", name: r.authorName }, name: r.title, reviewBody: r.body,
        reviewRating: { "@type": "Rating", ratingValue: r.rating }, datePublished: r.createdAt.slice(0, 10),
      })),
    }),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: p.price,
      availability: totalStock(p) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  const info: [string, React.ReactNode][] = [
    ["Fabric & material", p.fabric],
    ["Specifications", <dl key="s" className="grid grid-cols-2 gap-1">{Object.entries({ ...(p.fit ? { Fit: p.fit } : {}), ...p.specifications }).map(([k, v]) => (<div key={k} className="contents"><dt className="text-muted">{k}</dt><dd>{v}</dd></div>))}</dl>],
    ["Care instructions", <ul key="c" className="list-disc pl-5">{p.care.map((c) => <li key={c}>{c}</li>)}</ul>],
    ["Shipping & returns", "Ships within 2–4 business days across India. Unused items can be returned within 7 days of delivery."],
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumbs items={crumbs} />
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
          {reviews.length > 0 && (
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm">
              <span className="text-brand" aria-hidden>{"★".repeat(Math.round(avg))}<span className="text-neutral-300">{"★".repeat(5 - Math.round(avg))}</span></span>
              <span className="text-muted underline underline-offset-4">{avg.toFixed(1)} · {reviews.length} review{reviews.length > 1 ? "s" : ""}</span>
            </a>
          )}
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

      {reviews.length > 0 && (
        <section id="reviews" className="mt-24 scroll-mt-24">
          <h2 className="text-3xl">Customer reviews</h2>
          <p className="mt-2 text-sm text-muted">{avg.toFixed(1)} out of 5 from {reviews.length} review{reviews.length > 1 ? "s" : ""}</p>
          <ul className="mt-8 grid gap-8 md:grid-cols-2">
            {reviews.map((r) => (
              <li key={r.id} className="border-t border-line pt-5">
                <p className="text-brand" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}<span className="text-neutral-300">{"★".repeat(5 - r.rating)}</span></p>
                <h3 className="mt-2 font-sans text-sm font-medium">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{r.body}</p>
                <p className="mt-3 text-xs text-muted">{r.authorName}{r.createdAt && ` · ${new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 text-3xl">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
