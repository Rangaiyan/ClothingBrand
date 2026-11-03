"use client";

import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, getDoc, orderBy, query, setDoc, updateDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { errMsg, useCollection } from "@/features/admin/hooks";
import { defaultSettings } from "@/services/content-defaults";
import type { Banner, StoreSettings } from "@/types";
import { ImageField } from "./ImageField";
import { Badge, btn, btnGhost, Field, Input, Notice, PageHeader } from "./ui";

const blankBanner = { heading: "", subheading: "", ctaLabel: "", ctaHref: "/shop", image: "", order: 1, active: true };

export function ContentAdmin() {
  const [s, setS] = useState<StoreSettings>(defaultSettings);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const banners = useCollection<Banner>(() => query(collection(getDb(), "banners"), orderBy("order")), "banners");
  const [bf, setBf] = useState<(typeof blankBanner & { id?: string }) | null>(null);
  const [bannerId, setBannerId] = useState("");

  useEffect(() => {
    getDoc(doc(getDb(), "storeSettings", "main")).then((d) => d.exists() && setS({ ...defaultSettings, ...(d.data() as Partial<StoreSettings>) }));
  }, []);

  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => setS((p) => ({ ...p, [k]: v }));

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    try { await setDoc(doc(getDb(), "storeSettings", "main"), s); setMsg({ kind: "ok", text: "Saved. The storefront updates within a minute." }); }
    catch (err) { setMsg({ kind: "error", text: errMsg(err) }); }
  }

  async function saveBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!bf || !bf.heading.trim()) return setMsg({ kind: "error", text: "A banner needs a heading." });
    try {
      const data = { heading: bf.heading, subheading: bf.subheading, ctaLabel: bf.ctaLabel, ctaHref: bf.ctaHref, image: bf.image, order: bf.order, active: bf.active };
      await setDoc(doc(getDb(), "banners", bannerId), { ...data, order: Number(data.order) });
      setBf(null);
    } catch (err) { setMsg({ kind: "error", text: errMsg(err) }); }
  }

  const box = "border border-line bg-white p-5";
  return (
    <>
      <PageHeader title="Store content" />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <form onSubmit={saveSettings} className={`${box} mb-8 grid max-w-3xl gap-4 sm:grid-cols-2`}>
        <h2 className="text-sm font-semibold sm:col-span-2">Announcement, contact and social links</h2>
        <div className="sm:col-span-2"><Field label="Announcement bar text (separate several messages with |; blank hides it)"><Input value={s.announcement} onChange={(e) => set("announcement", e.target.value)} /></Field></div>
        <Field label="Contact email"><Input type="email" value={s.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} /></Field>
        <Field label="Contact phone"><Input value={s.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} /></Field>
        <div className="sm:col-span-2"><Field label="Address"><Input value={s.address} onChange={(e) => set("address", e.target.value)} /></Field></div>
        <Field label="Instagram URL"><Input type="url" value={s.instagram} onChange={(e) => set("instagram", e.target.value)} /></Field>
        <Field label="YouTube URL"><Input type="url" value={s.youtube ?? ""} onChange={(e) => set("youtube", e.target.value)} /></Field>
        <Field label="Facebook URL"><Input type="url" value={s.facebook} onChange={(e) => set("facebook", e.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={s.codEnabled} onChange={(e) => set("codEnabled", e.target.checked)} /> Offer Cash on Delivery at checkout</label>
        <div className="sm:col-span-2"><button className={btn}>Save settings</button></div>
      </form>

      <PageHeader title="Homepage banners">
        <button className={btn} onClick={() => { setBannerId(doc(collection(getDb(), "banners")).id); setBf(blankBanner); }}>New banner</button>
      </PageHeader>
      <p className="mb-3 text-xs text-muted">The first active banner (lowest order) is shown as the homepage hero.</p>
      {bf && (
        <form onSubmit={saveBanner} className={`${box} mb-6 grid max-w-3xl gap-4 sm:grid-cols-2`}>
          <Field label="Heading"><Input value={bf.heading} onChange={(e) => setBf({ ...bf, heading: e.target.value })} /></Field>
          <Field label="Subheading"><Input value={bf.subheading} onChange={(e) => setBf({ ...bf, subheading: e.target.value })} /></Field>
          <Field label="Button label"><Input value={bf.ctaLabel} onChange={(e) => setBf({ ...bf, ctaLabel: e.target.value })} /></Field>
          <Field label="Button link"><Input value={bf.ctaHref} onChange={(e) => setBf({ ...bf, ctaHref: e.target.value })} /></Field>
          <Field label="Order"><Input type="number" value={bf.order} onChange={(e) => setBf({ ...bf, order: Number(e.target.value) })} /></Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={bf.active} onChange={(e) => setBf({ ...bf, active: e.target.checked })} /> Active</label>
          <div className="sm:col-span-2"><ImageField folder="banners" id={bannerId} images={bf.image ? [bf.image] : []} onChange={(u) => setBf({ ...bf, image: u[0] ?? "" })} /></div>
          <div className="flex gap-2 sm:col-span-2"><button className={btn}>Save banner</button><button type="button" className={btnGhost} onClick={() => setBf(null)}>Cancel</button></div>
        </form>
      )}
      <ul className="divide-y divide-line border border-line bg-white">
        {banners.rows.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-4 p-4 text-sm">
            <div><p className="font-medium">{b.heading}</p><p className="text-xs text-muted">Order {b.order} · {b.ctaHref}</p></div>
            <div className="flex items-center gap-3">
              <Badge tone={b.active ? "good" : "neutral"}>{b.active ? "Active" : "Hidden"}</Badge>
              <button className="underline" onClick={() => { setBannerId(b.id); setBf({ ...b }); }}>Edit</button>
              <button className="underline" onClick={() => updateDoc(doc(getDb(), "banners", b.id), { active: !b.active })}>{b.active ? "Hide" : "Show"}</button>
              <button className="text-red-700 underline" onClick={() => { if (confirm("Delete this banner?")) void deleteDoc(doc(getDb(), "banners", b.id)); }}>Delete</button>
            </div>
          </li>
        ))}
        {!banners.rows.length && <li className="p-4 text-sm text-muted">No banners yet. The default hero is shown.</li>}
      </ul>
    </>
  );
}
