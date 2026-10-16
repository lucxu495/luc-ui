//#region src/components/stepper.d.ts
/**
 * LUC Stepper — progress through a known sequence.
 *
 * Used for onboarding, checkout and multi-part forms. Two decisions matter:
 *
 *  1. **A completed step is reversible, an unreachable one is not.** Steps at or
 *     before `current` are buttons; a later step is static text, so a user
 *     cannot jump into a step whose prerequisites are not met.
 *  2. **`aria-current="step"` marks exactly one step**, which is what makes the
 *     strip announce correctly. The connector between steps is decorative and
 *     hidden from assistive technology.
 */
export interface StepperStep {
  id: string;
  label: string;
  /** Optional supporting line under the label. */
  description?: string;
  /** Mark done explicitly; otherwise derived from `current`. */
  complete?: boolean;
}
export interface StepperProps extends Omit<React.ComponentPropsWithRef<"ol">, "children"> {
  steps: readonly StepperStep[];
  /** Zero-based index of the active step. */
  current: number;
  /** Jump to a step. Only steps before `current` call this. */
  onStepSelect?: (index: number) => void;
  /** `horizontal` is a form header; `vertical` is a sidebar checklist. */
  orientation?: "horizontal" | "vertical";
  /** Show the step number instead of a check when done. Default `false`. */
  showNumbers?: boolean;
}
export declare function Stepper({ className, steps, current, onStepSelect, orientation, showNumbers, ...props }: StepperProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=stepper.d.ts.map