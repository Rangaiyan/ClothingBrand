import { z } from "zod";

const optionalNum = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().min(0).optional());

export const couponSchema = z
  .object({
    code: z.string().min(3, "At least 3 characters").max(24).regex(/^[A-Za-z0-9]+$/, "Letters and numbers only"),
    type: z.enum(["percent", "fixed"]),
    value: z.coerce.number({ error: "Enter a value" }).positive("Must be above 0"),
    minOrder: optionalNum,
    maxDiscount: optionalNum,
    usageLimit: optionalNum,
    perUserLimit: optionalNum,
    expiresOn: z.string().optional(),
    active: z.boolean(),
  })
  .refine((c) => c.type !== "percent" || c.value <= 100, { path: ["value"], message: "A percentage can't exceed 100" });

export type CouponForm = z.input<typeof couponSchema>;
export type CouponValues = z.output<typeof couponSchema>;
