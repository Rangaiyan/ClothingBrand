import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroBanner, type Slide } from "@/components/layout/HeroBanner";
import { ReviewsCarousel } from "@/components/layout/ReviewsCarousel";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { ProductGrid } from "@/components/product/ProductGrid";
import { CATEGORY_GROUPS } from "@/lib/taxonomy";
import { getProducts } from "@/services/catalog";
import { getLatestReviews } from "@/services/reviews";

function Section({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto mt-20 max-w-[1440px] px-4 md:px-8">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="text-3xl md:text-4xl">{title}</h2>
        {href && <Link href={href} className="text-sm underline underline-offset-4">View all</Link>}
      </div>
      {children}
    </section>
  );
}

// Banner artwork carries its own text. Keep new images at about 2:1 (e.g. 1758 x 895).
const SLIDES: Slide[] = [
  { src: "/banners/hero/luxury-arrival.png", alt: "Kameleon is arriving soon. A new expression of everyday luxury.", href: "/new-arrivals" },
  { src: "/banners/hero/elevated.png", alt: "Everyday wear, elevated. Kameleon Essentials, new collection.", href: "/new-arrivals" },
  { src: "/banners/hero/essentials-coming-soon.png", alt: "Kameleon Everyday Essentials: modern fits, timeless comfort. Coming soon.", href: "/modern" },
];

const CATEGORY_IMAGE: Record<string, string> = { modern: "/banners/modern.png", traditional: "/banners/traditionals.png" };

export default async function HomePage() {
  const [fresh, trending, modern, traditional, best, reviews, allProducts] = await Promise.all([
    getProducts({ sort: "newest", limit: 4 }),
    getProducts({ collection: "trending-now", limit: 4 }),
    getProducts({ category: "modern", sort: "featured", limit: 4 }),
    getProducts({ category: "traditional", sort: "featured", limit: 4 }),
    getProducts({ collection: "best-sellers", sort: "best", limit: 4 }),
    getLatestReviews(6),
    getProducts(),
  ]);
  const byId = new Map(allProducts.map((p) => [p.id, p]));
  const [modernGroup, traditionalGroup] = CATEGORY_GROUPS;

  // A section with no products is left out entirely, never filled with placeholders.
  const rows: { title: string; href: string; products: typeof fresh }[] = [
    { title: "New Arrivals", href: "/new-arrivals", products: fresh },
    { title: "Trending Now", href: "/collections/trending-now", products: trending },
    { title: "Explore Modern", href: "/modern", products: modern },
    { title: "Explore Traditional", href: "/traditional", products: traditional },
    { title: "Best Sellers", href: "/collections/best-sellers", products: best },
  ];

  return (
    <>
      <HeroBanner slides={SLIDES} />

      <section aria-label="Shop by category" className="mx-auto grid max-w-[1440px] grid-cols-2 gap-2 px-4 pt-2 md:gap-4 md:px-8 md:pt-4">
        {[modernGroup, traditionalGroup].map((g, i) => (
          <Link key={g.slug} href={`/${g.slug}`} className="group relative block md:aspect-[16/10] md:overflow-hidden">
            <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 md:absolute md:inset-0 md:aspect-auto">
              <Image src={CATEGORY_IMAGE[g.slug]} alt={`${g.name}: ${g.tagline}`} fill priority={i === 0}
                sizes="(min-width: 1440px) 704px, 50vw"
                className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]" />
              {/* Phones: name and arrow sit on the photo. Desktop shows the text label instead (below). */}
              <span aria-hidden className="absolute bottom-1.5 left-1.5 font-serif text-[14px] leading-none text-[#111111] md:hidden">{g.name}</span>
              <ArrowRight aria-hidden strokeWidth={1.75}
                className="absolute bottom-2 right-2 size-5 text-[#111111] transition-transform group-hover:translate-x-1 md:hidden" />
            </div>
            {/* Phones: tagline under the photo. Tablet and up: tagline, name and "Shop" link over the photo. */}
            <div className="pt-2 text-[#111111] md:absolute md:bottom-8 md:left-8 md:pt-0">
              <p className="text-[9px] uppercase tracking-[0.12em] md:text-[11px] md:tracking-[0.25em]">{g.tagline}</p>
              <h2 className="hidden md:mt-1 md:block md:text-4xl">{g.name}</h2>
              <span className="mt-3 hidden text-xs uppercase tracking-widest underline underline-offset-4 md:inline-block">Shop {g.name}</span>
            </div>
          </Link>
        ))}
      </section>

      {rows.filter((r) => r.products.length > 0).map((r) => (
        <Section key={r.title} title={r.title} href={r.href}><ProductGrid products={r.products} /></Section>
      ))}

      {reviews.length > 0 && (
        <Section title="What Our Customers Say">
          <ReviewsCarousel reviews={reviews.map((r) => {
            const product = byId.get(r.productId);
            return { id: r.id, rating: r.rating, title: r.title, body: r.body, authorName: r.authorName, product: product && { name: product.name, slug: product.slug } };
          })} />
        </Section>
      )}

      <section className="mx-auto mt-24 max-w-3xl px-4 text-center">
        <h2 className="text-3xl md:text-4xl">Our Story</h2>
        <p className="mt-5 text-muted">
          KAMELEON is two wardrobes under one name: contemporary menswear cut for today, and the vestis
          and lungis our grandfathers wore, kept honest in cotton and silk. Like its namesake, it adapts
          without losing what it is.
        </p>
        <Link href="/about" className="mt-6 inline-block text-sm underline underline-offset-4">Read more</Link>
      </section>
      <NewsletterForm />
    </>
  );
}
