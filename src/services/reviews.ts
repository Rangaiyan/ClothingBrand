import { cacheLife, cacheTag } from "next/cache";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "@/lib/firebase/client";
import type { Review } from "@/types";

type Stored = Omit<Review, "id" | "createdAt" | "published"> & { createdAt?: { toDate(): Date } };
type Doc = { id: string; data(): unknown };
const toReview = (d: Doc): Review => {
  const r = d.data() as Stored;
  return {
    id: d.id, productId: r.productId, authorName: r.authorName, rating: r.rating, title: r.title, body: r.body,
    published: true, createdAt: r.createdAt?.toDate().toISOString() ?? "",
  };
};

/** Latest published reviews across all products, for the homepage. */
export async function getLatestReviews(limit = 6): Promise<Review[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("reviews");
  if (!isFirebaseConfigured) return [];
  const snap = await getDocs(query(collection(getDb(), "reviews"), where("published", "==", true)));
  return snap.docs.map(toReview).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

/** Published reviews for a product, newest first. Cached about a minute like the catalogue. */
export async function getReviews(productId: string): Promise<Review[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("reviews");
  if (!isFirebaseConfigured) return [];
  // Two equality filters, so no composite index is needed; sort here.
  const snap = await getDocs(query(collection(getDb(), "reviews"), where("productId", "==", productId), where("published", "==", true)));
  return snap.docs.map(toReview).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
