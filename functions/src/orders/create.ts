import { createHash } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { OrderError } from "../errors";
import { applyStockDeltas } from "../inventory/stock";
import { callableOptions, db, razorpay, requireAuth, toHttpsError } from "../config";
import { getter, loadCoupon, loadProducts, variantLookup } from "./load";
import { priceOrder } from "./pricing";
import type { OrderDoc } from "./types";

const RESERVATION_MINUTES = 30;

const input = z.object({
  idempotencyKey: z.string().min(8).max(64),
  items: z.array(z.object({
    productId: z.string().min(1),
    sku: z.string().min(1),
    qty: z.number().int(),
  })).max(50),
  couponCode: z.string().max(40).optional(),
  payment: z.enum(["razorpay", "cod"]),
  contact: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    phone: z.string().regex(/^[6-9]\d{9}$/),
  }),
  address: z.object({
    line1: z.string().min(5).max(200),
    city: z.string().min(2).max(60),
    state: z.string().min(2).max(60),
    pincode: z.string().regex(/^\d{6}$/),
  }),
});

/** Same key from the same user always maps to the same order, so retries never double-charge. */
const orderIdFor = (uid: string, key: string) =>
  createHash("sha256").update(`${uid}:${key}`).digest("hex").slice(0, 20);

export const createOrder = onCall(callableOptions, async (req) => {
  try {
    const uid = requireAuth(req.auth?.uid);
    const parsed = input.safeParse(req.data);
    if (!parsed.success) throw new OrderError("invalid-argument", "Please check your details.");
    const data = parsed.data;
    if (data.payment === "cod") {
      const settings = await db.doc("storeSettings/main").get();
      if (settings.exists && settings.data()?.codEnabled === false)
        throw new OrderError("failed-precondition", "Cash on Delivery is not available right now.");
    }
    const orderId = orderIdFor(uid, data.idempotencyKey);
    const orderRef = db.doc(`orders/${orderId}`);
    const now = new Date();

    const existing = await orderRef.get();
    if (existing.exists) return summary(orderId, existing.data() as OrderDoc);

    // Pass 1 (read-only): price the cart so a Razorpay order can be created for the exact amount.
    const docs = await loadProducts(data.items, getter());
    const coupon = await loadCoupon(data.couponCode, uid, getter(), { phone: data.contact.phone });
    const quote = priceOrder(data.items, variantLookup(docs), coupon, now);

    let razorpayOrderId: string | null = null;
    if (data.payment === "razorpay") {
      const rz = await razorpay().orders.create({
        amount: quote.total * 100,
        currency: "INR",
        receipt: orderId,
        notes: { orderId, uid },
      });
      razorpayOrderId = rz.id;
    }

    // Pass 2 (transaction): re-read and re-price, then reserve stock and write the order atomically.
    const result = await db.runTransaction(async (tx) => {
      const again = await tx.get(orderRef);
      if (again.exists) return again.data() as OrderDoc;

      const get = getter(tx);
      const docsTx = await loadProducts(data.items, get);
      const couponTx = await loadCoupon(data.couponCode, uid, get, { tx, phone: data.contact.phone });
      const priced = priceOrder(data.items, variantLookup(docsTx), couponTx, now);
      if (priced.total !== quote.total) {
        throw new OrderError("failed-precondition", "Prices changed while you were checking out. Please review your bag.");
      }

      const byProduct = new Map<string, { sku: string; delta: number }[]>();
      for (const l of priced.lines) {
        byProduct.set(l.productId, [...(byProduct.get(l.productId) ?? []), { sku: l.sku, delta: -l.qty }]);
      }
      for (const [productId, deltas] of byProduct) {
        const p = docsTx.get(productId)!;
        tx.update(p.ref, { variants: applyStockDeltas(p.data.variants, deltas) });
      }
      for (const l of priced.lines) {
        tx.set(db.collection("inventoryLogs").doc(), {
          productId: l.productId, sku: l.sku, delta: -l.qty, reason: "order_reserved",
          orderId, at: FieldValue.serverTimestamp(),
        });
      }
      if (couponTx) {
        tx.update(couponTx.ref, { usedCount: FieldValue.increment(1) });
        tx.set(db.doc(`coupons/${couponTx.coupon.code}/redemptions/${uid}`), { count: FieldValue.increment(1) }, { merge: true });
      }

      const cod = data.payment === "cod";
      const order: OrderDoc = {
        uid,
        items: priced.lines,
        subtotal: priced.subtotal,
        discount: priced.discount,
        shipping: priced.shipping,
        total: priced.total,
        couponCode: couponTx?.coupon.code ?? null,
        contact: data.contact,
        address: data.address,
        payment: {
          method: data.payment,
          status: cod ? "cod_pending" : "pending",
          razorpayOrderId,
          razorpayPaymentId: null,
        },
        fulfilment: { status: cod ? "confirmed" : "placed", trackingId: null, carrier: null },
        stockReserved: true,
        reservationExpiresAt: cod ? null : Timestamp.fromMillis(now.getTime() + RESERVATION_MINUTES * 60_000),
        createdAt: Timestamp.fromDate(now),
      };
      tx.set(orderRef, order);
      return order;
    });

    return summary(orderId, result);
  } catch (e) {
    throw toHttpsError(e);
  }
});

function summary(orderId: string, o: OrderDoc) {
  return {
    orderId,
    total: o.total,
    paymentMethod: o.payment.method,
    razorpayOrderId: o.payment.razorpayOrderId,
  };
}
