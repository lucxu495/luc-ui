"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useMediaQuery } from "@/components/luc-ui/hooks/use-media-query";

/**
 * LUC reduced-motion policy.
 *
 * Precedence:
 *   1. `data-motion="reduced"` on `<html>` — an explicit product/QA override.
 *   2. `data-motion="full"` on `<html>` — a deliberate opt-in for demos.
 *   3. `prefers-reduced-motion` from the OS.
 *
 * Components use this for *behaviour* (skip travel, jump the ticker) while CSS
 * handles the blanket transition clamp in `base.css`.
 */
export function useReducedMotion(): boolean {
  const override = useMotionOverride();
  const systemReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  if (override === "reduced") return true;
  if (override === "full") return false;
  return systemReduced;
}

export type MotionOverride = "reduced" | "full" | null;

export function useMotionOverride(): MotionOverride {
  const subscribe = useCallback((onChange: () => void) => {
    if (typeof document === "undefined") return () => {};
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion"],
    });
    return () => observer.disconnect();
  }, []);

  const getSnapshot = useCallback((): MotionOverride => {
    if (typeof document === "undefined") return null;
    const raw = document.documentElement.dataset.motion;
    return raw === "reduced" || raw === "full" ? raw : null;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
