//#region src/hooks/use-pointer-glow.d.ts
export interface UsePointerGlowOptions {
  /** Turn the tracker off for static surfaces (print, export, `none` intensity). */
  disabled?: boolean;
  /** Peak opacity written to `--luc-glow-opacity`. */
  opacity?: number;
}
export interface PointerGlowApi {
  ref: React.RefObject<HTMLElement | null>;
  handlers: {
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerEnter: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerLeave: () => void;
  };
  /** Whether the tracker is actually live (never true under reduced motion). */
  enabled: boolean;
}
/**
 * LUC `usePointerGlow` — the shared cursor tracker behind `luc-cursor-light`.
 *
 * A filled control should light where the finger is, not uniformly. This hook
 * converts the pointer position into two percentages plus an opacity, and
 * writes them onto the element as custom properties.
 *
 * It exists as a hook rather than a component so any surface can adopt the
 * behaviour without buying another wrapper `<div>`: the Button family, a Card,
 * a toolbar, a chart frame. It is rAF-throttled, it never re-renders, it
 * detaches its rAF on unmount, and it is inert on coarse pointers and under
 * reduced motion — where it still returns the same API, so a call site never
 * branches on the environment.
 */
export declare function usePointerGlow({ disabled, opacity }?: UsePointerGlowOptions): PointerGlowApi;
//#endregion
//# sourceMappingURL=use-pointer-glow.d.ts.map