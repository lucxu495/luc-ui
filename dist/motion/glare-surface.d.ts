//#region src/motion/glare-surface.d.ts
export interface GlareSurfaceProps extends React.ComponentPropsWithRef<"div"> {
  /** Radius of the highlight, in px. */
  size?: number;
  /** Peak opacity of the highlight. Stay in single digits to low teens. */
  opacity?: number;
  /** `light` adds a white sheen; `accent` uses the theme accent. */
  tone?: "light" | "accent";
  /** Soft edge as a percentage of `size`. */
  softness?: number;
}
/**
 * LUC GlareSurface — a sheen that follows the pointer *on* the surface.
 *
 * Distinct from `SpotlightSurface`: a spotlight lights the surface under the
 * content, a glare reads as reflection across it. Both are single composited
 * layers with no per-frame React state, so neither can make a chart janky.
 */
export declare function GlareSurface({ className, children, size, opacity, tone, softness, ...props }: GlareSurfaceProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=glare-surface.d.ts.map