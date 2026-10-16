//#region src/motion/stagger.d.ts
/**
 * LUC StaggerGroup — a short, ordered entrance for a *set* of related items.
 *
 * A dashboard's worth of cards is not a list of unrelated elements: revealing
 * them in reading order tells the eye where to start. The stagger is small
 * (≤60ms per item) and capped, so a twelve-card grid still finishes well under
 * half a second — a slow cascade reads as a broken page.
 *
 * Nothing here re-implements `Reveal`: each item delegates to it, so the
 * viewport trigger, the reduced-motion clamp and the no-JS fail-safe are shared.
 */
export interface StaggerGroupProps extends React.ComponentPropsWithRef<"div"> {
  /** Delay added per item, in seconds. Keep it small. */
  step?: number;
  /** Delay before the first item, in seconds. */
  delay?: number;
  /** Cap the total stagger so a large grid does not crawl. */
  maxItems?: number;
}
export declare function StaggerGroup({ className, children, step, delay, maxItems, ...props }: StaggerGroupProps): import("react").JSX.Element;
export interface StaggerItemProps extends React.ComponentPropsWithRef<"div"> {
  /** Position in the group. The caller owns the order — no child counting. */
  index: number;
  distance?: number;
}
/**
 * One item in a `StaggerGroup`.
 *
 * The explicit `index` is deliberate: an implicit counter breaks as soon as an
 * item is conditionally rendered, and a stagger that shifts when one card is
 * hidden is worse than no stagger.
 */
export declare function StaggerItem({ className, children, index, distance: travel, ...props }: StaggerItemProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=stagger.d.ts.map