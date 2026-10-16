//#region src/components/rating.d.ts
/**
 * LUC Rating — a score on a fixed scale.
 *
 * The important decision is that this is a **radio group**, not six buttons. A
 * rating is a choice from an ordered scale, which is exactly what a radio group
 * is: one Tab stop, arrow keys to change the value, `aria-checked` per option,
 * and the whole thing announced as "4 of 5 stars". A row of buttons would be six
 * tab stops and no statement of what the chosen number means.
 *
 * Read-only mode is a separate rendering path: it is `role="img"` with a label,
 * because a score that cannot be changed is data, and data is not a form
 * control. `allowHalf` is supported visually and announced as "3.5 of 5".
 */
export interface RatingProps extends Omit<React.ComponentPropsWithRef<"div">, "onChange" | "defaultValue"> {
  /** Controlled value. */
  value?: number;
  /** Uncontrolled start value. Default 0. */
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Number of stars. Default 5. */
  max?: number;
  /** Allow half steps (click the left half of a star). */
  allowHalf?: boolean;
  /** Display only — no interaction, announced as a value. */
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  /** Accessible name. Required unless the rating sits in a labelled field. */
  label?: string;
  /** Clears the value when the current one is chosen again. Default `true`. */
  clearable?: boolean;
}
export declare function Rating({ className, value, defaultValue, onValueChange, max, allowHalf, readOnly, size, label, clearable, ...props }: RatingProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=rating.d.ts.map