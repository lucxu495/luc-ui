import { Toolbar } from "radix-ui";
//#region src/components/button-group.d.ts
/**
 * LUC ButtonGroup / Toolbar — actions that belong to each other.
 *
 * `ButtonGroup` is layout and one joint: the children keep their own variants,
 * the group removes the doubled border between neighbours and squares the inner
 * corners, so a row of three actions reads as one control with three parts
 * rather than three controls that happen to touch. It does **not** restyle the
 * buttons — a `danger` button in a group must still look dangerous.
 *
 * `Toolbar` is the keyboard contract on top: one tab stop for the whole strip,
 * arrow keys between the controls (Radix's roving focus), Home/End, and a
 * `role="toolbar"` that needs a label. That is the difference between a toolbar
 * and a `div` with buttons in it — a screen-reader user should not have to press
 * Tab eleven times to cross a formatting strip.
 */
export interface ButtonGroupProps extends React.ComponentPropsWithRef<"div"> {
  /** Stack vertically. Default `false`. */
  vertical?: boolean;
  /** Attach the group to a `Field`'s accessible description. */
  "aria-describedby"?: string;
}
export declare function ButtonGroup({ className, vertical, ...props }: ButtonGroupProps): import("react").JSX.Element;
/** A hairline divider for a mixed group (a button, then a menu). */
export declare function ButtonGroupSeparator({ className, ...props }: React.ComponentPropsWithRef<"span">): import("react").JSX.Element;
export type ToolbarProps = React.ComponentPropsWithRef<typeof Toolbar.Root>;
/**
 * A toolbar is one tab stop. `label` is required by the type because an unnamed
 * `role="toolbar"` is a real accessibility defect, not a stylistic one.
 */
declare function Toolbar$1({ className, label, ...props }: ToolbarProps & {
  label: string;
}): import("react").JSX.Element;
export type ToolbarButtonProps = React.ComponentPropsWithRef<typeof Toolbar.Button>;
export declare const ToolbarButton: import("react").ForwardRefExoticComponent<Toolbar.ToolbarButtonProps & import("react").RefAttributes<HTMLButtonElement>>;
export declare const ToolbarSeparator: import("react").ForwardRefExoticComponent<Toolbar.ToolbarSeparatorProps & import("react").RefAttributes<HTMLDivElement>>;
export declare const ToolbarLink: import("react").ForwardRefExoticComponent<Toolbar.ToolbarLinkProps & import("react").RefAttributes<HTMLAnchorElement>>;
export declare const ToolbarToggleGroup: import("react").ForwardRefExoticComponent<(Toolbar.ToolbarToggleGroupSingleProps | Toolbar.ToolbarToggleGroupMultipleProps) & import("react").RefAttributes<HTMLDivElement>>;
export declare const ToolbarToggleItem: import("react").ForwardRefExoticComponent<Toolbar.ToolbarToggleItemProps & import("react").RefAttributes<HTMLButtonElement>>;
//#endregion
export { Toolbar$1 as Toolbar };
//# sourceMappingURL=button-group.d.ts.map