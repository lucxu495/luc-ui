"use client";

import { ContextMenu as RadixContextMenu } from "radix-ui";
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

// LUC ContextMenu — the same actions as a DropdownMenu, attached to a target.
//
// Radix supplies the pointer gesture, the keyboard path (Shift+F10 and the
// context-menu key), typeahead, submenu intent and focus restore. The visual
// language is shared with DropdownMenu through `menu-shared.tsx`, so the two
// families can never drift apart.

export const ContextMenu = RadixContextMenu.Root;
export const ContextMenuTrigger = RadixContextMenu.Trigger;
export const ContextMenuGroup = RadixContextMenu.Group;
export const ContextMenuRadioGroup = RadixContextMenu.RadioGroup;
export const ContextMenuSub = RadixContextMenu.Sub;
export const ContextMenuPortal = RadixContextMenu.Portal;

export type ContextMenuContentProps = React.ComponentPropsWithRef<typeof RadixContextMenu.Content>;

export function ContextMenuContent({ className, ...props }: ContextMenuContentProps) {
  return (
    <RadixContextMenu.Portal>
      <RadixContextMenu.Content
        data-slot="context-menu-content"
        className={cn(menuContentClass, className)}
        {...props}
      />
    </RadixContextMenu.Portal>
  );
}

export type ContextMenuSubContentProps = React.ComponentPropsWithRef<typeof RadixContextMenu.SubContent>;

export function ContextMenuSubContent({ className, ...props }: ContextMenuSubContentProps) {
  return (
    <RadixContextMenu.Portal>
      <RadixContextMenu.SubContent
        data-slot="context-menu-sub-content"
        className={cn(menuContentClass, className)}
        {...props}
      />
    </RadixContextMenu.Portal>
  );
}

export interface ContextMenuItemProps
  extends React.ComponentPropsWithRef<typeof RadixContextMenu.Item> {
  variant?: MenuItemVariant;
  inset?: boolean;
  shortcut?: React.ReactNode;
}

export function ContextMenuItem({
  className,
  variant,
  inset,
  shortcut,
  asChild,
  children,
  ...props
}: ContextMenuItemProps) {
  return (
    <RadixContextMenu.Item
      data-slot="context-menu-item"
      className={cn(menuItemClass({ variant, inset }), className)}
      asChild={asChild}
      {...props}
    >
      {menuRowChildren(children, shortcut, asChild)}
    </RadixContextMenu.Item>
  );
}

export interface ContextMenuCheckboxItemProps
  extends React.ComponentPropsWithRef<typeof RadixContextMenu.CheckboxItem> {
  shortcut?: React.ReactNode;
}

export function ContextMenuCheckboxItem({
  className,
  children,
  shortcut,
  ...props
}: ContextMenuCheckboxItemProps) {
  return (
    <RadixContextMenu.CheckboxItem
      data-slot="context-menu-checkbox-item"
      className={cn(menuItemClass(), "pl-8", className)}
      {...props}
    >
      <RadixContextMenu.ItemIndicator className={menuIndicatorClass()}>
        <RiCheckLine aria-hidden="true" />
      </RadixContextMenu.ItemIndicator>
      {menuRowChildren(children, shortcut)}
    </RadixContextMenu.CheckboxItem>
  );
}

export interface ContextMenuRadioItemProps
  extends React.ComponentPropsWithRef<typeof RadixContextMenu.RadioItem> {
  shortcut?: React.ReactNode;
}

export function ContextMenuRadioItem({
  className,
  children,
  shortcut,
  ...props
}: ContextMenuRadioItemProps) {
  return (
    <RadixContextMenu.RadioItem
      data-slot="context-menu-radio-item"
      className={cn(menuItemClass(), "pl-8", className)}
      {...props}
    >
      <RadixContextMenu.ItemIndicator className={menuIndicatorClass()}>
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      </RadixContextMenu.ItemIndicator>
      {menuRowChildren(children, shortcut)}
    </RadixContextMenu.RadioItem>
  );
}

export interface ContextMenuSubTriggerProps
  extends React.ComponentPropsWithRef<typeof RadixContextMenu.SubTrigger> {
  inset?: boolean;
}

export function ContextMenuSubTrigger({
  className,
  inset,
  asChild,
  children,
  ...props
}: ContextMenuSubTriggerProps) {
  return (
    <RadixContextMenu.SubTrigger
      data-slot="context-menu-sub-trigger"
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
    </RadixContextMenu.SubTrigger>
  );
}

export interface ContextMenuLabelProps
  extends React.ComponentPropsWithRef<typeof RadixContextMenu.Label> {
  inset?: boolean;
}

export function ContextMenuLabel({ className, inset = true, ...props }: ContextMenuLabelProps) {
  return (
    <RadixContextMenu.Label
      data-slot="context-menu-label"
      className={cn(menuLabelClass(inset), className)}
      {...props}
    />
  );
}

export function ContextMenuSeparator({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof RadixContextMenu.Separator>) {
  return (
    <RadixContextMenu.Separator
      data-slot="context-menu-separator"
      className={cn(menuSeparatorClass, className)}
      {...props}
    />
  );
}

/** Trailing keyboard hint inside a custom row. */
export const ContextMenuShortcut = MenuShortcut;
