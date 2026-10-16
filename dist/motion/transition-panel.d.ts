//#region src/motion/transition-panel.d.ts
export interface TransitionPanelProps extends React.ComponentPropsWithRef<"div"> {
  /** Identity of the showing panel. Changing it animates the swap. */
  activeIndex: string | number;
  /** `1` for forward, `-1` for back. Drives the travel direction. */
  direction?: 1 | -1;
  children: React.ReactNode;
  /**
   * `overlay` (default) crossfades with the outgoing panel lifted out of flow,
   * so the slot never collapses mid-swap. `swap` waits for the exit instead —
   * use it when two panels must never be visible at once.
   */
  mode?: "swap" | "overlay";
  /** Add a small blur so the swap reads as depth rather than a hard cut. */
  blur?: boolean;
}
/**
 * LUC TransitionPanel — a directional swap inside one fixed slot.
 *
 * `FadeSwap` is for a value that changed; `TransitionPanel` is for *navigating*
 * between sibling views (a metric switching breakdown, a chart switching mode,
 * a tab panel inside a card). The direction is explicit because only the caller
 * knows whether the reader moved forward or back — guessing from index order
 * breaks the moment panels are added or reordered.
 */
export declare function TransitionPanel({ className, activeIndex, direction, mode, blur, children, ...props }: TransitionPanelProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=transition-panel.d.ts.map