import { Label } from "radix-ui";
//#region src/components/label.d.ts
/**
 * LUC Label — a standalone form label for a control LUC does not own.
 *
 * `Field` already renders the label for a LUC control, and it also wires the id,
 * the description and the error. This component exists for the other case: a
 * third-party control, a custom widget, or a naked checkbox row where the
 * consumer assembles the ARIA itself. Radix gives us the click-to-focus
 * behaviour without an `htmlFor` (which breaks on a composite widget).
 */
export interface LabelProps extends React.ComponentPropsWithRef<typeof Label.Root> {
  /** Renders the asterisk *and* marks the control as required for a reader. */
  required?: boolean;
  /** Muted, smaller label for a dense toolbar or a settings row. */
  size?: "sm" | "md";
}
declare function Label$1({ className, children, required, size, "aria-disabled": ariaDisabled, ...props }: LabelProps): import("react").JSX.Element;
//#endregion
export { Label$1 as Label };
//# sourceMappingURL=label.d.ts.map