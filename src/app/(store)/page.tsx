import Link from "next/link";
import { HeroBanner, type Slide } from "@/components/layout/HeroBanner";
import { ReviewsCarousel } from "@/components/layout/ReviewsCarousel";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getCategories, getProducts } from "@/services/catalog";
import { getBanners } from "@/services/content";
import { getLatestReviews } from "@/services/reviews";

const DEFAULT_SLIDES: Slide[] = [
  { src: "/banners/trending-shirts.jpg", alt: "New arrivals: Trending Shirts. Modern fits, everyday style.", href: "/collections/new-arrivals" },
  { src: "/banners/vesti-collection.jpg", alt: "Premium Vesti collection. Tradition in every fold.", href: "/collections/vesti" },
];

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

export default async function HomePage() {
  const [banners, categories, fresh, best, reviews, allProducts] = await Promise.all([
    getBanners(),
    getCategories(),
    getProducts({ sort: "newest", limit: 4 }),
    getProducts({ sort: "best", bestSeller: true, limit: 4 }),
    getLatestReviews(6),
    getProducts(),
  ]);
  const bySlug = new Map(allProducts.map((p) => [p.id, p]));

  // Admin-managed banners (with an image) win; otherwise show the built-in launch banners.
  const managed = banners.filter((b) => b.image).map((b) => ({ src: b.image, alt: b.heading, href: b.ctaHref || "/shop" }));
  const slides = managed.length ? managed : DEFAULT_SLIDES;
  return (
    <>
      <HeroBanner slides={slides} />

      <Section title="Shop by Category">
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((c) => (
            <Link key={c.id} href={`/collections/${c.slug}`} className="group relative flex aspect-[16/10] items-end bg-neutral-100 p-6">
              <div>
                <h3 className="text-3xl">{c.name}</h3>
                <p className="mt-1 text-sm text-muted">{c.description}</p>
                <span className="mt-3 inline-block text-xs uppercase tracking-widest underline-offset-4 group-hover:underline">Explore</span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="New Arrivals" href="/collections/new-arrivals"><ProductGrid products={fresh} /></Section>
      <Section title="Best Sellers" href="/collections/best-sellers"><ProductGrid products={best} /></Section>

      {reviews.length > 0 && (
        <Section title="What Our Customers Say">
          <ReviewsCarousel reviews={reviews.map((r) => {
            const product = bySlug.get(r.productId);
            return { id: r.id, rating: r.rating, title: r.title, body: r.body, authorName: r.authorName, product: product && { name: product.name, slug: product.slug } };
          })} />
        </Section>
      )}

      <section className="mx-auto mt-24 max-w-3xl px-4 text-center">
        <h2 className="text-3xl md:text-4xl">Our Story</h2>
        <p className="mt-5 text-muted">
          KAMELEON takes the garments our grandfathers wore and rethinks them: the same honest cotton,
          the same careful weave, refined for today. Like its namesake, it adapts without losing what it is.
        </p>
        <Link href="/about" className="mt-6 inline-block text-sm underline underline-offset-4">Read more</Link>
      </section>
      <NewsletterForm />
    </>
  );
}
