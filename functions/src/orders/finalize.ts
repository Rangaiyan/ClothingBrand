import { FieldValue } from "firebase-admin/firestore";
import { db } from "../config";
import { applyStockDeltas } from "../inventory/stock";
import type { Transaction } from "firebase-admin/firestore";
import type { OrderDoc } from "./types";

/** Gives a coupon redemption back (or takes it again) so unpaid orders never burn a customer's coupon. */
function adjustCoupon(tx: Transaction, code: string, uid: string, by: 1 | -1) {
  tx.set(db.doc(`coupons/${code}`), { usedCount: FieldValue.increment(by) }, { merge: true });
  tx.set(db.doc(`coupons/${code}/redemptions/${uid}`), { count: FieldValue.increment(by) }, { merge: true });
}

type Outcome = "paid" | "already_paid" | "needs_refund" | "not_found";

/**
 * Marks an order paid. Safe to call any number of times and from both the
 * checkout verification and the webhook: only the first call changes anything.
 * If the stock reservation had already lapsed, it tries to re-reserve; when
 * that fails the order is flagged for a refund instead of being fulfilled.
 */
export async function finalizePaidOrder(orderId: string, paymentId: string): Promise<Outcome> {
  const ref = db.doc(`orders/${orderId}`);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return "not_found";
    const o = snap.data() as OrderDoc;
    if (o.payment.status === "paid") return "already_paid";
    if (o.payment.status === "paid_needs_refund") return "needs_refund";

    if (!o.stockReserved) {
      const ids = [...new Set(o.items.map((i) => i.productId))];
      const products = await Promise.all(ids.map((id) => tx.get(db.doc(`products/${id}`))));
      try {
        products.forEach((p, idx) => {
          const deltas = o.items.filter((i) => i.productId === ids[idx]).map((i) => ({ sku: i.sku, delta: -i.qty }));
          tx.update(p.ref, { variants: applyStockDeltas((p.data()?.variants ?? []) as { sku: string; stock: number }[], deltas) });
        });
      } catch {
        tx.update(ref, {
          "payment.status": "paid_needs_refund",
          "payment.razorpayPaymentId": paymentId,
          "fulfilment.status": "cancelled",
        });
        return "needs_refund";
      }
      for (const i of o.items) {
        tx.set(db.collection("inventoryLogs").doc(), {
          productId: i.productId, sku: i.sku, delta: -i.qty, reason: "order_re_reserved",
          orderId, at: FieldValue.serverTimestamp(),
        });
      }
      if (o.couponCode) adjustCoupon(tx, o.couponCode, o.uid, 1);
    }

    tx.update(ref, {
      "payment.status": "paid",
      "payment.razorpayPaymentId": paymentId,
      "fulfilment.status": "confirmed",
      stockReserved: true,
      reservationExpiresAt: null,
    });
    return "paid";
  });
}

/** Returns reserved stock for an unpaid order and marks the payment failed/expired. Idempotent. */
export async function releaseOrder(orderId: string, status: "failed" | "expired") {
  const ref = db.doc(`orders/${orderId}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const o = snap.data() as OrderDoc;
    if (o.payment.status !== "pending") return; // paid, already released, or COD: nothing to do

    if (o.stockReserved) {
      const ids = [...new Set(o.items.map((i) => i.productId))];
      const products = await Promise.all(ids.map((id) => tx.get(db.doc(`products/${id}`))));
      products.forEach((p, idx) => {
        if (!p.exists) return;
        const deltas = o.items.filter((i) => i.productId === ids[idx]).map((i) => ({ sku: i.sku, delta: i.qty }));
        tx.update(p.ref, { variants: applyStockDeltas(p.data()!.variants, deltas) });
      });
      for (const i of o.items) {
        tx.set(db.collection("inventoryLogs").doc(), {
          productId: i.productId, sku: i.sku, delta: i.qty, reason: `order_${status}`,
          orderId, at: FieldValue.serverTimestamp(),
        });
      }
    }
    if (o.stockReserved && o.couponCode) adjustCoupon(tx, o.couponCode, o.uid, -1);
    tx.update(ref, {
      "payment.status": status,
      "fulfilment.status": "cancelled",
      stockReserved: false,
      reservationExpiresAt: null,
    });
  });
}
