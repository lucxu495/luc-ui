//#region src/components/skeleton.d.ts
export interface SkeletonProps extends React.ComponentPropsWithRef<"div"> {
  /** `text` is a single line, `block` a surface, `circle` an avatar. */
  variant?: "text" | "block" | "circle";
  /** Sweep a highlight across the placeholder. Default `true`. */
  shimmer?: boolean;
}
/**
 * LUC Skeleton — the default loading treatment for content and data.
 *
 * A skeleton communicates *shape*; a spinner only communicates *waiting*.
 * Prefer skeletons for pages and panels, spinners for small actions.
 */
export declare function Skeleton({ className, variant, shimmer, ...props }: SkeletonProps): import("react").JSX.Element;
export interface SkeletonTextProps extends Omit<SkeletonProps, "variant"> {
  lines?: number;
  /** Vary line widths so the block reads as prose, not a table. */
  widths?: string[];
}
export declare function SkeletonText({ lines, widths, className, ...props }: SkeletonTextProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=skeleton.d.ts.map