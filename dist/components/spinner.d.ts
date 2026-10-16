//#region src/components/spinner.d.ts
export type SpinnerSize = 14 | 16 | 18 | 20 | 24;
export interface SpinnerProps extends Omit<React.ComponentPropsWithRef<"span">, "children"> {
  size?: SpinnerSize;
  /** Screen-reader text. Set to `null` when an ancestor already announces. */
  label?: string | null;
}
/**
 * LUC Spinner — a single confident arc, no gimmicks.
 *
 * Under `prefers-reduced-motion` the rotation is replaced by a slow pulse, so
 * the indicator keeps meaning without travelling. See docs/MOTION_GUIDE.md.
 */
export declare function Spinner({ size, label, className, ...props }: SpinnerProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=spinner.d.ts.map