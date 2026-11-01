import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions } from "@/lib/firebase/client";
import type { CartLine } from "@/store/cart";
import type { CheckoutInput } from "@/validations/checkout";

// The client sends only product ids, SKUs, quantities and the address. The
// createOrder Cloud Function re-prices everything and decides what is charged.

interface CreateOrderResult {
  orderId: string;
  total: number;
  paymentMethod: "razorpay" | "cod";
  razorpayOrderId: string | null;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open(): void; on(ev: string, cb: () => void): void };
  }
}

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load the payment window. Check your connection."));
    document.body.appendChild(s);
  });
}

export class PaymentCancelled extends Error {}

/** Returns the order id once the order is placed (COD) or paid (Razorpay). */
export async function submitCheckout(
  input: CheckoutInput,
  lines: Pick<CartLine, "productId" | "sku" | "qty">[],
  opts: { idempotencyKey: string; couponCode?: string },
): Promise<{ orderId: string }> {
  const fns = getFirebaseFunctions();
  const createOrder = httpsCallable<unknown, CreateOrderResult>(fns, "createOrder");

  const { data: order } = await createOrder({
    idempotencyKey: opts.idempotencyKey,
    items: lines.map(({ productId, sku, qty }) => ({ productId, sku, qty })),
    couponCode: opts.couponCode,
    payment: input.payment,
    contact: { name: input.name, email: input.email, phone: input.phone },
    address: { line1: input.address, city: input.city, state: input.state, pincode: input.pincode },
  });

  if (order.paymentMethod === "cod") return { orderId: order.orderId };

  await loadRazorpay();
  const verify = httpsCallable(fns, "verifyPayment");
  await new Promise<void>((resolve, reject) => {
    const rz = new window.Razorpay!({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      order_id: order.razorpayOrderId,
      name: "KAMELEON",
      description: "Tradition, Reimagined.",
      theme: { color: "#0F3D2E" },
      prefill: { name: input.name, email: input.email, contact: input.phone },
      handler: async (res: RazorpayResponse) => {
        try {
          await verify({
            orderId: order.orderId,
            razorpayOrderId: res.razorpay_order_id,
            razorpayPaymentId: res.razorpay_payment_id,
            razorpaySignature: res.razorpay_signature,
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      },
      modal: { ondismiss: () => reject(new PaymentCancelled("Payment was cancelled.")) },
    });
    rz.on("payment.failed", () => reject(new Error("Payment failed. You have not been charged; please try again.")));
    rz.open();
  });
  return { orderId: order.orderId };
}

export async function previewCoupon(
  couponCode: string,
  lines: Pick<CartLine, "productId" | "sku" | "qty">[],
) {
  const call = httpsCallable<unknown, { code: string; discount: number }>(getFirebaseFunctions(), "previewCoupon");
  const { data } = await call({ couponCode, items: lines.map(({ productId, sku, qty }) => ({ productId, sku, qty })) });
  return data;
}
