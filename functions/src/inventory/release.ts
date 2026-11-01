import { Timestamp } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { db, REGION } from "../config";
import { releaseOrder } from "../orders/finalize";

/** Frees stock held by Razorpay orders that were never paid within the reservation window. */
export const releaseExpiredReservations = onSchedule(
  { region: REGION, schedule: "every 15 minutes" },
  async () => {
    const q = await db
      .collection("orders")
      .where("payment.status", "==", "pending")
      .where("reservationExpiresAt", "<=", Timestamp.now())
      .limit(200)
      .get();
    for (const d of q.docs) await releaseOrder(d.id, "expired");
  },
);
