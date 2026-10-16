import { MenuItemVariant, MenuShortcut } from "./components/menu-shared.js";
import { DropdownMenu as DropdownMenu$1 } from "radix-ui";
//#region src/components/dropdown-menu.d.ts
/**
 * LUC DropdownMenu — actions and options attached to a trigger.
 *
 * Radix owns the hard parts: the menu/menuitem ARIA model, roving focus,
 * typeahead, Escape / arrow / Home / End handling, collision-aware portals,
 * submenu open-intent and focus restore. LUC owns the surface and the row
 * rhythm — the same language as `ContextMenu`.
 *
 *   Select        → choose a value from a known set
 *   Combobox      → search, then choose a value
 *   DropdownMenu  → actions or options attached to a trigger
 *   ContextMenu   → those actions, attached to a target
 *   CommandMenu   → global navigation and search
 */
export declare const DropdownMenu: import("react").FC<DropdownMenu$1.DropdownMenuProps>;
export declare const DropdownMenuTrigger: import("react").ForwardRefExoticComponent<DropdownMenu$1.DropdownMenuTriggerProps & import("react").RefAttributes<HTMLButtonElement>>;
export declare const DropdownMenuGroup: import("react").ForwardRefExoticComponent<DropdownMenu$1.DropdownMenuGroupProps & import("react").RefAttributes<HTMLDivElement>>;
export declare const DropdownMenuRadioGroup: import("react").ForwardRefExoticComponent<DropdownMenu$1.DropdownMenuRadioGroupProps & import("react").RefAttributes<HTMLDivElement>>;
export declare const DropdownMenuSub: import("react").FC<DropdownMenu$1.DropdownMenuSubProps>;
export declare const DropdownMenuPortal: import("react").FC<DropdownMenu$1.DropdownMenuPortalProps>;
export type DropdownMenuContentProps = React.ComponentPropsWithRef<typeof DropdownMenu$1.Content>;
export declare function DropdownMenuContent({ className, sideOffset, ...props }: DropdownMenuContentProps): import("react").JSX.Element;
export type DropdownMenuSubContentProps = React.ComponentPropsWithRef<typeof DropdownMenu$1.SubContent>;
export declare function DropdownMenuSubContent({ className, sideOffset, ...props }: DropdownMenuSubContentProps): import("react").JSX.Element;
export interface DropdownMenuItemProps extends React.ComponentPropsWithRef<typeof DropdownMenu$1.Item> {
  /** Semantic tone. `destructive` is a negative *label*, never a filled red row. */
  variant?: MenuItemVariant;
  /** Align a row that has no leading indicator with rows that do. */
  inset?: boolean;
  /** Trailing keyboard hint, e.g. `⌘K`. */
  shortcut?: React.ReactNode;
}
export declare function DropdownMenuItem({ className, variant, inset, shortcut, asChild, children, ...props }: DropdownMenuItemProps): import("react").JSX.Element;
export interface DropdownMenuCheckboxItemProps extends React.ComponentPropsWithRef<typeof DropdownMenu$1.CheckboxItem> {
  shortcut?: React.ReactNode;
}
export declare function DropdownMenuCheckboxItem({ className, children, shortcut, ...props }: DropdownMenuCheckboxItemProps): import("react").JSX.Element;
export interface DropdownMenuRadioItemProps extends React.ComponentPropsWithRef<typeof DropdownMenu$1.RadioItem> {
  shortcut?: React.ReactNode;
}
export declare function DropdownMenuRadioItem({ className, children, shortcut, ...props }: DropdownMenuRadioItemProps): import("react").JSX.Element;
export interface DropdownMenuSubTriggerProps extends React.ComponentPropsWithRef<typeof DropdownMenu$1.SubTrigger> {
  inset?: boolean;
}
export declare function DropdownMenuSubTrigger({ className, inset, asChild, children, ...props }: DropdownMenuSubTriggerProps): import("react").JSX.Element;
export interface DropdownMenuLabelProps extends React.ComponentPropsWithRef<typeof DropdownMenu$1.Label> {
  inset?: boolean;
}
export declare function DropdownMenuLabel({ className, inset, ...props }: DropdownMenuLabelProps): import("react").JSX.Element;
export declare function DropdownMenuSeparator({ className, ...props }: React.ComponentPropsWithRef<typeof DropdownMenu$1.Separator>): import("react").JSX.Element;
/** Trailing keyboard hint inside a custom row. */
export declare const DropdownMenuShortcut: typeof MenuShortcut;
//#endregion
//# sourceMappingURL=dropdown-menu.d.ts.map