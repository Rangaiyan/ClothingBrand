"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, deleteDoc, doc, orderBy, query, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { formatINR } from "@/lib/utils/format";
import { errMsg, useCollection } from "@/features/admin/hooks";
import { couponSchema, type CouponForm, type CouponValues } from "@/validations/coupon";
import type { Coupon } from "@/types";
import { Badge, btn, btnGhost, Field, Input, input, Notice, PageHeader, td, th } from "./ui";

const BLANK: CouponForm = { code: "", type: "percent", value: 10, minOrder: "", maxDiscount: "", usageLimit: "", perUserLimit: "", expiresOn: "", firstOrderOnly: false, active: true };

export function CouponsAdmin() {
  const { rows, loading } = useCollection<Coupon>(() => query(collection(getDb(), "coupons"), orderBy("code")), "coupons");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CouponForm, unknown, CouponValues>({ resolver: zodResolver(couponSchema), defaultValues: BLANK });

  async function onSubmit(v: CouponValues) {
    setError("");
    try {
      const code = v.code.toUpperCase();
      // Merge so editing a coupon never resets how many times it has been used.
      await setDoc(doc(getDb(), "coupons", code), {
        code, type: v.type, value: v.value, active: v.active,
        minOrder: v.minOrder ?? null, maxDiscount: v.maxDiscount ?? null,
        usageLimit: v.usageLimit ?? null, perUserLimit: v.perUserLimit ?? null, firstOrderOnly: v.firstOrderOnly === true,
        expiresAt: v.expiresOn ? Timestamp.fromDate(new Date(`${v.expiresOn}T23:59:59`)) : null,
      }, { merge: true });
      setOpen(false);
    } catch (e) { setError(errMsg(e)); }
  }

  function edit(c: Coupon & { id: string }) {
    reset({
      code: c.code, type: c.type, value: c.value, active: c.active,
      minOrder: c.minOrder ?? "", maxDiscount: c.maxDiscount ?? "", usageLimit: c.usageLimit ?? "", perUserLimit: c.perUserLimit ?? "", firstOrderOnly: c.firstOrderOnly === true,
      expiresOn: c.expiresAt ? c.expiresAt.toDate().toISOString().slice(0, 10) : "",
    });
    setEditing(true); setOpen(true);
  }

  return (
    <>
      <PageHeader title="Coupons"><button className={btn} onClick={() => { reset(BLANK); setEditing(false); setOpen(true); }}>New coupon</button></PageHeader>
      <Notice>{error}</Notice>
      {open && (
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="mb-6 grid max-w-3xl gap-4 border border-line bg-white p-5 sm:grid-cols-3">
          <Field label="Code" error={errors.code?.message}><Input {...register("code")} readOnly={editing} className="uppercase" /></Field>
          <Field label="Type"><select {...register("type")} className={input}><option value="percent">Percentage</option><option value="fixed">Fixed amount (₹)</option></select></Field>
          <Field label="Value" error={errors.value?.message}><Input type="number" step="any" {...register("value")} /></Field>
          <Field label="Minimum order (₹)"><Input type="number" {...register("minOrder")} /></Field>
          <Field label="Maximum discount (₹)"><Input type="number" {...register("maxDiscount")} /></Field>
          <Field label="Expires on"><Input type="date" {...register("expiresOn")} /></Field>
          <Field label="Total usage limit"><Input type="number" {...register("usageLimit")} /></Field>
          <Field label="Uses per customer"><Input type="number" {...register("perUserLimit")} /></Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" {...register("firstOrderOnly")} /> First order only</label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" {...register("active")} /> Enabled</label>
          <div className="flex gap-2 sm:col-span-3"><button className={btn} disabled={isSubmitting}>Save</button><button type="button" className={btnGhost} onClick={() => setOpen(false)}>Cancel</button></div>
        </form>
      )}
      <div className="overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[720px]">
          <thead><tr><th className={th}>Code</th><th className={th}>Discount</th><th className={th}>Rules</th><th className={th}>Used</th><th className={th}>Status</th><th /></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className={`${td} font-mono`}>{c.code}</td>
                <td className={td}>{c.type === "percent" ? `${c.value}%` : formatINR(c.value)}{c.maxDiscount ? ` (max ${formatINR(c.maxDiscount)})` : ""}</td>
                <td className={`${td} text-xs text-muted`}>{[c.minOrder && `min ${formatINR(c.minOrder)}`, c.perUserLimit && `${c.perUserLimit}/customer`, c.firstOrderOnly && "first order only", c.expiresAt && `until ${c.expiresAt.toDate().toLocaleDateString("en-IN")}`].filter(Boolean).join(" · ") || "—"}</td>
                <td className={td}>{c.usedCount ?? 0}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                <td className={td}><Badge tone={c.active ? "good" : "neutral"}>{c.active ? "Enabled" : "Disabled"}</Badge></td>
                <td className={td}>
                  <button className="mr-3 underline" onClick={() => edit(c)}>Edit</button>
                  <button className="mr-3 underline" onClick={() => updateDoc(doc(getDb(), "coupons", c.id), { active: !c.active })}>{c.active ? "Disable" : "Enable"}</button>
                  <button className="text-red-700 underline" onClick={() => { if (confirm(`Delete coupon ${c.code}?`)) void deleteDoc(doc(getDb(), "coupons", c.id)); }}>Delete</button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className={td} colSpan={6}>{loading ? "Loading…" : "No coupons yet."}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
