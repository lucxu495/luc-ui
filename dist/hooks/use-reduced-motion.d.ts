//#region src/hooks/use-reduced-motion.d.ts
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
export declare function useReducedMotion(): boolean;
export type MotionOverride = "reduced" | "full" | null;
export declare function useMotionOverride(): MotionOverride;
//#endregion
//# sourceMappingURL=use-reduced-motion.d.ts.map