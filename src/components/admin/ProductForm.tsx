"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, doc, getDoc, runTransaction } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { errMsg } from "@/features/admin/hooks";
import { CATEGORY_GROUPS, COLLECTIONS, getGroup, taxonomise } from "@/lib/taxonomy";
import { productSchema, type ProductForm as FormValues, type ProductValues } from "@/validations/product";
import type { Product } from "@/types";
import { ImageField } from "./ImageField";
import { btn, Field, Input, input, Notice } from "./ui";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const toLines = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `${k}: ${v}`).join("\n");
const fromLines = (s: string) =>
  Object.fromEntries(s.split("\n").map((l) => l.split(/:(.*)/)).filter((p) => p[0]?.trim() && p[1]?.trim()).map((p) => [p[0].trim(), p[1].trim()]));

const EMPTY: FormValues = {
  name: "", slug: "", description: "", category: "" as FormValues["category"], subcategory: "", collections: [], fit: "", price: 0, originalPrice: 0, fabric: "",
  specifications: "", care: "", published: false, featured: false, bestSeller: false,
  variants: [{ sku: "", size: "Free Size", colour: "", stock: 0 }],
};

export function ProductForm({ id }: { id: string }) {
  const router = useRouter();
  const isNew = id === "new";
  // A new product gets its id up front so images can upload before the first save.
  const [docId] = useState(() => (isNew ? doc(collection(getDb(), "products")).id : id));
  const [images, setImages] = useState<string[]>([]);
  const [existingStock, setExistingStock] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(isNew);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const { register, control, handleSubmit, reset, setValue, getValues, watch, formState: { errors, isSubmitting } } = useForm<FormValues, unknown, ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: EMPTY,
  });
  const category = watch("category");
  const collections = watch("collections") ?? [];
  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  useEffect(() => {
    if (isNew) return;
    getDoc(doc(getDb(), "products", id)).then((s) => {
      if (!s.exists()) { setError("Product not found."); return; }
      // taxonomise() maps products saved with the old vesti/lungi category onto the new tree.
      const p = taxonomise(s.data() as Product);
      setImages(p.images);
      setExistingStock(Object.fromEntries(p.variants.map((v) => [v.sku, v.stock])));
      reset({ ...p, category: p.category as FormValues["category"], fit: p.fit ?? "", specifications: toLines(p.specifications), care: p.care.join("\n") });
      setLoaded(true);
    });
  }, [id, isNew, reset]);

  const lockedSkus = useMemo(() => new Set(Object.keys(existingStock)), [existingStock]);

  async function onSubmit(v: ProductValues) {
    setError(""); setSaved("");
    try {
      const ref = doc(getDb(), "products", docId);
      // Stock of variants that already exist is taken from the live document, never from
      // this form, so a save can't overwrite stock that orders changed in the meantime.
      await runTransaction(getDb(), async (tx) => {
        const cur = await tx.get(ref);
        const live = cur.exists() ? (cur.data() as Product) : null;
        const stockBySku = new Map(live?.variants.map((x) => [x.sku, x.stock]));
        tx.set(ref, {
          name: v.name, slug: v.slug, description: v.description, category: v.category, subcategory: v.subcategory,
          collections: v.collections, fit: v.fit,
          price: v.price, originalPrice: v.originalPrice, fabric: v.fabric,
          specifications: fromLines(v.specifications),
          care: v.care.split("\n").map((l) => l.trim()).filter(Boolean),
          published: v.published, featured: v.featured, bestSeller: v.bestSeller, images,
          variants: v.variants.map((x) => ({ ...x, stock: stockBySku.get(x.sku) ?? x.stock })),
          createdAt: live?.createdAt ?? new Date().toISOString(),
          soldCount: live?.soldCount ?? 0,
        });
      });
      router.push("/admin/products");
    } catch (e) {
      setError(errMsg(e));
    }
  }

  if (!loaded) return <Notice>{error || "Loading…"}</Notice>;

  const e = errors;
  const card = "space-y-4 border border-line bg-white p-5";
  const cardTitle = "text-sm font-semibold";
  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="sticky top-[49px] z-20 -mx-4 mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-neutral-50 px-4 py-3 md:top-0 md:-mx-8 md:-mt-8 md:px-8">
        <h1 className="text-[22px] font-semibold tracking-tight">{isNew ? "New product" : "Edit product"}</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/products" className="px-4 py-2 text-xs font-semibold uppercase tracking-wider underline">Back</Link>
          <button className={btn} disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save"}</button>
        </div>
      </div>
      <div className="mb-4 space-y-1"><Notice>{error}</Notice><Notice kind="ok">{saved}</Notice></div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Main column */}
        <div className="space-y-6">
          <section className={card}>
            <h2 className={cardTitle}>Images</h2>
            <p className="text-xs text-muted">The first image is the main one. Use “Set as main” to change it.</p>
            <ImageField folder="products" id={docId} images={images} onChange={setImages} multiple />
          </section>

          <section className={`${card} sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0`}>
            <h2 className={`${cardTitle} sm:col-span-2`}>Basic information</h2>
            <Field label="Name" error={e.name?.message}>
              <Input {...register("name", { onChange: (ev) => { if (isNew) setValue("slug", slugify(ev.target.value)); } })} />
            </Field>
            <Field label="URL slug" error={e.slug?.message}><Input {...register("slug")} /></Field>
            <div className="sm:col-span-2">
              <Field label="Description" error={e.description?.message}><textarea {...register("description")} rows={10} className={input} /></Field>
            </div>
            <Field label="Fabric / material" error={e.fabric?.message}><Input {...register("fabric")} /></Field>
            <Field label="Fit (optional)"><Input {...register("fit")} placeholder="Regular, Slim, Relaxed…" /></Field>
          </section>

          <section className={card}>
            <h2 className={cardTitle}>Variants and stock</h2>
            <p className="text-xs text-muted">Stock of existing variants is changed on the Inventory page so every change is logged.</p>
            {fields.map((f, i) => {
              const locked = lockedSkus.has(getValues(`variants.${i}.sku`));
              return (
                <div key={f.id} className="grid grid-cols-2 items-end gap-2 border-t border-line pt-3 sm:grid-cols-[1.4fr_1fr_1fr_0.7fr_auto]">
                  <Field label="SKU" error={e.variants?.[i]?.sku?.message}><Input {...register(`variants.${i}.sku`)} readOnly={locked} /></Field>
                  <Field label="Size" error={e.variants?.[i]?.size?.message}><Input {...register(`variants.${i}.size`)} /></Field>
                  <Field label="Colour" error={e.variants?.[i]?.colour?.message}><Input {...register(`variants.${i}.colour`)} /></Field>
                  <Field label={locked ? "Stock (view)" : "Opening stock"}>
                    <Input type="number" min={0} {...register(`variants.${i}.stock`)} readOnly={locked} />
                  </Field>
                  <button type="button" className="pb-2 text-xs font-semibold text-red-700 underline" onClick={() => remove(i)} disabled={fields.length === 1}>Remove</button>
                </div>
              );
            })}
            <Notice>{typeof e.variants?.message === "string" ? e.variants.message : e.variants?.root?.message}</Notice>
            <button type="button" className="text-xs font-semibold underline" onClick={() => append({ sku: "", size: "Free Size", colour: "", stock: 0 })}>+ Add variant</button>
          </section>

          <section className={`${card} sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0`}>
            <h2 className={`${cardTitle} sm:col-span-2`}>Details</h2>
            <Field label="Specifications (one “Name: value” per line)"><textarea {...register("specifications")} rows={5} className={input} /></Field>
            <Field label="Care instructions (one per line)"><textarea {...register("care")} rows={5} className={input} /></Field>
          </section>
        </div>

        {/* Side column: sticks while scrolling on desktop */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <section className={card}>
            <h2 className={cardTitle}>Status</h2>
            <div className="space-y-2 text-sm font-medium">
              {(["published", "featured", "bestSeller"] as const).map((k) => (
                <label key={k} className="flex items-center gap-2"><input type="checkbox" {...register(k)} />{k === "bestSeller" ? "Best seller" : k[0].toUpperCase() + k.slice(1)}</label>
              ))}
            </div>
          </section>

          <section className={card}>
            <h2 className={cardTitle}>Pricing</h2>
            <Field label="Original price (₹)" error={e.originalPrice?.message}><Input type="number" min={0} {...register("originalPrice")} /></Field>
            <Field label="Selling price (₹)" error={e.price?.message}><Input type="number" min={0} {...register("price")} /></Field>
          </section>

          <section className={card}>
            <h2 className={cardTitle}>Category</h2>
            <Field label="Category" error={e.category?.message}>
              <select {...register("category", { onChange: () => setValue("subcategory", "") })} className={input}>
                <option value="">Select…</option>
                {CATEGORY_GROUPS.map((g) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
              </select>
            </Field>
            <Field label="Subcategory" error={e.subcategory?.message}>
              <select {...register("subcategory")} className={input} disabled={!category}>
                <option value="">{category ? "Select…" : "Choose a category first"}</option>
                {getGroup(category)?.subcategories.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>
            </Field>
          </section>

          <section className={`${card} text-sm`}>
            <h2 className={cardTitle}>Collections</h2>
            <p className="text-xs text-muted">A product can be in several. “Best seller” and “Featured” also place it in Best Sellers and Trending Now.</p>
            <div className="flex flex-col gap-2 font-medium">
              {COLLECTIONS.filter((c) => c.slug !== "best-sellers" && c.slug !== "trending-now").map((c) => (
                <label key={c.slug} className="flex items-center gap-2">
                  <input type="checkbox" checked={collections.includes(c.slug)}
                    onChange={(ev) => setValue("collections", ev.target.checked ? [...collections, c.slug] : collections.filter((x) => x !== c.slug))} />
                  {c.name}
                </label>
              ))}
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
