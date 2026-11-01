"use client";

import { useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "@/lib/firebase/client";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return setState("error");
    if (!isFirebaseConfigured) return setState("done");
    setState("busy");
    try {
      // One document per address; resubscribing is denied by the rules, which we treat as success.
      await setDoc(doc(getDb(), "newsletterSubscribers", encodeURIComponent(clean)), { email: clean, createdAt: serverTimestamp() });
      setState("done");
    } catch (err) {
      setState((err as { code?: string }).code === "permission-denied" ? "done" : "error");
    }
  }

  return (
    <section className="mx-auto mt-24 max-w-xl px-4 text-center">
      <h2 className="text-3xl md:text-4xl">Stay in the loop</h2>
      <p className="mt-3 text-sm text-muted">New arrivals and festive collections, straight to your inbox.</p>
      {state === "done" ? (
        <p className="mt-6 text-sm text-brand" role="status">Thank you for subscribing.</p>
      ) : (
        <form onSubmit={submit} noValidate className="mt-6 flex gap-2">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" aria-label="Email address" autoComplete="email"
            className="w-full border border-line px-4 py-3 text-sm" />
          <button disabled={state === "busy"} className="bg-foreground px-6 text-xs uppercase tracking-widest text-white disabled:opacity-50">Subscribe</button>
        </form>
      )}
      {state === "error" && <p className="mt-3 text-sm text-red-700" role="alert">Please enter a valid email and try again.</p>}
    </section>
  );
}
