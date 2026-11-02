import type { DocumentReference, DocumentSnapshot, Transaction } from "firebase-admin/firestore";
import type { Coupon } from "../coupons/calc";
import { OrderError } from "../errors";
import { db } from "../config";
import type { CatalogVariant, RequestedItem } from "./pricing";

interface ProductDoc {
  name: string;
  price: number;
  published: boolean;
  variants: { sku: string; size: string; colour: string; stock: number }[];
}

type Getter = (ref: DocumentReference) => Promise<DocumentSnapshot>;
export const getter = (tx?: Transaction): Getter => (ref) => (tx ? tx.get(ref) : ref.get());

/** Reads every product an order touches. Returns snapshots keyed by product id. */
export async function loadProducts(items: RequestedItem[], get: Getter) {
  const ids = [...new Set(items.map((i) => i.productId))];
  const snaps = await Promise.all(ids.map((id) => get(db.doc(`products/${id}`))));
  const docs = new Map<string, { ref: DocumentReference; data: ProductDoc }>();
  snaps.forEach((s, i) => {
    if (s.exists) docs.set(ids[i], { ref: s.ref, data: s.data() as ProductDoc });
  });
  return docs;
}

export function variantLookup(docs: Awaited<ReturnType<typeof loadProducts>>) {
  return (productId: string, sku: string): CatalogVariant | undefined => {
    const p = docs.get(productId);
    if (!p || !p.data.published) return undefined;
    const v = p.data.variants.find((x) => x.sku === sku);
    if (!v) return undefined;
    return { productId, sku, name: p.data.name, colour: v.colour, size: v.size, price: p.data.price, stock: v.stock };
  };
}

/** Orders that count as "having ordered before": anything not cancelled and whose payment did not fail or lapse. */
const isRealOrder = (o: FirebaseFirestore.DocumentData) =>
  o.fulfilment?.status !== "cancelled" && o.payment?.status !== "failed" && o.payment?.status !== "expired";

/**
 * Loads a coupon by code plus how many times this user has redeemed it.
 * For first-order-only coupons, rejects customers who already have an order, matched by account and,
 * when given, by phone number so a second account on the same number can't claim it again.
 */
export async function loadCoupon(
  code: string | undefined, uid: string, get: Getter,
  opts: { tx?: Transaction; phone?: string } = {},
) {
  if (!code) return undefined;
  const id = code.trim().toUpperCase();
  const [cSnap, rSnap] = await Promise.all([
    get(db.doc(`coupons/${id}`)),
    get(db.doc(`coupons/${id}/redemptions/${uid}`)),
  ]);
  if (!cSnap.exists) throw new OrderError("not-found", "That coupon code is not valid.");
  const d = cSnap.data()!;
  const coupon: Coupon = {
    code: id,
    type: d.type,
    value: d.value,
    minOrder: d.minOrder ?? undefined,
    maxDiscount: d.maxDiscount ?? undefined,
    usageLimit: d.usageLimit ?? undefined,
    usedCount: d.usedCount ?? 0,
    perUserLimit: d.perUserLimit ?? undefined,
    expiresAt: d.expiresAt ? d.expiresAt.toDate() : null,
    active: d.active === true,
  };
  if (d.firstOrderOnly === true) {
    const queries = [db.collection("orders").where("uid", "==", uid).limit(20)];
    if (opts.phone) queries.push(db.collection("orders").where("contact.phone", "==", opts.phone).limit(20));
    const snaps = await Promise.all(queries.map((q) => (opts.tx ? opts.tx.get(q) : q.get())));
    if (snaps.some((s) => s.docs.some((o) => isRealOrder(o.data()))))
      throw new OrderError("failed-precondition", "This offer is only valid on your first order.");
  }
  return { coupon, userUses: rSnap.exists ? (rSnap.data()!.count ?? 0) : 0, ref: cSnap.ref };
}
