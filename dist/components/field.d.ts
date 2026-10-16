import { ReactNode } from "react";
//#region src/components/field.d.ts
/**
 * Read field wiring inside a custom control. Returns safe defaults outside a
 * `<Field>`, so every control also works standalone.
 */
export declare function useField(): {
  id: string;
  labelId: string | undefined;
  describedBy: string | undefined;
  hasLabel: boolean;
  invalid: boolean;
  disabled: boolean;
  readOnly: boolean;
  busy: boolean;
  required: boolean;
  groupLabeled: boolean;
};
export interface FieldProps {
  children: ReactNode;
  /** Explicit id for the control. Generated when omitted. */
  id?: string;
  label?: ReactNode;
  /** Helper text rendered under the control. Replaced by `error` when present. */
  description?: ReactNode;
  /** Error message. Presence sets `aria-invalid` on the control. */
  error?: ReactNode;
  /**
   * Validation in flight. Renders a quiet inline status row and sets
   * `aria-busy` on the control. Pass a node to override "Checking…".
   */
  validating?: boolean | ReactNode;
  /**
   * Confirmation of a *checked* value (an availability probe, a verified
   * handle). Deliberately not rendered for ordinary "field is filled in" —
   * see DESIGN_SYSTEM.md §12.
   */
  success?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Optional content rendered next to the label, e.g. a "Why?" hint button. */
  labelHint?: ReactNode;
  className?: string;
  /** Compact layouts drop the label row spacing. */
  orientation?: "vertical" | "horizontal";
}
/**
 * Composes a labelled, described, validatable control.
 *
 * The field owns ids and ARIA wiring; the control owns its visuals. This is the
 * only place in LUC UI where `<label>` semantics are decided.
 */
export declare function Field({ children, id, label, description, error, validating, success, required, disabled, readOnly, labelHint, className, orientation }: FieldProps): import("react").JSX.Element;
export interface FieldsetProps extends Omit<React.ComponentPropsWithRef<"fieldset">, "disabled"> {
  /** The group's accessible name. Always rendered — a fieldset without a legend
   * is a container, not a form group. */
  legend: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  /** Optional content in the legend row, e.g. "Select all". */
  legendHint?: ReactNode;
}
/**
 * A real `<fieldset>`/`<legend>` group. Use it when several controls answer one
 * question (a set of checkboxes, a radio group, a repeatable block) — the legend
 * is announced with each control, which a `<div>` with a heading is not.
 */
export declare function Fieldset({ legend, description, children, className, disabled, legendHint, ...props }: FieldsetProps): import("react").JSX.Element;
export interface FieldGroupProps extends React.ComponentPropsWithRef<"div"> {
  /** Column count from the `sm` breakpoint up. A single column on mobile always. */
  columns?: 1 | 2 | 3;
}
/**
 * Lays fields out in a responsive grid. It owns spacing only: every child keeps
 * its own `<Field>` wiring, so the group never becomes a form engine.
 */
export declare function FieldGroup({ columns, className, ...props }: FieldGroupProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=field.d.ts.map