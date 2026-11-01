import { FieldValue } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { callableOptions, db, razorpay, requireAdmin, requireAuth, toHttpsError } from "../config";
import { OrderError } from "../errors";
import { applyStockDeltas } from "../inventory/stock";
import type { FulfilmentStatus, OrderDoc } from "./types";

const adminOpts = { ...callableOptions };

function guard(req: { auth?: { uid: string; token: unknown } }) {
  requireAuth(req.auth?.uid);
  requireAdmin(req.auth?.token as Record<string, unknown>);
}

const NEXT: Record<FulfilmentStatus, FulfilmentStatus[]> = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const fulfilmentInput = z.object({
  orderId: z.string().min(1),
  status: z.enum(["confirmed", "packed", "shipped", "delivered"]),
  trackingId: z.string().max(80).optional(),
  carrier: z.string().max(60).optional(),
});

/** Moves an order forward through fulfilment. Cancelling goes through cancelOrder so stock is restored. */
export const updateFulfilment = onCall({ ...adminOpts, secrets: [] }, async (req) => {
  try {
    guard(req);
    const parsed = fulfilmentInput.safeParse(req.data);
    if (!parsed.success) throw new OrderError("invalid-argument", "Invalid update.");
    const { orderId, status, trackingId, carrier } = parsed.data;
    const ref = db.doc(`orders/${orderId}`);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new OrderError("not-found", "Order not found.");
      const o = snap.data() as OrderDoc;
      if (!NEXT[o.fulfilment.status].includes(status))
        throw new OrderError("failed-precondition", `Cannot move an order from ${o.fulfilment.status} to ${status}.`);
      if (!["paid", "cod_pending"].includes(o.payment.status))
        throw new OrderError("failed-precondition", "Only paid or Cash on Delivery orders can be fulfilled.");
      if (status === "shipped" && !trackingId)
        throw new OrderError("invalid-argument", "Add tracking details before marking as shipped.");

      const update: Record<string, unknown> = { "fulfilment.status": status };
      if (trackingId) update["fulfilment.trackingId"] = trackingId;
      if (carrier) update["fulfilment.carrier"] = carrier;
      // Cash on Delivery is collected at the door.
      if (status === "delivered" && o.payment.status === "cod_pending") update["payment.status"] = "paid";
      tx.update(ref, update);
    });
    return { ok: true };
  } catch (e) {
    throw toHttpsError(e);
  }
});

/** Cancels an order that has not shipped, returns its stock, and flags a refund when money was taken. */
export const cancelOrder = onCall({ ...adminOpts, secrets: [] }, async (req) => {
  try {
    guard(req);
    const orderId = z.object({ orderId: z.string().min(1) }).parse(req.data).orderId;
    const ref = db.doc(`orders/${orderId}`);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new OrderError("not-found", "Order not found.");
      const o = snap.data() as OrderDoc;
      if (!NEXT[o.fulfilment.status].includes("cancelled"))
        throw new OrderError("failed-precondition", "This order can no longer be cancelled.");

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
            productId: i.productId, sku: i.sku, delta: i.qty, reason: "order_cancelled",
            orderId, by: req.auth!.uid, at: FieldValue.serverTimestamp(),
          });
        }
      }
      tx.update(ref, {
        "fulfilment.status": "cancelled",
        stockReserved: false,
        reservationExpiresAt: null,
        refundDue: o.payment.status === "paid",
      });
    });
    return { ok: true };
  } catch (e) {
    throw toHttpsError(e);
  }
});

const refundInput = z.object({
  orderId: z.string().min(1),
  amount: z.number().int().positive().optional(), // rupees; omitted = remaining balance
});

/** Refunds through Razorpay. Locks the order during the call so a double click can't refund twice. */
export const refundOrder = onCall(adminOpts, async (req) => {
  try {
    guard(req);
    const parsed = refundInput.safeParse(req.data);
    if (!parsed.success) throw new OrderError("invalid-argument", "Invalid refund request.");
    const ref = db.doc(`orders/${parsed.data.orderId}`);

    const { paymentId, amount, alreadyRefunded, total } = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new OrderError("not-found", "Order not found.");
      const o = snap.data() as OrderDoc;
      const paidish = ["paid", "paid_needs_refund", "partially_refunded"].includes(o.payment.status);
      if (!paidish || !o.payment.razorpayPaymentId)
        throw new OrderError("failed-precondition", "Only online-paid orders can be refunded here.");
      if (o.payment.refundLock) throw new OrderError("failed-precondition", "A refund is already in progress.");
      const done = o.payment.refundedAmount ?? 0;
      const remaining = o.total - done;
      const amt = parsed.data.amount ?? remaining;
      if (amt > remaining) throw new OrderError("invalid-argument", `At most ₹${remaining} can still be refunded.`);
      tx.update(ref, { "payment.refundLock": true });
      return { paymentId: o.payment.razorpayPaymentId, amount: amt, alreadyRefunded: done, total: o.total };
    });

    try {
      await razorpay().payments.refund(paymentId, { amount: amount * 100, notes: { orderId: parsed.data.orderId } });
    } catch (e) {
      await ref.update({ "payment.refundLock": false });
      console.error(e);
      throw new OrderError("failed-precondition", "Razorpay could not process the refund. Please try again.");
    }

    const refunded = alreadyRefunded + amount;
    await ref.update({
      "payment.refundLock": false,
      "payment.refundedAmount": refunded,
      "payment.status": refunded >= total ? "refunded" : "partially_refunded",
      refundDue: false,
    });
    return { refunded };
  } catch (e) {
    throw toHttpsError(e);
  }
});
