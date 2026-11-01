"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authMessage, login, loginWithGoogle, register as registerUser, resetPassword } from "./actions";
import { loginSchema, registerSchema, type RegisterInput } from "@/validations/auth";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(isRegister ? registerSchema : (loginSchema as unknown as typeof registerSchema)),
  });

  const run = async (fn: () => Promise<unknown>) => {
    setError(""); setInfo("");
    try { await fn(); router.push("/account"); } catch (e) { setError(authMessage(e)); }
  };

  const input = "mt-1 w-full border border-line px-3 py-2 text-sm";
  const err = (k: keyof RegisterInput) => errors[k] && <span className="mt-1 block text-xs text-red-700" role="alert">{errors[k]?.message}</span>;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-4xl">{isRegister ? "Create account" : "Welcome back"}</h1>
      <form noValidate className="mt-8 space-y-4" onSubmit={handleSubmit((d) => run(() => (isRegister ? registerUser(d) : login(d))))}>
        {isRegister && (
          <label className="block text-xs text-muted">Name<input {...register("name")} autoComplete="name" className={input} />{err("name")}</label>
        )}
        <label className="block text-xs text-muted">Email<input type="email" {...register("email")} autoComplete="email" className={input} />{err("email")}</label>
        <label className="block text-xs text-muted">Password<input type="password" {...register("password")} autoComplete={isRegister ? "new-password" : "current-password"} className={input} />{err("password")}</label>
        {isRegister && (
          <label className="block text-xs text-muted">Confirm password<input type="password" {...register("confirm")} autoComplete="new-password" className={input} />{err("confirm")}</label>
        )}
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        {info && <p className="text-sm text-brand" role="status">{info}</p>}
        <button disabled={isSubmitting} className="w-full bg-brand py-3 text-xs font-medium uppercase tracking-widest text-white disabled:opacity-50">
          {isRegister ? "Register" : "Log in"}
        </button>
        <button type="button" onClick={() => run(loginWithGoogle)} className="w-full border border-foreground py-3 text-xs font-medium uppercase tracking-widest">
          Continue with Google
        </button>
        {!isRegister && (
          <button type="button" className="text-xs underline underline-offset-4"
            onClick={async () => {
              setError(""); setInfo("");
              const email = getValues("email");
              if (!email) return setError("Enter your email above first.");
              try { await resetPassword(email); setInfo("Password reset email sent."); } catch (e) { setError(authMessage(e)); }
            }}>
            Forgot password?
          </button>
        )}
      </form>
      <p className="mt-8 text-sm text-muted">
        {isRegister ? "Already have an account?" : "New to KAMELEON?"}{" "}
        <Link href={isRegister ? "/login" : "/register"} className="text-foreground underline underline-offset-4">
          {isRegister ? "Log in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
