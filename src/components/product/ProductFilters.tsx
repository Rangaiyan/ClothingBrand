// Plain GET form: filters live in the URL, so listings stay server-rendered and shareable.
export function ProductFilters({
  values,
  colours,
  sizes = [],
}: {
  values: Record<string, string | undefined>;
  colours: string[];
  sizes?: string[];
}) {
  const field = "border border-line bg-white px-3 py-2 text-sm";
  return (
    <form className="mb-8 flex flex-wrap items-end gap-3 border-b border-line pb-6" aria-label="Filter products">
      <label className="text-xs text-muted">
        Colour
        <select name="colour" defaultValue={values.colour ?? ""} className={`${field} mt-1 block`}>
          <option value="">All</option>
          {colours.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>
      {sizes.length > 1 && (
        <label className="text-xs text-muted">
          Size
          <select name="size" defaultValue={values.size ?? ""} className={`${field} mt-1 block`}>
            <option value="">All</option>
            {sizes.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
      )}
      <label className="text-xs text-muted">
        Max price
        <select name="maxPrice" defaultValue={values.maxPrice ?? ""} className={`${field} mt-1 block`}>
          <option value="">Any</option>
          {[1000, 1500, 2000, 3000].map((n) => <option key={n} value={n}>Under ₹{n}</option>)}
        </select>
      </label>
      <label className="text-xs text-muted">
        Availability
        <select name="inStock" defaultValue={values.inStock ?? ""} className={`${field} mt-1 block`}>
          <option value="">All</option>
          <option value="1">In stock</option>
        </select>
      </label>
      <label className="text-xs text-muted sm:ml-auto">
        Sort by
        <select name="sort" defaultValue={values.sort ?? "featured"} className={`${field} mt-1 block`}>
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="best">Best selling</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </label>
      {values.q && <input type="hidden" name="q" value={values.q} />}
      <button className="bg-foreground px-5 py-2 text-xs uppercase tracking-widest text-white">Apply</button>
    </form>
  );
}
