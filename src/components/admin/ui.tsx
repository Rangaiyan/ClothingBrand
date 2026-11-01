import { forwardRef } from "react";

export const input = "w-full border border-line bg-white px-3 py-2 text-sm";
export const btn = "bg-foreground px-4 py-2 text-xs font-medium uppercase tracking-widest text-white disabled:opacity-50";
export const btnGhost = "border border-foreground px-4 py-2 text-xs font-medium uppercase tracking-widest disabled:opacity-50";

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-serif text-3xl">{title}</h1>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-muted">
      {label}
      <div className="mt-1 text-foreground">{children}</div>
      {error && <span className="mt-1 block text-red-700" role="alert">{error}</span>}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(props, ref) {
  return <input ref={ref} {...props} className={`${input} ${props.className ?? ""}`} />;
});

export function Notice({ kind = "error", children }: { kind?: "error" | "ok"; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`text-sm ${kind === "error" ? "text-red-700" : "text-brand"}`}>
      {children}
    </p>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn" | "bad"; children: React.ReactNode }) {
  const tones = { neutral: "bg-neutral-100", good: "bg-emerald-50 text-brand", warn: "bg-amber-50 text-amber-800", bad: "bg-red-50 text-red-800" };
  return <span className={`inline-block px-2 py-0.5 text-[11px] ${tones[tone]}`}>{children}</span>;
}

export const th = "px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted";
export const td = "px-3 py-3 text-sm";
