"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCart } from "@/store/cart";
import { useHydrated } from "@/hooks/useHydrated";
import { checkoutSchema, type CheckoutInput } from "@/validations/checkout";
import { PaymentCancelled, submitCheckout } from "@/services/checkout";
import { useAuth } from "@/features/auth/AuthProvider";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { OrderSummary } from "@/components/cart/OrderSummary";

const STATES = ["Andhra Pradesh", "Karnataka", "Kerala", "Maharashtra", "Tamil Nadu", "Telangana", "Delhi", "Gujarat", "West Bengal", "Other"];

const input = "mt-1 w-full border border-line px-3 py-2 text-sm";

function Field({ id, label, reg, error, ...rest }: {
  id: keyof CheckoutInput; label: string; reg: UseFormRegister<CheckoutInput>; error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-xs text-muted">
      {label}
      <input {...reg(id)} {...rest} aria-invalid={!!error} className={input} />
      {error && <span className="mt-1 block text-red-700" role="alert">{error}</span>}
    </label>
  );
}

export function CheckoutForm({ codEnabled = true }: { codEnabled?: boolean }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { lines, coupon, clear } = useCart();
  const [error, setError] = useState("");
  // One key per checkout attempt: a network retry reuses it (no duplicate order);
  // it is replaced whenever the server rejects the order so edits create a fresh one.
  const [idemKey, setIdemKey] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { payment: "razorpay" },
  });

  if (!hydrated || loading) return <div className="min-h-[40vh]" aria-busy="true" />;
  if (isFirebaseConfigured && !user) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">Please log in to place your order.</p>
        <Link href="/login" className="mt-6 inline-block bg-brand px-8 py-3 text-xs uppercase tracking-widest text-white">Log in</Link>
      </div>
    );
  }
  if (!lines.length) {
    return <p className="py-16 text-center text-muted">Your bag is empty. <Link href="/shop" className="underline">Shop now</Link></p>;
  }


  return (
    <form
      noValidate
      onSubmit={handleSubmit(async (data) => {
        setError("");
        try {
          if (!isFirebaseConfigured) throw new Error("Checkout is not live yet. Payments are connected once Firebase and Razorpay are configured.");
          const key = idemKey ?? crypto.randomUUID();
          setIdemKey(key);
          const { orderId } = await submitCheckout(data, lines, { idempotencyKey: key, couponCode: coupon?.code });
          clear();
          router.push(`/checkout/success?order=${encodeURIComponent(orderId)}`);
        } catch (e) {
          const code = (e as { code?: string }).code ?? "";
          if (/failed-precondition|not-found|invalid-argument/.test(code)) setIdemKey(null);
          setError(e instanceof PaymentCancelled ? e.message : e instanceof Error ? e.message : "Could not place the order.");
        }
      })}
      className="grid gap-12 lg:grid-cols-[1fr_380px]"
    >
      <div className="space-y-5">
        <h2 className="text-2xl">Shipping details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field reg={register} error={errors.name?.message} id="name" label="Full name" autoComplete="name" />
          <Field reg={register} error={errors.phone?.message} id="phone" label="Mobile number" inputMode="numeric" autoComplete="tel-national" maxLength={10} />
        </div>
        <Field reg={register} error={errors.email?.message} id="email" label="Email" type="email" autoComplete="email" />
        <Field reg={register} error={errors.address?.message} id="address" label="Address" autoComplete="street-address" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field reg={register} error={errors.city?.message} id="city" label="City" autoComplete="address-level2" />
          <label className="block text-xs text-muted">
            State
            <select {...register("state")} aria-invalid={!!errors.state} className={input} defaultValue="">
              <option value="" disabled>Select</option>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
            {errors.state && <span className="mt-1 block text-red-700" role="alert">{errors.state.message}</span>}
          </label>
          <Field reg={register} error={errors.pincode?.message} id="pincode" label="Pincode" inputMode="numeric" maxLength={6} autoComplete="postal-code" />
        </div>

        <fieldset className="pt-4">
          <legend className="mb-3 text-2xl font-serif">Payment</legend>
          <label className="flex items-center gap-3 border border-line p-4 text-sm">
            <input type="radio" value="razorpay" {...register("payment")} /> UPI, cards &amp; net banking (Razorpay)
          </label>
          {codEnabled && (
            <label className="mt-2 flex items-center gap-3 border border-line p-4 text-sm">
              <input type="radio" value="cod" {...register("payment")} /> Cash on Delivery
            </label>
          )}
        </fieldset>
      </div>

      <aside className="h-fit border border-line p-6">
        <OrderSummary lines={lines} />
        {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
        <button disabled={isSubmitting} className="mt-6 w-full bg-brand py-3 text-xs font-medium uppercase tracking-widest text-white disabled:opacity-50">
          {isSubmitting ? "Processing…" : "Place order"}
        </button>
      </aside>
    </form>
  );
}
