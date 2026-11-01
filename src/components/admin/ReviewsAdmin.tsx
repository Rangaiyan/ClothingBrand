"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDoc, collection, deleteDoc, doc, orderBy, query, Timestamp, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { errMsg, useCollection, type Row } from "@/features/admin/hooks";
import { reviewSchema, type ReviewForm, type ReviewValues } from "@/validations/review";
import type { Product } from "@/types";
import { Badge, btn, btnGhost, Field, Input, input, Notice, PageHeader, td, th } from "./ui";

type StoredReview = {
  productId: string; authorName: string; rating: number; title: string; body: string;
  createdAt?: { toDate(): Date }; published?: boolean;
};

const today = () => new Date().toISOString().slice(0, 10);
const BLANK: ReviewForm = { productId: "", authorName: "", rating: 5, title: "", body: "", date: "", published: true };
const Stars = ({ n }: { n: number }) => <span aria-label={`${n} out of 5`} className="whitespace-nowrap text-brand">{"★".repeat(n)}<span className="text-neutral-300">{"★".repeat(5 - n)}</span></span>;

export function ReviewsAdmin() {
  const reviews = useCollection<StoredReview>(() => query(collection(getDb(), "reviews"), orderBy("createdAt", "desc")), "reviews");
  const products = useCollection<Product>(() => query(collection(getDb(), "products"), orderBy("name")), "review-products");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ReviewForm, unknown, ReviewValues>({ resolver: zodResolver(reviewSchema), defaultValues: BLANK });
  const nameOf = (id: string) => products.rows.find((p) => p.id === id)?.name ?? id;

  async function onSubmit(v: ReviewValues) {
    setError("");
    try {
      const data = {
        productId: v.productId, authorName: v.authorName, rating: v.rating, title: v.title, body: v.body,
        published: v.published, createdAt: Timestamp.fromDate(new Date(`${v.date}T12:00:00`)),
      };
      if (editId) await updateDoc(doc(getDb(), "reviews", editId), data);
      else await addDoc(collection(getDb(), "reviews"), { ...data, source: "admin" });
      setOpen(false);
    } catch (e) { setError(errMsg(e)); }
  }

  function edit(r: Row<StoredReview>) {
    reset({
      productId: r.productId, authorName: r.authorName, rating: r.rating, title: r.title, body: r.body,
      date: (r.createdAt?.toDate() ?? new Date()).toISOString().slice(0, 10), published: r.published === true,
    });
    setEditId(r.id); setOpen(true);
  }

  return (
    <>
      <PageHeader title="Reviews">
        <button className={btn} onClick={() => { reset({ ...BLANK, date: today() }); setEditId(null); setOpen(true); }}>Add review</button>
      </PageHeader>
      <p className="mb-4 text-xs text-muted">Add customer reviews for a product. Published reviews appear on its page within about a minute.</p>
      <Notice>{error || reviews.error}</Notice>

      {open && (
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="mb-6 grid max-w-3xl gap-4 border border-line bg-white p-5 sm:grid-cols-2">
          <Field label="Product" error={errors.productId?.message}>
            <select {...register("productId")} className={input}>
              <option value="">Select a product</option>
              {products.rows.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Customer name" error={errors.authorName?.message}><Input {...register("authorName")} /></Field>
          <Field label="Rating" error={errors.rating?.message}>
            <select {...register("rating")} className={input}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)} ({n})</option>)}
            </select>
          </Field>
          <Field label="Review date" error={errors.date?.message}><Input type="date" max={today()} {...register("date")} /></Field>
          <div className="sm:col-span-2"><Field label="Title" error={errors.title?.message}><Input {...register("title")} /></Field></div>
          <div className="sm:col-span-2">
            <Field label="Review" error={errors.body?.message}><textarea {...register("body")} rows={4} className={input} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register("published")} /> Published</label>
          <div className="flex gap-2 sm:col-span-2">
            <button className={btn} disabled={isSubmitting}>{editId ? "Save changes" : "Add review"}</button>
            <button type="button" className={btnGhost} onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[800px]">
          <thead><tr><th className={th}>Product</th><th className={th}>Customer</th><th className={th}>Rating</th><th className={th}>Review</th><th className={th}>Status</th><th /></tr></thead>
          <tbody>
            {reviews.rows.map((r) => (
              <tr key={r.id} className="border-t border-line align-top">
                <td className={td}>{nameOf(r.productId)}</td>
                <td className={td}>{r.authorName}<div className="text-xs text-muted">{r.createdAt?.toDate().toLocaleDateString("en-IN")}</div></td>
                <td className={td}><Stars n={r.rating} /></td>
                <td className={`${td} max-w-xs`}><div className="font-medium">{r.title}</div><div className="line-clamp-2 text-xs text-muted">{r.body}</div></td>
                <td className={td}><Badge tone={r.published ? "good" : "neutral"}>{r.published ? "Published" : "Hidden"}</Badge></td>
                <td className={`${td} whitespace-nowrap`}>
                  <button className="mr-3 underline" onClick={() => edit(r)}>Edit</button>
                  <button className="mr-3 underline" onClick={() => updateDoc(doc(getDb(), "reviews", r.id), { published: !r.published })}>{r.published ? "Hide" : "Publish"}</button>
                  <button className="text-red-700 underline" onClick={() => { if (confirm(`Delete this review by ${r.authorName}?`)) void deleteDoc(doc(getDb(), "reviews", r.id)); }}>Delete</button>
                </td>
              </tr>
            ))}
            {!reviews.rows.length && <tr><td className={td} colSpan={6}>{reviews.loading ? "Loading…" : "No reviews yet."}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
