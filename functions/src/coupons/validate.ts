import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { callableOptions, requireAuth, toHttpsError } from "../config";
import { OrderError } from "../errors";
import { getter, loadCoupon, loadProducts, variantLookup } from "../orders/load";
import { priceOrder } from "../orders/pricing";

const input = z.object({
  couponCode: z.string().min(1).max(40),
  items: z.array(z.object({ productId: z.string(), sku: z.string(), qty: z.number().int() })).max(50),
});

/** Cart-page preview. Read-only; createOrder re-validates and records the redemption. */
export const previewCoupon = onCall({ ...callableOptions, secrets: [] }, async (req) => {
  try {
    const uid = requireAuth(req.auth?.uid);
    const parsed = input.safeParse(req.data);
    if (!parsed.success) throw new OrderError("invalid-argument", "Invalid request.");
    const { couponCode, items } = parsed.data;
    const docs = await loadProducts(items, getter());
    const coupon = await loadCoupon(couponCode, uid, getter());
    const q = priceOrder(items, variantLookup(docs), coupon, new Date());
    return { code: coupon!.coupon.code, discount: q.discount, shipping: q.shipping, total: q.total };
  } catch (e) {
    throw toHttpsError(e);
  }
});
