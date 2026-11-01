import type { Timestamp } from "firebase-admin/firestore";
import type { PricedLine } from "./pricing";

export type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "cod_pending" | "paid_needs_refund" | "refunded" | "partially_refunded";
export type FulfilmentStatus = "placed" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled";

// Payment and fulfilment are tracked independently on purpose.
export interface OrderDoc {
  uid: string;
  items: PricedLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponCode: string | null;
  contact: { name: string; email: string; phone: string };
  address: { line1: string; city: string; state: string; pincode: string };
  payment: {
    method: "razorpay" | "cod";
    status: PaymentStatus;
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
    refundedAmount?: number;
    refundLock?: boolean;
  };
  refundDue?: boolean;
  fulfilment: { status: FulfilmentStatus; trackingId: string | null; carrier: string | null };
  stockReserved: boolean;
  reservationExpiresAt: Timestamp | null;
  createdAt: Timestamp;
}
