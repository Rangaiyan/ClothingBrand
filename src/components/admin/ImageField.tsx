"use client";

import { useState } from "react";
import { uploadImage } from "@/features/admin/upload";
import { errMsg } from "@/features/admin/hooks";
import { Notice } from "./ui";

export function ImageField({
  folder, id, images, onChange, multiple = false,
}: {
  folder: "products" | "categories" | "banners";
  id: string;
  images: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setError("");
    try {
      const urls = await Promise.all([...files].map((f) => uploadImage(folder, id, f)));
      onChange(multiple ? [...images, ...urls] : urls.slice(0, 1));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className={multiple ? "grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6" : "flex flex-wrap gap-2"}>
        {images.map((src, i) => (
          <div key={src} className={`group relative aspect-square overflow-hidden border border-line bg-neutral-100 ${multiple ? "" : "w-24"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="size-full object-cover" />
            {multiple && i === 0 && (
              <span className="absolute left-1 top-1 bg-foreground px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider !text-white">Main</span>
            )}
            <button type="button" aria-label="Remove image" title="Remove"
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-white text-sm font-semibold shadow"
              onClick={() => onChange(images.filter((_, j) => j !== i))}>×</button>
            {multiple && i > 0 && (
              <button type="button" aria-label="Make main image"
                className="absolute inset-x-1 bottom-1 bg-white py-0.5 text-[10px] font-semibold shadow"
                onClick={() => onChange([src, ...images.filter((_, j) => j !== i)])}>Set as main</button>
            )}
          </div>
        ))}
        <label className={`flex cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed border-neutral-300 bg-white text-center text-xs font-semibold text-neutral-600 hover:border-foreground aspect-square ${multiple ? "" : "w-24"} ${busy ? "pointer-events-none opacity-60" : ""}`}>
          <span className="text-xl leading-none">{busy ? "…" : "+"}</span>
          {busy ? "Uploading…" : multiple ? "Add images" : "Add image"}
          <input type="file" accept="image/*" multiple={multiple} disabled={busy} className="sr-only"
            onChange={(e) => { void pick(e.target.files); e.target.value = ""; }} />
        </label>
      </div>
      <Notice>{error}</Notice>
    </div>
  );
}
