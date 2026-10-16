import { ReactNode } from "react";
import { Command as Command$1, CommandDialog as CmdkCommandDialog, useCommandState } from "cmdk";
//#region src/components/command.d.ts
/**
 * LUC Command Menu.
 *
 * cmdk owns filtering, ranking, the `aria-activedescendant` listbox model and
 * scroll-into-view for the active row. LUC owns the palette layout, the search
 * field, the grouping rhythm, the active row language and the shortcut column.
 *
 * Command is an *action* surface, not a dropdown:
 *   CommandMenu → search and invoke (navigate, run, toggle)
 *   Combobox    → search and choose a value
 *   Select      → choose one of a few known values
 */
export type CommandProps = React.ComponentPropsWithRef<typeof Command$1>;
export declare function Command({ className, label, loop, ...props }: CommandProps): import("react").JSX.Element;
export type CommandInputProps = React.ComponentPropsWithRef<typeof Command$1.Input>;
export declare function CommandInput({ className, ...props }: CommandInputProps): import("react").JSX.Element;
export type CommandListProps = React.ComponentPropsWithRef<typeof Command$1.List>;
export declare function CommandList({ className, ...props }: CommandListProps): import("react").JSX.Element;
export declare function CommandGroup({ className, heading, ...props }: React.ComponentPropsWithRef<typeof Command$1.Group>): import("react").JSX.Element;
export interface CommandItemProps extends React.ComponentPropsWithRef<typeof Command$1.Item> {
  /** Leading icon. Decorative — the label carries the meaning. */
  icon?: ReactNode;
  /** Trailing keyboard hint, e.g. `"⌘K"`. */
  shortcut?: ReactNode;
  /** Optional secondary line. */
  description?: ReactNode;
}
export declare function CommandItem({ className, children, icon, shortcut, description, ...props }: CommandItemProps): import("react").JSX.Element;
export declare function CommandSeparator({ className, ...props }: React.ComponentPropsWithRef<typeof Command$1.Separator>): import("react").JSX.Element;
export declare function CommandEmpty({ className, children, ...props }: React.ComponentPropsWithRef<typeof Command$1.Empty>): import("react").JSX.Element;
export declare function CommandLoading({ className, children, ...props }: React.ComponentPropsWithRef<typeof Command$1.Loading>): import("react").JSX.Element;
export interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  /** Accessible name for the listbox. */
  label?: string;
  /** Description under the search field — context, not decoration. */
  description?: ReactNode;
  /** Footer strip: hints, counts, or a live status line. */
  footer?: ReactNode;
  className?: string;
}
/**
 * The palette shell: a top-anchored dialog so the search field lands where the
 * eye already is, with an opaque overlay surface.
 */
export declare function CommandMenu({ open, onOpenChange, children, label, description, footer, className }: CommandMenuProps): import("react").JSX.Element;
/**
 * Nested pages inside one palette (root → sub-page → back), the pattern cmdk
 * documents: keep a page stack, clear the search on navigation, and pop with
 * Backspace when the field is empty.
 */
export declare function useCommandPages(): {
  pages: string[];
  page: string | undefined;
  search: string;
  setSearch: import("react").Dispatch<import("react").SetStateAction<string>>;
  push: (next: string) => void;
  pop: () => void;
  reset: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
};
/**
 * ⌘K / Ctrl+K. Deliberately tiny — a hotkey is 20 lines, not a dependency.
 * The Showcase uses this; products may wire their own global handler instead.
 */
export declare function useCommandHotkey(onOpen: () => void, enabled?: boolean): void;
//#endregion
export { CmdkCommandDialog as CommandDialog, useCommandState };
//# sourceMappingURL=command.d.ts.map