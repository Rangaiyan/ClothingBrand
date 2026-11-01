"use client";

import { useState } from "react";
import { collection, deleteDoc, doc, orderBy, query, setDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { errMsg, useCollection } from "@/features/admin/hooks";
import type { Category } from "@/types";
import { ImageField } from "./ImageField";
import { btn, btnGhost, Field, Input, input, Notice, PageHeader } from "./ui";

const blank = { slug: "", name: "", description: "", image: "", order: 1, visible: true };
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function CategoriesAdmin() {
  const { rows } = useCollection<Category>(() => query(collection(getDb(), "categories"), orderBy("order")), "categories");
  const [form, setForm] = useState<typeof blank | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.name.trim() || !form.slug) return setError("Name is required.");
    try {
      // The slug is the document id, so products can reference a category by it.
      await setDoc(doc(getDb(), "categories", form.slug), { ...form, order: Number(form.order) });
      setForm(null); setError("");
    } catch (err) { setError(errMsg(err)); }
  }

  return (
    <>
      <PageHeader title="Categories"><button className={btn} onClick={() => { setForm(blank); setEditing(false); }}>New category</button></PageHeader>
      <Notice>{error}</Notice>
      {form && (
        <form onSubmit={save} className="mb-6 grid max-w-2xl gap-4 border border-line bg-white p-5 sm:grid-cols-2">
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })} /></Field>
          <Field label="Slug"><Input value={form.slug} readOnly={editing} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} /></Field>
          <div className="sm:col-span-2"><Field label="Description"><textarea className={input} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
          <Field label="Display order"><Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} /> Visible in store</label>
          <div className="sm:col-span-2">{form.slug ? <ImageField folder="categories" id={form.slug} images={form.image ? [form.image] : []} onChange={(u) => setForm({ ...form, image: u[0] ?? "" })} /> : <p className="text-xs text-muted">Enter a name to upload an image.</p>}</div>
          <div className="flex gap-2 sm:col-span-2"><button className={btn}>Save</button><button type="button" className={btnGhost} onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      )}
      <ul className="divide-y divide-line border border-line bg-white">
        {rows.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-4 p-4 text-sm">
            <div><p className="font-medium">{c.name} <span className="text-muted">/{c.slug}</span></p><p className="text-xs text-muted">Order {c.order} · {c.visible ? "Visible" : "Hidden"}</p></div>
            <div className="flex gap-3">
              <button className="underline" onClick={() => { setForm({ slug: c.slug, name: c.name, description: c.description, image: c.image, order: c.order, visible: c.visible }); setEditing(true); }}>Edit</button>
              <button className="text-red-700 underline" onClick={() => { if (confirm(`Delete category "${c.name}"? Products in it will need a new category.`)) void deleteDoc(doc(getDb(), "categories", c.id)); }}>Delete</button>
            </div>
          </li>
        ))}
        {!rows.length && <li className="p-4 text-sm text-muted">No categories yet.</li>}
      </ul>
    </>
  );
}
