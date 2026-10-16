import { Checkbox } from "radix-ui";
//#region src/components/checkbox.d.ts
export interface CheckboxProps extends Omit<React.ComponentPropsWithRef<typeof Checkbox.Root>, "children"> {
  /** Optional inline label rendered to the right of the box. */
  label?: React.ReactNode;
  description?: React.ReactNode;
  invalid?: boolean;
}
declare function Checkbox$1({ className, label, description, invalid, id, disabled, ...props }: CheckboxProps): import("react").JSX.Element;
//#endregion
export { Checkbox$1 as Checkbox };
//# sourceMappingURL=checkbox.d.ts.map