export const THEMES = [
  { id: "green", label: "Kameleon Green", color: "#0f3d2e" },
  { id: "burgundy", label: "Burgundy", color: "#4d1821" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export const DEFAULT_THEME: ThemeId = "green";
export const THEME_KEY = "kameleon-theme";

/** Runs before first paint so the saved theme applies without a flash of the default colour. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t&&t!=="${DEFAULT_THEME}")document.documentElement.dataset.theme=t}catch(e){}`;
