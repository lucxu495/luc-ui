"use client";

import { DropdownMenu as RadixDropdownMenu } from "radix-ui";
import { RiArrowRightSLine, RiCheckLine } from "@remixicon/react";
import { cn } from "../utils/cn";
import {
  MenuShortcut,
  menuRowChildren,
  withTrailing,
  menuContentClass,
  menuIndicatorClass,
  menuItemClass,
  menuLabelClass,
  menuSeparatorClass,
  type MenuItemVariant,
} from "./menu-shared";

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

export const DropdownMenu = RadixDropdownMenu.Root;
export const DropdownMenuTrigger = RadixDropdownMenu.Trigger;
export const DropdownMenuGroup = RadixDropdownMenu.Group;
export const DropdownMenuRadioGroup = RadixDropdownMenu.RadioGroup;
export const DropdownMenuSub = RadixDropdownMenu.Sub;
export const DropdownMenuPortal = RadixDropdownMenu.Portal;

export type DropdownMenuContentProps = React.ComponentPropsWithRef<typeof RadixDropdownMenu.Content>;

export function DropdownMenuContent({ className, sideOffset = 6, ...props }: DropdownMenuContentProps) {
  return (
    <RadixDropdownMenu.Portal>
      <RadixDropdownMenu.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(menuContentClass, className)}
        {...props}
      />
    </RadixDropdownMenu.Portal>
  );
}

export type DropdownMenuSubContentProps = React.ComponentPropsWithRef<typeof RadixDropdownMenu.SubContent>;

export function DropdownMenuSubContent({ className, sideOffset = 4, ...props }: DropdownMenuSubContentProps) {
  return (
    <RadixDropdownMenu.Portal>
      <RadixDropdownMenu.SubContent
        data-slot="dropdown-menu-sub-content"
        sideOffset={sideOffset}
        className={cn(menuContentClass, className)}
        {...props}
      />
    </RadixDropdownMenu.Portal>
  );
}

export interface DropdownMenuItemProps
  extends React.ComponentPropsWithRef<typeof RadixDropdownMenu.Item> {
  /** Semantic tone. `destructive` is a negative *label*, never a filled red row. */
  variant?: MenuItemVariant;
  /** Align a row that has no leading indicator with rows that do. */
  inset?: boolean;
  /** Trailing keyboard hint, e.g. `⌘K`. */
  shortcut?: React.ReactNode;
}

export function DropdownMenuItem({
  className,
  variant,
  inset,
  shortcut,
  asChild,
  children,
  ...props
}: DropdownMenuItemProps) {
  return (
    <RadixDropdownMenu.Item
      data-slot="dropdown-menu-item"
      className={cn(menuItemClass({ variant, inset }), className)}
      asChild={asChild}
      {...props}
    >
      {menuRowChildren(children, shortcut, asChild)}
    </RadixDropdownMenu.Item>
  );
}

export interface DropdownMenuCheckboxItemProps
  extends React.ComponentPropsWithRef<typeof RadixDropdownMenu.CheckboxItem> {
  shortcut?: React.ReactNode;
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  shortcut,
  ...props
}: DropdownMenuCheckboxItemProps) {
  return (
    <RadixDropdownMenu.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(menuItemClass(), "pl-8", className)}
      {...props}
    >
      <RadixDropdownMenu.ItemIndicator className={menuIndicatorClass()}>
        <RiCheckLine aria-hidden="true" />
      </RadixDropdownMenu.ItemIndicator>
      {menuRowChildren(children, shortcut)}
    </RadixDropdownMenu.CheckboxItem>
  );
}

export interface DropdownMenuRadioItemProps
  extends React.ComponentPropsWithRef<typeof RadixDropdownMenu.RadioItem> {
  shortcut?: React.ReactNode;
}

export function DropdownMenuRadioItem({
  className,
  children,
  shortcut,
  ...props
}: DropdownMenuRadioItemProps) {
  return (
    <RadixDropdownMenu.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(menuItemClass(), "pl-8", className)}
      {...props}
    >
      <RadixDropdownMenu.ItemIndicator className={menuIndicatorClass()}>
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      </RadixDropdownMenu.ItemIndicator>
      {menuRowChildren(children, shortcut)}
    </RadixDropdownMenu.RadioItem>
  );
}

export interface DropdownMenuSubTriggerProps
  extends React.ComponentPropsWithRef<typeof RadixDropdownMenu.SubTrigger> {
  inset?: boolean;
}

export function DropdownMenuSubTrigger({
  className,
  inset,
  asChild,
  children,
  ...props
}: DropdownMenuSubTriggerProps) {
  return (
    <RadixDropdownMenu.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      asChild={asChild}
      className={cn(
        menuItemClass({ inset }),
        "data-[state=open]:bg-surface-interactive-hover data-[state=open]:text-fg-primary",
        className,
      )}
      {...props}
    >
      {withTrailing(
        children,
        <RiArrowRightSLine aria-hidden="true" className="ml-auto size-4 text-fg-muted" />,
        asChild,
      )}
    </RadixDropdownMenu.SubTrigger>
  );
}

export interface DropdownMenuLabelProps
  extends React.ComponentPropsWithRef<typeof RadixDropdownMenu.Label> {
  inset?: boolean;
}

export function DropdownMenuLabel({ className, inset = true, ...props }: DropdownMenuLabelProps) {
  return (
    <RadixDropdownMenu.Label
      data-slot="dropdown-menu-label"
      className={cn(menuLabelClass(inset), className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof RadixDropdownMenu.Separator>) {
  return (
    <RadixDropdownMenu.Separator
      data-slot="dropdown-menu-separator"
      className={cn(menuSeparatorClass, className)}
      {...props}
    />
  );
}

/** Trailing keyboard hint inside a custom row. */
export const DropdownMenuShortcut = MenuShortcut;
