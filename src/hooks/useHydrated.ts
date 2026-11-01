import { useSyncExternalStore } from "react";

const noop = () => () => {};

// False on the server and first client render, true afterwards. Use it to gate
// values read from localStorage-backed stores so markup matches during hydration.
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}
