//#region src/motion/shared-highlight.d.ts
/**
 * LUC SharedHighlight — one moving indicator shared by a set of view options.
 *
 * Tabs, view toggles, range pickers and segmented filters are the same
 * interaction: one selection out of a small ordered set. Repainting the
 * selected chip and de-selecting the others reads as a flicker; gliding a
 * single highlight between positions reads as one object moving, which is what
 * the user actually did.
 *
 * It is deliberately **not** a state container: the caller owns `value`, and an
 * item may be a link (`href`), so the same component serves client state
 * (a view toggle) and navigation (page tabs) without a second implementation.
 *
 * The measurement/glide mechanics come from `useSlidingIndicator`, so the
 * segmented control and this primitive cannot drift.
 */
export interface SharedHighlightItem {
  value: string;
  label: React.ReactNode;
  /** Render as a link (navigation) instead of a button (state). */
  href?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  /** Accessible hint for a link, e.g. `aria-current` semantics. */
  current?: boolean;
}
export interface SharedHighlightProps extends Omit<React.ComponentPropsWithRef<"div">, "onChange"> {
  items: readonly SharedHighlightItem[];
  value: string;
  onValueChange?: (value: string) => void;
  size?: "sm" | "md";
  /** `track` is a recessed pill track; `underline` is a bare row with a rule. */
  variant?: "track" | "underline";
  fill?: boolean;
  ariaLabel?: string;
  /** Extra classes for each item (e.g. a link's `scroll={false}` behaviour). */
  itemClassName?: string;
  onNavigate?: (value: string) => void;
}
export declare function SharedHighlight({ className, items, value, onValueChange, size, variant, fill, ariaLabel, itemClassName, onNavigate, ...props }: SharedHighlightProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=shared-highlight.d.ts.map