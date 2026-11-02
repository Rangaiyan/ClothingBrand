"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { doc, increment, serverTimestamp, setDoc } from "firebase/firestore";
import { X } from "lucide-react";
import { getDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { formatINR } from "@/lib/utils/format";
import { WELCOME_EXCLUDED_PATHS, WELCOME_OFFER, WELCOME_SEEN_KEY, type WelcomeEvent } from "@/lib/welcome-offer";

const DELAY_MS = 2500;

/** Fire-and-forget funnel counter. Never blocks or breaks the popup. */
function track(event: WelcomeEvent) {
  if (!isFirebaseConfigured) return;
  setDoc(doc(getDb(), "popupStats", "welcome"), { [event]: increment(1) }, { merge: true }).catch(() => {});
}

const seen = () => {
  try { return !!localStorage.getItem(WELCOME_SEEN_KEY); } catch { return true; }
};

/** First-visit welcome offer. Shown once per browser, a couple of seconds after load, never on checkout-type pages. */
export function WelcomePopup() {
  const pathname = usePathname();
  const router = useRouter();
  const blocked = WELCOME_EXCLUDED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [sub, setSub] = useState<"idle" | "busy" | "done" | "error">("idle");
  const dialog = useRef<HTMLDialogElement>(null);
  const finished = useRef(false);
  const counted = useRef(false);

  useEffect(() => {
    if (blocked || seen()) return;
    const t = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(t);
  }, [blocked, pathname]);

  // Never leave it open over a checkout-type page.
  useEffect(() => { if (blocked) setOpen(false); }, [blocked]);

  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    if (!counted.current) { counted.current = true; track("impressions"); }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  function finish(dismissed: boolean) {
    if (finished.current) return;
    finished.current = true;
    try { localStorage.setItem(WELCOME_SEEN_KEY, "1"); } catch {}
    if (dismissed) track("dismissals");
    dialog.current?.close();
    setOpen(false);
  }

  async function copyAndShop() {
    track("copies");
    try { await navigator.clipboard.writeText(WELCOME_OFFER.code); } catch {}
    setCopied(true);
    setTimeout(() => { finish(false); router.push("/shop"); }, 900);
  }

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return setSub("error");
    setSub("busy");
    try {
      if (isFirebaseConfigured) {
        await setDoc(doc(getDb(), "newsletterSubscribers", encodeURIComponent(clean)), { email: clean, createdAt: serverTimestamp(), source: "welcome-popup" });
      }
      track("subscriptions");
      setSub("done");
    } catch (err) {
      // Already subscribed is denied by the rules; the visitor still gets their code.
      if ((err as { code?: string }).code === "permission-denied") setSub("done");
      else setSub("error");
    }
  }

  if (!open) return null;
  return (
    <dialog
      ref={dialog}
      aria-labelledby="welcome-title"
      onCancel={(e) => { e.preventDefault(); finish(true); }}
      onClick={(e) => { if (e.target === dialog.current) finish(true); }}
      className="welcome-dialog fixed inset-auto left-1/2 top-1/2 m-0 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto bg-white p-0 text-foreground backdrop:bg-black/55 md:max-h-[90dvh] md:w-[min(52rem,calc(100vw-3rem))] md:max-w-none"
    >
      <button type="button" onClick={() => finish(true)} aria-label="Close" className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-white/90 hover:bg-white">
        <X size={18} />
      </button>

      <div className="grid md:grid-cols-[0.85fr_1fr]">
        <div className="relative hidden bg-neutral-100 md:block md:min-h-[34rem]">
          <Image src="/banners/vesti-collection.jpg" alt="" fill sizes="(min-width: 768px) 24rem, 100vw" priority className="object-cover" />
        </div>

        <div className="px-5 pb-5 pt-6 md:px-10 md:py-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand">Welcome to the world of Kameleon</p>
          <p className="mt-1.5 font-serif text-base italic text-muted md:mt-2 md:text-lg">Style that evolves. Comfort that stays.</p>

          <p className="mt-4 font-serif text-5xl font-medium leading-none text-brand md:mt-6 md:text-7xl">{WELCOME_OFFER.percent}% off</p>
          <h2 id="welcome-title" className="mt-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] md:mt-4 md:text-sm">Get {WELCOME_OFFER.percent}% off your first order</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted md:mt-3 md:text-sm">
            Your first KAMELEON experience just got better. Enjoy an exclusive {WELCOME_OFFER.percent}% discount on your first purchase.
          </p>

          <div className="mt-3 flex items-center justify-between border border-dashed border-brand px-3 py-2.5 md:mt-5 md:px-4 md:py-3">
            <span className="font-mono text-base tracking-[0.15em] md:text-lg md:tracking-[0.2em]">{WELCOME_OFFER.code}</span>
            <span className="text-xs text-muted">On orders above {formatINR(WELCOME_OFFER.minOrder)}</span>
          </div>

          <button type="button" onClick={copyAndShop} className="mt-3 w-full bg-brand px-6 py-3.5 text-xs md:mt-4 md:py-4 font-semibold uppercase tracking-[0.2em] text-white hover:opacity-90">
            {copied ? "Code copied" : "Copy code & start shopping"}
          </button>
          <p className="sr-only" role="status">{copied ? "Coupon code copied to clipboard" : ""}</p>

          <div className="mt-4 border-t border-line pt-3 md:mt-6 md:pt-5">
            {sub === "done" ? (
              <p className="text-sm text-brand" role="status">
                Thank you for joining the community. Your code <strong>{WELCOME_OFFER.code}</strong> is ready to use at checkout.
              </p>
            ) : (
              <form onSubmit={subscribe} noValidate>
                <label htmlFor="welcome-email" className="text-xs text-muted md:text-sm">Join the KAMELEON community and unlock your welcome offer.</label>
                <div className="mt-2 flex gap-2 md:mt-3">
                  <input id="welcome-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email (optional)" autoComplete="email"
                    className="w-full min-w-0 border border-line px-3 py-2.5 text-sm md:px-4 md:py-3" />
                  <button disabled={sub === "busy"} className="bg-foreground px-5 text-xs uppercase tracking-widest text-white disabled:opacity-50">Subscribe</button>
                </div>
                {sub === "error" && <p className="mt-2 text-sm text-red-700" role="alert">Please enter a valid email and try again.</p>}
              </form>
            )}
          </div>

          <button type="button" onClick={() => finish(true)} className="mt-3 text-xs text-muted underline md:mt-5 underline-offset-4 hover:text-foreground">
            No thanks, continue shopping
          </button>
          <p className="mt-4 hidden text-[11px] text-muted md:block">Valid on your first order only. One use per customer.</p>
        </div>
      </div>
    </dialog>
  );
}
