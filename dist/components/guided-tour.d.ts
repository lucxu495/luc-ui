import { ReactNode } from "react";
//#region src/components/guided-tour.d.ts
/**
 * LUC GuidedTour — walk a user through a live interface.
 *
 * Three decisions keep this honest:
 *
 *   1. **It points at the product, it does not duplicate it.** A step names a
 *      CSS selector; the spotlight is measured from the real element on every
 *      scroll and resize, so the tour cannot drift out of sync with a layout it
 *      does not own.
 *   2. **The scrim is a shadow, not four rectangles.** One box-shadow draws the
 *      hole, which means the highlighted region is exactly one element and
 *      there is no seam to get wrong.
 *   3. **It is dismissible from the keyboard.** Escape leaves the tour from any
 *      step, focus moves into the card when it opens and returns to the page
 *      when it closes, and the controls are real buttons.
 *
 * The overlay is only mounted while `open`, so nothing measures, listens or
 * renders on a page where the tour is not running.
 */
export type TourPlacement = "bottom" | "top" | "right" | "left";
export interface TourStep {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** CSS selector of the element to spotlight. Omit for a centred, targetless step. */
  target?: string;
  placement?: TourPlacement;
  /** Breathing room around the spotlight rect, in pixels. Default 8. */
  padding?: number;
}
export interface GuidedTourLabels {
  next?: string;
  previous?: string;
  skip?: string;
  done?: string;
  /** Step counter, e.g. `(index, total) => \`Step 2 of 5\``. */
  counter?: (index: number, total: number) => string;
  close?: string;
}
export interface GuidedTourProps {
  steps: readonly TourStep[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stepIndex?: number;
  defaultStepIndex?: number;
  onStepChange?: (index: number) => void;
  labels?: GuidedTourLabels;
  className?: string;
}
export declare function GuidedTour({ steps, open, onOpenChange, stepIndex, defaultStepIndex, onStepChange, labels, className }: GuidedTourProps): import("react").JSX.Element | null;
//#endregion
//# sourceMappingURL=guided-tour.d.ts.map