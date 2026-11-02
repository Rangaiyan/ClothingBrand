"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_THEME, THEMES, THEME_KEY, type ThemeId } from "@/lib/theme";

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
};
const current = () => (document.documentElement.dataset.theme as ThemeId | undefined) ?? DEFAULT_THEME;

function choose(id: ThemeId) {
  if (id === DEFAULT_THEME) delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = id;
  try { localStorage.setItem(THEME_KEY, id); } catch {}
  listeners.forEach((l) => l());
}

export function ThemeSwitcher() {
  const active = useSyncExternalStore(subscribe, current, () => DEFAULT_THEME);
  return (
    <div className="flex items-center gap-3 text-xs text-muted" role="radiogroup" aria-label="Site colour">
      <span className="uppercase tracking-widest">Theme</span>
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={active === t.id}
          aria-label={t.label}
          title={t.label}
          onClick={() => choose(t.id)}
          style={{ backgroundColor: t.color }}
          className={`size-6 rounded-full border border-line outline-offset-2 ${active === t.id ? "outline outline-2 outline-foreground" : ""}`}
        />
      ))}
    </div>
  );
}
