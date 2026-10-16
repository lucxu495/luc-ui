//#region src/motion/spotlight-surface.d.ts
export interface SpotlightSurfaceProps extends React.ComponentPropsWithRef<"div"> {
  /** Spotlight diameter in px. Larger = softer, calmer. */
  size?: number;
  tone?: "accent" | "neutral";
  radius?: "md" | "lg" | "xl";
  /** Surface treatment underneath the light. */
  surface?: "default" | "raised" | "sunken";
  /** Light the border near the pointer as well as the interior. */
  border?: boolean;
  /** Reveal a faint technical texture near the pointer. */
  texture?: boolean;
  /** Disable pointer tracking for static or print contexts. */
  static?: boolean;
}
/**
 * LUC SpotlightSurface.
 *
 * A surface that quietly acknowledges the pointer. The light layer sits above
 * the surface colour but *below* the content, at single-digit alpha, so text and
 * charts keep full contrast. `border` and `texture` add the two other readouts
 * of the same pointer position — a lit edge and a faint technical grid — and all
 * three are driven by the *same* two custom properties from one rAF-throttled
 * tracker, so the cost is flat regardless of how many layers react.
 *
 * Disabled on touch devices and under `prefers-reduced-motion`, where the same
 * calm surface renders with no listeners at all.
 */
export declare function SpotlightSurface({ className, children, size, tone, radius, surface, border, texture, static: isStatic, ...props }: SpotlightSurfaceProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=spotlight-surface.d.ts.map