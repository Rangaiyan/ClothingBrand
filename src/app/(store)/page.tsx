import Link from "next/link";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getCategories, getProducts } from "@/services/catalog";
import { getBanners } from "@/services/content";

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
  const [banners, categories, fresh, best] = await Promise.all([
    getBanners(),
    getCategories(),
    getProducts({ sort: "newest", limit: 4 }),
    getProducts({ sort: "best", bestSeller: true, limit: 4 }),
  ]);

  const hero = banners[0];
  return (
    <>
      <section className="bg-brand text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-[1440px] flex-col items-start justify-center px-4 py-20 md:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">KAMELEON</p>
          <h1 className="mt-4 text-5xl leading-tight md:text-8xl">{hero?.heading || "Tradition, Reimagined."}</h1>
          <p className="mt-6 max-w-md text-white/80">
            {hero?.subheading || "Vestis and lungis woven with heritage, finished for the way you live today."}
          </p>
          <Link href={hero?.ctaHref || "/shop"} className="mt-10 bg-white px-8 py-3 text-xs font-medium uppercase tracking-widest text-brand transition hover:bg-neutral-100">
            {hero?.ctaLabel || "Shop the collection"}
          </Link>
        </div>
      </section>

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
