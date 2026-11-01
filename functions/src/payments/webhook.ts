import { onRequest } from "firebase-functions/v2/https";
import { db, RAZORPAY_WEBHOOK_SECRET, REGION } from "../config";
import { finalizePaidOrder, releaseOrder } from "../orders/finalize";
import type { OrderDoc } from "../orders/types";
import { verifyWebhookSignature } from "./signature";

interface PaymentEntity {
  id: string;
  order_id: string;
  amount: number;
}

/** Reconciles payment state from Razorpay, covering browsers that closed before verifyPayment ran. */
export const razorpayWebhook = onRequest(
  { region: REGION, secrets: [RAZORPAY_WEBHOOK_SECRET] },
  async (req, res) => {
    if (req.method !== "POST") return void res.status(405).send("Method not allowed");

    const signature = req.get("x-razorpay-signature") ?? "";
    if (!req.rawBody || !verifyWebhookSignature(req.rawBody, signature, RAZORPAY_WEBHOOK_SECRET.value()))
      return void res.status(401).send("Invalid signature");

    const event = req.body?.event as string | undefined;
    const payment = req.body?.payload?.payment?.entity as PaymentEntity | undefined;
    if (!payment?.order_id) return void res.status(200).send("ignored");

    const q = await db.collection("orders").where("payment.razorpayOrderId", "==", payment.order_id).limit(1).get();
    if (q.empty) return void res.status(200).send("unknown order");
    const doc = q.docs[0];
    const order = doc.data() as OrderDoc;

    try {
      if (event === "payment.captured" || event === "order.paid") {
        // Never mark paid unless the captured amount matches what the server priced.
        if (payment.amount !== order.total * 100) {
          console.error("Webhook amount mismatch", { orderId: doc.id, got: payment.amount, want: order.total * 100 });
          return void res.status(200).send("amount mismatch");
        }
        await finalizePaidOrder(doc.id, payment.id);
      } else if (event === "payment.failed") {
        // A customer may retry and succeed; only release if the order is still unpaid.
        await releaseOrder(doc.id, "failed");
      }
      res.status(200).send("ok");
    } catch (e) {
      console.error(e);
      res.status(500).send("error"); // Razorpay retries non-2xx responses
    }
  },
);
