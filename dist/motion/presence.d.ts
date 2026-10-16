//#region src/motion/presence.d.ts
/**
 * LUC FadeSwap — a crossfade between one of N mutually exclusive states.
 *
 * Use it when the *same slot* shows different content: a metric switching
 * aggregation, a chart switching dataset, an empty/loading/content swap. The
 * `slot` value is the identity; changing it fades the old out and the new in,
 * with a few px of travel so the change is legible as a change.
 *
 * Reduced motion renders the new state immediately with no travel.
 */
export interface FadeSwapProps extends Omit<React.ComponentPropsWithRef<"div">, "slot"> {
  /** Identity of the current content. Changing it triggers the swap. */
  slot: string | number;
  children: React.ReactNode;
  /** `outFirst` waits for the exit before entering (a true swap). */
  mode?: "sync" | "wait";
  distance?: number;
}
export declare function FadeSwap({ className, slot, children, mode, distance: travel, ...props }: FadeSwapProps): import("react").JSX.Element;
export interface PresenceProps extends React.ComponentPropsWithRef<"div"> {
  present: boolean;
  children: React.ReactNode;
}
/**
 * LUC Presence — mount/unmount with a fade instead of a hard cut.
 *
 * The primitive behind contextual panels (a filter bar that appears, a
 * footnote that only exists when a value is stale). It animates *presence*,
 * never layout of surrounding content beyond the flow change itself.
 */
export declare function Presence({ className, present, children, ...props }: PresenceProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=presence.d.ts.map