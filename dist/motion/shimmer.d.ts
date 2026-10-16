//#region src/motion/shimmer.d.ts
export interface ShimmerProps extends React.ComponentPropsWithRef<"span"> {
  /** Pause the sweep without unmounting the layer. */
  active?: boolean;
  /** Seconds per sweep. */
  speed?: number;
}
export declare function Shimmer({ className, active, speed, ...props }: ShimmerProps): import("react").JSX.Element;
export interface ShimmerTextProps extends React.ComponentPropsWithRef<"span"> {
  /** Sweep the highlight, or hold a steady gradient. */
  animate?: boolean;
  speed?: number;
}
export declare function ShimmerText({ className, children, animate, speed, ...props }: ShimmerTextProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=shimmer.d.ts.map