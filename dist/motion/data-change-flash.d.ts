//#region src/motion/data-change-flash.d.ts
export type FlashTone = "positive" | "negative" | "neutral";
/**
 * LUC DataChangeFlash — a short, one-shot emphasis when a value *actually*
 * changed.
 *
 * It is not a live-price effect: nothing flashes on a timer, and nothing
 * flashes on the first paint (there is no previous value to compare against —
 * flashing everything on load is noise, and worse, it implies a change that did
 * not happen). The tint is drawn as a composited background and fades out; the
 * value itself is never recoloured, so a flash can never be mistaken for a
 * semantic state.
 *
 * Reduced motion keeps the wrapper but never flashes.
 */
export interface DataChangeFlashProps extends React.ComponentPropsWithRef<"div"> {
  /** The value being watched. A change (by `!==`, with NaN treated as equal) flashes. */
  value: number | string | null | undefined;
  /** Semantic tint. Defaults to `neutral` — a change is not automatically good. */
  tone?: FlashTone;
  /** How long the tint lasts, in ms. */
  duration?: number;
  children: React.ReactNode;
}
export declare function DataChangeFlash({ className, value, tone, duration, children, ...props }: DataChangeFlashProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=data-change-flash.d.ts.map