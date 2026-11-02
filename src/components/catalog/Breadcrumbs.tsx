import Link from "next/link";

export interface Crumb { label: string; href?: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {all.map((c, i) => (
          <li key={c.label} className="flex items-center gap-2">
            {c.href && i < all.length - 1 ? <Link href={c.href} className="hover:text-foreground">{c.label}</Link> : <span aria-current="page" className="text-foreground">{c.label}</span>}
            {i < all.length - 1 && <span aria-hidden>/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
