import { OrderError } from "../errors";

export interface Coupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  expiresAt?: Date | null;
  active: boolean;
}

/** Whole-rupee discount for a subtotal. Throws OrderError when the coupon cannot apply. */
export function couponDiscount(coupon: Coupon, subtotal: number, userUses: number, now: Date): number {
  if (!coupon.active) throw new OrderError("failed-precondition", "This coupon is not active.");
  if (coupon.expiresAt && coupon.expiresAt.getTime() <= now.getTime())
    throw new OrderError("failed-precondition", "This coupon has expired.");
  if (coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit)
    throw new OrderError("failed-precondition", "This coupon has reached its usage limit.");
  if (coupon.perUserLimit !== undefined && userUses >= coupon.perUserLimit)
    throw new OrderError("failed-precondition", "You have already used this coupon.");
  if (coupon.minOrder !== undefined && subtotal < coupon.minOrder)
    throw new OrderError("failed-precondition", `Minimum order for this coupon is ₹${coupon.minOrder}.`);

  let discount = coupon.type === "percent" ? Math.floor((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount !== undefined) discount = Math.min(discount, coupon.maxDiscount);
  return Math.max(0, Math.min(discount, subtotal));
}
