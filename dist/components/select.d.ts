import { ControlSize } from "./input.js";
import { Select as Select$1 } from "radix-ui";
import { ReactNode } from "react";
//#region src/components/select.d.ts
/** Raw Radix root, for callers who do not want the LUC size context. */
export declare const SelectRoot: import("react").FC<Select$1.SelectProps>;
export declare const SelectValue: import("react").ForwardRefExoticComponent<Select$1.SelectValueProps & import("react").RefAttributes<HTMLSpanElement>>;
export declare const SelectGroup: import("react").ForwardRefExoticComponent<Select$1.SelectGroupProps & import("react").RefAttributes<HTMLDivElement>>;
export declare const SelectSeparator: import("react").ForwardRefExoticComponent<Select$1.SelectSeparatorProps & import("react").RefAttributes<HTMLDivElement>>;
export interface SelectProps extends React.ComponentPropsWithRef<typeof Select$1.Root> {
  /** Control size, shared by the trigger and the menu. Default `md`. */
  size?: ControlSize;
}
/**
 * `Select` is the sized root: one `size` drives the trigger height, the type
 * scale and the menu rhythm, so a product never hand-tunes a dropdown.
 */
export declare function Select({ size, children, ...props }: SelectProps): import("react").JSX.Element;
export interface SelectTriggerProps extends React.ComponentPropsWithRef<typeof Select$1.Trigger> {
  size?: ControlSize;
  /** Leading icon or avatar. Decorative by default. */
  leadingIcon?: ReactNode;
  invalid?: boolean;
}
export declare function SelectTrigger({ className, children, size, leadingIcon, invalid, disabled, id, ...props }: SelectTriggerProps): import("react").JSX.Element;
export interface SelectContentProps extends React.ComponentPropsWithRef<typeof Select$1.Content> {
  size?: ControlSize;
}
export declare function SelectContent({ className, children, size, position, sideOffset, ...props }: SelectContentProps): import("react").JSX.Element;
export interface SelectItemProps extends React.ComponentPropsWithRef<typeof Select$1.Item> {
  /** Secondary line under the main label. */
  description?: ReactNode;
}
export declare function SelectItem({ className, children, description, ...props }: SelectItemProps): import("react").JSX.Element;
export declare function SelectLabel({ className, ...props }: React.ComponentPropsWithRef<typeof Select$1.Label>): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=select.d.ts.map