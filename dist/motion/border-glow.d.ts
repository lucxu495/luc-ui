//#region src/motion/border-glow.d.ts
export type GlowIntensity = "subtle" | "normal" | "strong";
export interface BorderGlowProps extends React.ComponentPropsWithRef<"div"> {
  /** How loud the ring gets. `subtle` is the house default for dense UI. */
  intensity?: GlowIntensity;
  /**
   * `travel` sweeps a light around the perimeter (needs attention).
   * `follow` only reacts to the pointer (the calm choice for dashboards).
   */
  mode?: "travel" | "follow";
  /** Persistent accent ring, independent of hover. */
  selected?: boolean;
  /** Ring radius. Must match the wrapped surface. */
  radius?: "md" | "lg" | "xl" | "full";
  /** Seconds per perimeter sweep. Slower reads as more expensive. */
  speed?: number;
}
export declare function BorderGlow({ className, children, intensity, mode, selected, radius, speed, ...props }: BorderGlowProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=border-glow.d.ts.map