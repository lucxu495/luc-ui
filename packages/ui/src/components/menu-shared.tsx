"use client";

import { cloneElement, isValidElement, type ReactNode } from "react";
import { cn } from "../utils/cn";

/**
 * The shared menu surface.
 *
 * `DropdownMenu` and `ContextMenu` are two triggers for one menu language, so
 * the surface, the row rhythm and the state treatment live here and the two
 * families only differ in how they are opened. Nothing in this file is public:
 * consumers import `DropdownMenu*` or `ContextMenu*`.
 *
 * The surface follows V0.3's overlay readability rule — an effectively opaque
 * `surface-overlay` with a hairline border and the restrained `shadow-overlay`,
 * never a translucent menu over chart noise.
 */
export const menuContentClass = cn(
  "z-[var(--z-popover)] min-w-[10rem] overflow-hidden rounded-lg border border-line-default bg-surface-overlay p-1 text-fg-primary luc-float",
  "data-[state=open]:animate-[luc-anchored-in_var(--motion-fast)_var(--ease-enter)]",
  "data-[state=closed]:animate-[luc-anchored-out_var(--motion-fast)_var(--ease-exit)]",
);

export type MenuItemVariant = "default" | "destructive";

/**
 * One row. `inset` aligns a row that has no leading indicator with rows that
 * do — the classic menu alignment problem, solved once.
 */
export function menuItemClass({ variant = "default", inset = false }: { variant?: MenuItemVariant; inset?: boolean } = {}) {
  return cn(
    "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-label outline-none luc-transition",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    /*
     * A row answers the pointer the way every other layer does: it steps up the
     * surface stack and takes the next shadow rung, and it sinks while held.
     * `highlighted` is Radix's roving-focus state, so a keyboard user sees the
     * identical depth a mouse user does.
     */
    "data-[highlighted]:bg-surface-interactive-hover data-[highlighted]:text-fg-primary data-[highlighted]:shadow-xs",
    "active:bg-surface-interactive-active active:shadow-none",
    "data-[disabled]:pointer-events-none data-[disabled]:text-fg-disabled",
    variant === "destructive"
      ? "text-fg-negative data-[highlighted]:bg-negative-soft data-[highlighted]:text-fg-negative"
      : "text-fg-secondary",
    inset && "pl-8",
  );
}

export const menuLabelClass = (inset = false) =>
  cn("px-2 pt-1.5 pb-1 text-micro font-medium text-fg-muted uppercase", inset && "pl-8");

export const menuSeparatorClass = "-mx-1 my-1 h-px bg-line-subtle";

/** The trailing keyboard hint. Purely presentational — never the trigger's name. */
export function MenuShortcut({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      data-slot="menu-shortcut"
      className={cn("ml-auto pl-4 font-mono text-micro text-fg-muted", className)}
    >
      {children}
    </span>
  );
}

/**
 * The children one menu row hands to its Radix `Item`.
 *
 * Always **one** value. Radix's `asChild` uses `Slot`, which demands exactly one
 * child element (`React.Children.count(children) === 1`); a row that appended a
 * conditional sibling — `{children}{shortcut ? … : null}` — was therefore two
 * children even with no shortcut, and `asChild` threw
 * "Primitive.div failed to slot onto its children". Luc Web hit it on the locale
 * switch, where each item is a `<Link asChild>`: opening the menu took the whole
 * page to the error boundary.
 *
 * A shortcut is therefore never a *sibling*: without `asChild` the row is one
 * fragment, and with `asChild` the hint is cloned **into** the caller's child
 * (which `Slot` then merges the row's own props onto). Either way the count is
 * one, and the element the caller wrote stays the element that renders.
 */
export function withTrailing(children: ReactNode, trailing: ReactNode, asChild = false): ReactNode {
  if (trailing === null || trailing === undefined || trailing === false) return children;
  if (asChild && isValidElement(children)) {
    const element = children as React.ReactElement<{ children?: ReactNode }>;
    return cloneElement(element, undefined, element.props.children, trailing);
  }
  return (
    <>
      {children}
      {trailing}
    </>
  );
}

/** A row's own children plus its optional trailing shortcut hint. */
export function menuRowChildren(
  children: ReactNode,
  shortcut: ReactNode,
  asChild = false,
): ReactNode {
  const hint =
    shortcut === null || shortcut === undefined || shortcut === false ? null : (
      <MenuShortcut>{shortcut}</MenuShortcut>
    );
  return withTrailing(children, hint, asChild);
}

/**
 * The leading slot for a checkbox or radio row. The indicator element is the
 * consumer's `ItemIndicator`; this is only its box, so both menus align.
 */
export function menuIndicatorClass(className?: string) {
  return cn(
    "pointer-events-none absolute left-2 grid size-4 place-items-center text-fg-accent",
    className,
  );
}
