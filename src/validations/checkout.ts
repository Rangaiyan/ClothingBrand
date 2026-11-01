import { z } from "zod";

export const checkoutSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  address: z.string().min(5, "Enter your shipping address"),
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2, "Select your state"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a 6-digit pincode"),
  payment: z.enum(["razorpay", "cod"]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
