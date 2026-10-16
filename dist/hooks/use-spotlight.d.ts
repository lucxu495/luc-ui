//#region src/hooks/use-spotlight.d.ts
export interface SpotlightState {
  /** Pointer position in element-local pixels. */
  x: number;
  y: number;
  /** Normalised 0..1 proximity weight — 0 when the pointer is outside. */
  active: number;
}
export interface UseSpotlightOptions {
  /** Ignore pointer tracking entirely (e.g. static surfaces). */
  disabled?: boolean;
  /** CSS custom property prefix. Defaults to `spotlight`. */
  prefix?: string;
  /** Called on every animation frame while the pointer is over the element. */
  onFrame?: (state: SpotlightState) => void;
}
/**
 * Shared pointer-proximity tracker for gentle surface lighting.
 *
 * Design constraints (see DESIGN_SYSTEM.md):
 *  - rAF-throttled: at most one style write per frame.
 *  - Never active on coarse pointers or under prefers-reduced-motion.
 *  - Writes CSS custom properties, so no React re-render per mouse move.
 */
export declare function useSpotlight<T extends HTMLElement>({ disabled, prefix, onFrame }?: UseSpotlightOptions): {
  ref: import("react").RefObject<T | null>;
  isActive: boolean;
  enabled: boolean;
  handlers: {
    onPointerMove: (event: React.PointerEvent<T>) => void;
    onPointerEnter: () => void;
    onPointerLeave: () => void;
  };
};
//#endregion
//# sourceMappingURL=use-spotlight.d.ts.map