/**
 * First-visit welcome offer. These values are display-only: the WELCOME15 coupon document in Firestore
 * (see scripts/seed.mjs) is what the server enforces, so keep the two in step.
 */
export const WELCOME_OFFER = {
  code: "WELCOME15",
  percent: 15,
  minOrder: 999,
} as const;

export const WELCOME_SEEN_KEY = "kameleon-welcome-seen";

/** Pages where a popup would get in the way. */
export const WELCOME_EXCLUDED_PATHS = ["/checkout", "/cart", "/account", "/login", "/register"];

export type WelcomeEvent = "impressions" | "dismissals" | "copies" | "subscriptions";
