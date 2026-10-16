"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * SSR-safe media query subscription. Returns `false` on the server so markup
 * stays deterministic during hydration.
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return defaultValue;
    return window.matchMedia(query).matches;
  }, [defaultValue, query]);

  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  // `useSyncExternalStore` is the supported way to read a browser API: React
  // renders the server snapshot during hydration, then reconciles — no
  // setState-in-effect, no hydration mismatch.
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** True for coarse pointers — used to calm down pointer-driven effects. */
export function useCoarsePointer(): boolean {
  return useMediaQuery("(pointer: coarse)");
}
