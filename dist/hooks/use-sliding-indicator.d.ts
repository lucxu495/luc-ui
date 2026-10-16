//#region src/hooks/use-sliding-indicator.d.ts
export interface IndicatorRect {
  left: number;
  width: number;
}
/**
 * Measures the active item inside a container so a single absolutely
 * positioned element can slide between them.
 *
 * Why measure instead of `layoutId`: the indicator also has to survive font
 * loading, container resizes, and label changes — and it needs to animate
 * *width* as well as position. One rAF-free measurement per change is cheaper
 * and far more predictable.
 *
 * Returns `rect: null` until the first measurement so callers can keep the
 * indicator invisible instead of flashing at position 0.
 */
export declare function useSlidingIndicator<T extends HTMLElement = HTMLDivElement>(activeValue: string | undefined): {
  containerRef: import("react").RefObject<T | null>;
  registerItem: (value: string) => (node: HTMLElement | null) => void;
  rect: IndicatorRect | null;
  measure: () => void;
};
//#endregion
//# sourceMappingURL=use-sliding-indicator.d.ts.map