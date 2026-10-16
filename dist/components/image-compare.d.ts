//#region src/components/image-compare.d.ts
/**
 * LUC ImageCompare — a before/after wipe.
 *
 * The mechanism is a real `<input type="range">` lying over the picture, not a
 * custom pointer handler. That choice buys the whole keyboard and touch story
 * for free — arrow keys step, Home/End jump, a tap anywhere on a track sets the
 * value, and assistive technology announces "38, slider" instead of an
 * unlabelled div — while the visible parts (the two images, the divider, the
 * labels) stay decorative.
 *
 * It is used for a processed vs. original image, a forecast vs. a baseline, or
 * a design revision against its predecessor: any pair where the interesting
 * information is the *difference* at a given position.
 */
export interface CompareImage {
  src: string;
  alt: string;
}
export interface ImageCompareProps extends Omit<React.ComponentPropsWithRef<"div">, "onChange"> {
  /** Shown on the left of the wipe. */
  before: CompareImage;
  /** Shown on the right of the wipe. */
  after: CompareImage;
  /** 0–100. The share of the frame given to `before`. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Accessible name for the slider. */
  label?: string;
  beforeLabel?: string;
  afterLabel?: string;
  aspect?: "square" | "video" | "wide";
}
export declare function ImageCompare({ before, after, value, defaultValue, onValueChange, label, beforeLabel, afterLabel, aspect, className, ...props }: ImageCompareProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=image-compare.d.ts.map