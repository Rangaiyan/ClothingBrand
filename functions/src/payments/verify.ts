import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { callableOptions, db, RAZORPAY_KEY_SECRET, requireAuth, toHttpsError } from "../config";
import { OrderError } from "../errors";
import { finalizePaidOrder } from "../orders/finalize";
import type { OrderDoc } from "../orders/types";
import { verifyCheckoutSignature } from "./signature";

const input = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

/** Called by the browser after Razorpay checkout. The signature, not the client, decides success. */
export const verifyPayment = onCall(callableOptions, async (req) => {
  try {
    const uid = requireAuth(req.auth?.uid);
    const parsed = input.safeParse(req.data);
    if (!parsed.success) throw new OrderError("invalid-argument", "Invalid payment details.");
    const d = parsed.data;

    const snap = await db.doc(`orders/${d.orderId}`).get();
    const order = snap.data() as OrderDoc | undefined;
    // Same message for missing and foreign orders so ids can't be probed.
    if (!order || order.uid !== uid || order.payment.razorpayOrderId !== d.razorpayOrderId)
      throw new OrderError("not-found", "Order not found.");

    if (!verifyCheckoutSignature(d.razorpayOrderId, d.razorpayPaymentId, d.razorpaySignature, RAZORPAY_KEY_SECRET.value()))
      throw new OrderError("failed-precondition", "Payment could not be verified.");

    const outcome = await finalizePaidOrder(d.orderId, d.razorpayPaymentId);
    return { status: outcome === "needs_refund" ? "refund_pending" : "paid" };
  } catch (e) {
    throw toHttpsError(e);
  }
});
