//#region src/motion/beam-flow.d.ts
/** A waypoint, in percentages of the parent box. `{ x: 0, y: 50 }` is mid-left. */
export interface BeamPoint {
  x: number;
  y: number;
}
export type BeamState = "idle" | "active" | "success" | "error";
export interface BeamFlowProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * Two or more waypoints. Two draws one smooth S; more draws a path through
   * every node, which is what a pipeline diagram wants.
   */
  points: readonly BeamPoint[];
  state?: BeamState;
  /** Stroke width in px. Uses `non-scaling-stroke`, so it never smears. */
  width?: number;
  /** Seconds for one packet to cross the path. */
  speed?: number;
  /** Accessible name. Omit it and the connector is decorative to a screen reader. */
  label?: string;
  /** Freeze the packet without removing the path. */
  static?: boolean;
}
/**
 * LUC BeamFlow — a connector that shows something moving between two places.
 *
 * Built for the surfaces LUC UI is used on beyond dashboards: an AI request
 * travelling model to tool to answer, an ingest pipeline, an integration
 * diagram, an onboarding map. It is an overlay, so the nodes themselves stay
 * ordinary LUC surfaces (Card, Badge, IconButton) positioned by the caller.
 *
 *   <div className="relative grid grid-cols-3">
 *     <Node /> <Node /> <Node />
 *     <BeamFlow points={[{ x: 12, y: 50 }, { x: 50, y: 50 }, { x: 88, y: 50 }]} />
 *   </div>
 *
 * The path is drawn in a 0-100 viewBox with `preserveAspectRatio="none"` and
 * `non-scaling-stroke`, so the connector is responsive by construction and
 * needs no ResizeObserver: the whole component is one SVG and two animations.
 */
export declare function BeamFlow({ className, points, state, width, speed, label, static: isStatic, ...props }: BeamFlowProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=beam-flow.d.ts.map