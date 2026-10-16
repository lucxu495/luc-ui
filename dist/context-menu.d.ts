import { MenuItemVariant, MenuShortcut } from "./components/menu-shared.js";
import { ContextMenu as ContextMenu$1 } from "radix-ui";
//#region src/components/context-menu.d.ts
export declare const ContextMenu: import("react").FC<ContextMenu$1.ContextMenuProps>;
export declare const ContextMenuTrigger: import("react").ForwardRefExoticComponent<ContextMenu$1.ContextMenuTriggerProps & import("react").RefAttributes<HTMLSpanElement>>;
export declare const ContextMenuGroup: import("react").ForwardRefExoticComponent<ContextMenu$1.ContextMenuGroupProps & import("react").RefAttributes<HTMLDivElement>>;
export declare const ContextMenuRadioGroup: import("react").ForwardRefExoticComponent<ContextMenu$1.ContextMenuRadioGroupProps & import("react").RefAttributes<HTMLDivElement>>;
export declare const ContextMenuSub: import("react").FC<ContextMenu$1.ContextMenuSubProps>;
export declare const ContextMenuPortal: import("react").FC<ContextMenu$1.ContextMenuPortalProps>;
export type ContextMenuContentProps = React.ComponentPropsWithRef<typeof ContextMenu$1.Content>;
export declare function ContextMenuContent({ className, ...props }: ContextMenuContentProps): import("react").JSX.Element;
export type ContextMenuSubContentProps = React.ComponentPropsWithRef<typeof ContextMenu$1.SubContent>;
export declare function ContextMenuSubContent({ className, ...props }: ContextMenuSubContentProps): import("react").JSX.Element;
export interface ContextMenuItemProps extends React.ComponentPropsWithRef<typeof ContextMenu$1.Item> {
  variant?: MenuItemVariant;
  inset?: boolean;
  shortcut?: React.ReactNode;
}
export declare function ContextMenuItem({ className, variant, inset, shortcut, asChild, children, ...props }: ContextMenuItemProps): import("react").JSX.Element;
export interface ContextMenuCheckboxItemProps extends React.ComponentPropsWithRef<typeof ContextMenu$1.CheckboxItem> {
  shortcut?: React.ReactNode;
}
export declare function ContextMenuCheckboxItem({ className, children, shortcut, ...props }: ContextMenuCheckboxItemProps): import("react").JSX.Element;
export interface ContextMenuRadioItemProps extends React.ComponentPropsWithRef<typeof ContextMenu$1.RadioItem> {
  shortcut?: React.ReactNode;
}
export declare function ContextMenuRadioItem({ className, children, shortcut, ...props }: ContextMenuRadioItemProps): import("react").JSX.Element;
export interface ContextMenuSubTriggerProps extends React.ComponentPropsWithRef<typeof ContextMenu$1.SubTrigger> {
  inset?: boolean;
}
export declare function ContextMenuSubTrigger({ className, inset, asChild, children, ...props }: ContextMenuSubTriggerProps): import("react").JSX.Element;
export interface ContextMenuLabelProps extends React.ComponentPropsWithRef<typeof ContextMenu$1.Label> {
  inset?: boolean;
}
export declare function ContextMenuLabel({ className, inset, ...props }: ContextMenuLabelProps): import("react").JSX.Element;
export declare function ContextMenuSeparator({ className, ...props }: React.ComponentPropsWithRef<typeof ContextMenu$1.Separator>): import("react").JSX.Element;
/** Trailing keyboard hint inside a custom row. */
export declare const ContextMenuShortcut: typeof MenuShortcut;
//#endregion
//# sourceMappingURL=context-menu.d.ts.map