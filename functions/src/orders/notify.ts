import { getMessaging } from "firebase-admin/messaging";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { db, REGION } from "../config";
import type { OrderDoc } from "./types";

const COPY: Record<string, string> = {
  confirmed: "Your order is confirmed.",
  packed: "Your order has been packed.",
  shipped: "Your order is on its way.",
  delivered: "Your order was delivered.",
  cancelled: "Your order was cancelled.",
};

/** Push notification to the customer's registered devices when fulfilment status changes. */
export const onOrderStatusChange = onDocumentUpdated(
  { region: REGION, document: "orders/{orderId}" },
  async (event) => {
    const before = event.data?.before.data() as OrderDoc | undefined;
    const after = event.data?.after.data() as OrderDoc | undefined;
    if (!before || !after || before.fulfilment.status === after.fulfilment.status) return;
    const body = COPY[after.fulfilment.status];
    if (!body) return;

    const tokens = await db.collection(`users/${after.uid}/fcmTokens`).get();
    if (tokens.empty) return;
    await getMessaging().sendEachForMulticast({
      tokens: tokens.docs.map((t) => t.id),
      notification: { title: "KAMELEON", body },
      data: { orderId: event.params.orderId },
    });
  },
);
