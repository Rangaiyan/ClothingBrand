import { cacheLife, cacheTag } from "next/cache";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type { Banner, StoreSettings } from "@/types";
import { defaultSettings } from "./content-defaults";

export async function getSettings(): Promise<StoreSettings> {
  "use cache";
  cacheLife("minutes");
  cacheTag("content");
  if (!isFirebaseConfigured) return defaultSettings;
  const snap = await getDoc(doc(getDb(), "storeSettings", "main"));
  return { ...defaultSettings, ...(snap.exists() ? (snap.data() as Partial<StoreSettings>) : {}) };
}

export async function getBanners(): Promise<Banner[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("content");
  if (!isFirebaseConfigured) return [];
  const snap = await getDocs(query(collection(getDb(), "banners"), where("active", "==", true)));
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<Banner, "id">), id: d.id }))
    .sort((a, b) => a.order - b.order);
}
