//#region src/motion/selection-beam.d.ts
export interface SelectionBeamProps {
  /** The element the selection starts from — a table row, a list item, a chip. */
  from: React.RefObject<Element | null>;
  /** The element the selection lands on — a chart marker, a detail panel. */
  to: React.RefObject<Element | null>;
  /** Whether the link is live. Inactive keeps the rail and drops the packet. */
  active?: boolean;
  /** `accent` for the live link, `muted` for a structural hint. */
  tone?: "accent" | "muted";
  /** Base stroke width, in px. */
  width?: number;
  /** Seconds for the packet to cross the full path. */
  speed?: number;
  /** How far the curve bulges sideways, as a fraction of the run. */
  bow?: number;
  /**
   * Change this whenever the anchored elements move for a reason the observer
   * cannot see. Selecting a different row is the canonical case: the refs stay
   * the same objects, the two boxes are the same size, and only the caller knows
   * that the anchor moved.
   */
  revision?: unknown;
  /** Accessible name. Omit it and the beam is decorative to a screen reader. */
  label?: string;
  className?: string;
}
/**
 * LUC `SelectionBeam` — the line that connects two things that are actually
 * connected.
 *
 * Table selection → chart marker → inspector is the interaction LUC UI is best
 * at, and the missing piece was always the *visible* link: the user selects a
 * row, a marker highlights, a panel fills in, and nothing says those three are
 * one gesture. `SelectionBeam` measures the two live DOM nodes and draws a
 * travelling packet between them, so the connection is legible without the
 * product hard-coding an arrow.
 *
 * It is deliberately provider-agnostic: it takes two refs and knows nothing
 * about tables or charts. Any pair of elements can be linked — a metric card and
 * its breakdown, a step and the state it produced, an image thumbnail and the
 * canvas that owns it.
 *
 * Performance and safety:
 *
 *  - The overlay is `position: fixed`, so it needs no positioned ancestor and
 *    cannot be clipped by one; it simply follows the viewport.
 *  - Measurement is rAF-coalesced and driven by `ResizeObserver` plus a passive
 *    capture-phase scroll listener, so a beam attached inside a scrolling pane
 *    stays attached.
 *  - It renders nothing until the first measurement, so SSR output is empty and
 *    there is no hydration mismatch.
 *  - Both geometry and the travelling packet are disabled under reduced motion;
 *    the rail remains, because the *relationship* is information.
 */
export declare function SelectionBeam({ from, to, active, tone, width, speed, bow, revision, label, className }: SelectionBeamProps): import("react").JSX.Element | null;
//#endregion
//# sourceMappingURL=selection-beam.d.ts.map