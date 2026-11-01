"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, doc, getDoc, query, runTransaction } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { errMsg, useCollection } from "@/features/admin/hooks";
import { productSchema, type ProductForm as FormValues, type ProductValues } from "@/validations/product";
import type { Category, Product } from "@/types";
import { ImageField } from "./ImageField";
import { btn, Field, Input, input, Notice, PageHeader } from "./ui";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const toLines = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `${k}: ${v}`).join("\n");
const fromLines = (s: string) =>
  Object.fromEntries(s.split("\n").map((l) => l.split(/:(.*)/)).filter((p) => p[0]?.trim() && p[1]?.trim()).map((p) => [p[0].trim(), p[1].trim()]));

const EMPTY: FormValues = {
  name: "", slug: "", description: "", category: "", price: 0, originalPrice: 0, fabric: "",
  specifications: "", care: "", published: false, featured: false, bestSeller: false,
  variants: [{ sku: "", size: "Free Size", colour: "", stock: 0 }],
};

export function ProductForm({ id }: { id: string }) {
  const router = useRouter();
  const isNew = id === "new";
  const categories = useCollection<Category>(() => query(collection(getDb(), "categories")), "cats");
  // A new product gets its id up front so images can upload before the first save.
  const [docId] = useState(() => (isNew ? doc(collection(getDb(), "products")).id : id));
  const [images, setImages] = useState<string[]>([]);
  const [existingStock, setExistingStock] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(isNew);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const { register, control, handleSubmit, reset, setValue, getValues, formState: { errors, isSubmitting } } = useForm<FormValues, unknown, ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: EMPTY,
  });
  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  useEffect(() => {
    if (isNew) return;
    getDoc(doc(getDb(), "products", id)).then((s) => {
      if (!s.exists()) { setError("Product not found."); return; }
      const p = s.data() as Product;
      setImages(p.images);
      setExistingStock(Object.fromEntries(p.variants.map((v) => [v.sku, v.stock])));
      reset({ ...p, specifications: toLines(p.specifications), care: p.care.join("\n") });
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
          name: v.name, slug: v.slug, description: v.description, category: v.category,
          price: v.price, originalPrice: v.originalPrice, fabric: v.fabric,
          specifications: fromLines(v.specifications),
          care: v.care.split("\n").map((l) => l.trim()).filter(Boolean),
          published: v.published, featured: v.featured, bestSeller: v.bestSeller, images,
          variants: v.variants.map((x) => ({ ...x, stock: stockBySku.get(x.sku) ?? x.stock })),
          createdAt: live?.createdAt ?? new Date().toISOString(),
          soldCount: live?.soldCount ?? 0,
        });
      });
      setSaved("Saved. The storefront updates within a minute.");
      if (isNew) router.replace(`/admin/products/${docId}`);
    } catch (e) {
      setError(errMsg(e));
    }
  }

  if (!loaded) return <Notice>{error || "Loading…"}</Notice>;

  const e = errors;
  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-8">
      <PageHeader title={isNew ? "New product" : "Edit product"}>
        <Link href="/admin/products" className="px-4 py-2 text-xs uppercase tracking-widest underline">Back</Link>
        <button className={btn} disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save"}</button>
      </PageHeader>
      <Notice>{error}</Notice><Notice kind="ok">{saved}</Notice>

      <section className="grid gap-4 border border-line bg-white p-5 sm:grid-cols-2">
        <Field label="Name" error={e.name?.message}>
          <Input {...register("name", { onChange: (ev) => { if (isNew) setValue("slug", slugify(ev.target.value)); } })} />
        </Field>
        <Field label="URL slug" error={e.slug?.message}><Input {...register("slug")} /></Field>
        <div className="sm:col-span-2">
          <Field label="Description" error={e.description?.message}><textarea {...register("description")} rows={4} className={input} /></Field>
        </div>
        <Field label="Category" error={e.category?.message}>
          <select {...register("category")} className={input}>
            <option value="">Select…</option>
            {categories.rows.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Fabric / material" error={e.fabric?.message}><Input {...register("fabric")} /></Field>
        <Field label="Selling price (₹)" error={e.price?.message}><Input type="number" min={0} {...register("price")} /></Field>
        <Field label="Original price (₹)" error={e.originalPrice?.message}><Input type="number" min={0} {...register("originalPrice")} /></Field>
      </section>

      <section className="space-y-3 border border-line bg-white p-5">
        <h2 className="font-sans text-sm font-medium">Images</h2>
        <p className="text-xs text-muted">The first image is the main one. Use ★ to reorder.</p>
        <ImageField folder="products" id={docId} images={images} onChange={setImages} multiple />
      </section>

      <section className="space-y-3 border border-line bg-white p-5">
        <h2 className="font-sans text-sm font-medium">Variants and stock</h2>
        <p className="text-xs text-muted">Stock of existing variants is changed on the Inventory page so every change is logged.</p>
        {fields.map((f, i) => {
          const locked = lockedSkus.has(getValues(`variants.${i}.sku`));
          return (
            <div key={f.id} className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[1.4fr_1fr_1fr_0.7fr_auto]">
              <Field label="SKU" error={e.variants?.[i]?.sku?.message}><Input {...register(`variants.${i}.sku`)} readOnly={locked} /></Field>
              <Field label="Size" error={e.variants?.[i]?.size?.message}><Input {...register(`variants.${i}.size`)} /></Field>
              <Field label="Colour" error={e.variants?.[i]?.colour?.message}><Input {...register(`variants.${i}.colour`)} /></Field>
              <Field label={locked ? "Stock (view)" : "Opening stock"}>
                <Input type="number" min={0} {...register(`variants.${i}.stock`)} readOnly={locked} />
              </Field>
              <button type="button" className="pb-2 text-xs text-red-700 underline" onClick={() => remove(i)} disabled={fields.length === 1}>Remove</button>
            </div>
          );
        })}
        <Notice>{typeof e.variants?.message === "string" ? e.variants.message : e.variants?.root?.message}</Notice>
        <button type="button" className="text-xs underline" onClick={() => append({ sku: "", size: "Free Size", colour: "", stock: 0 })}>+ Add variant</button>
      </section>

      <section className="grid gap-4 border border-line bg-white p-5 sm:grid-cols-2">
        <Field label="Specifications (one “Name: value” per line)"><textarea {...register("specifications")} rows={5} className={input} /></Field>
        <Field label="Care instructions (one per line)"><textarea {...register("care")} rows={5} className={input} /></Field>
      </section>

      <section className="flex flex-wrap gap-6 border border-line bg-white p-5 text-sm">
        {(["published", "featured", "bestSeller"] as const).map((k) => (
          <label key={k} className="flex items-center gap-2"><input type="checkbox" {...register(k)} />{k === "bestSeller" ? "Best seller" : k[0].toUpperCase() + k.slice(1)}</label>
        ))}
      </section>
    </form>
  );
}
