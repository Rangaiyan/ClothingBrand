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
      <div className="flex flex-wrap gap-2">
        {images.map((src, i) => (
          <div key={src} className="relative size-20 border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="size-full object-cover" />
            <button type="button" aria-label="Remove image" className="absolute right-0 top-0 bg-white px-1 text-xs"
              onClick={() => onChange(images.filter((_, j) => j !== i))}>×</button>
            {multiple && i > 0 && (
              <button type="button" aria-label="Make first image" className="absolute bottom-0 left-0 bg-white px-1 text-[10px]"
                onClick={() => onChange([src, ...images.filter((_, j) => j !== i)])}>★</button>
            )}
          </div>
        ))}
      </div>
      <input type="file" accept="image/*" multiple={multiple} disabled={busy} className="mt-2 text-xs"
        onChange={(e) => { void pick(e.target.files); e.target.value = ""; }} />
      {busy && <p className="mt-1 text-xs text-muted">Uploading…</p>}
      <Notice>{error}</Notice>
    </div>
  );
}
