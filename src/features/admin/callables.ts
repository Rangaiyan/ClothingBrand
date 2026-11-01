import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions } from "@/lib/firebase/client";

// Orders and stock are changed only by Cloud Functions; the browser never writes them.
const call = <I, O = { ok: boolean }>(name: string) => (data: I) =>
  httpsCallable<I, O>(getFirebaseFunctions(), name)(data).then((r) => r.data);

export const updateFulfilment = call<{ orderId: string; status: string; trackingId?: string; carrier?: string }>("updateFulfilment");
export const cancelOrder = call<{ orderId: string }>("cancelOrder");
export const refundOrder = call<{ orderId: string; amount?: number }, { refunded: number }>("refundOrder");
export const adjustStock = call<{ productId: string; sku: string; newStock: number; note?: string }>("adjustStock");

export const setAdminRole = call<{ email: string; admin: boolean }>("setAdminRole");
export const listAdmins = call<void, { admins: { uid: string; email: string; name: string }[] }>("listAdmins");
