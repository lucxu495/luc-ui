"use client";

import { Command as CmdkCommand, CommandDialog as CmdkCommandDialog, useCommandState } from "cmdk";
import { Dialog as RadixDialog } from "radix-ui";
import { RiSearchLine } from "@remixicon/react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { cn } from "../utils/cn";

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

export type CommandProps = React.ComponentPropsWithRef<typeof CmdkCommand>;

export function Command({ className, label = "Command menu", loop = true, ...props }: CommandProps) {
  return (
    <CmdkCommand
      label={label}
      loop={loop}
      className={cn("flex h-full w-full flex-col overflow-hidden", className)}
      {...props}
    />
  );
}

export type CommandInputProps = React.ComponentPropsWithRef<typeof CmdkCommand.Input>;

export function CommandInput({ className, ...props }: CommandInputProps) {
  return (
    <div className="flex items-center gap-2.5 border-b border-line-subtle px-4" cmdk-input-wrapper="">
      <RiSearchLine aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
      <CmdkCommand.Input
        data-slot="command-input"
        className={cn(
          "h-12 w-full bg-transparent text-body text-fg-primary outline-none",
          "placeholder:text-fg-disabled",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export type CommandListProps = React.ComponentPropsWithRef<typeof CmdkCommand.List>;

export function CommandList({ className, ...props }: CommandListProps) {
  return (
    <CmdkCommand.List
      data-slot="command-list"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5",
        "max-h-[min(24rem,60vh)]",
        className,
      )}
      {...props}
    />
  );
}

export function CommandGroup({
  className,
  heading,
  ...props
}: React.ComponentPropsWithRef<typeof CmdkCommand.Group>) {
  return (
    <CmdkCommand.Group
      heading={heading}
      className={cn(
        "text-fg-primary",
        "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1",
        "[&_[cmdk-group-heading]]:text-micro [&_[cmdk-group-heading]]:font-medium",
        "[&_[cmdk-group-heading]]:text-fg-muted [&_[cmdk-group-heading]]:uppercase",
        className,
      )}
      {...props}
    />
  );
}

export interface CommandItemProps extends React.ComponentPropsWithRef<typeof CmdkCommand.Item> {
  /** Leading icon. Decorative — the label carries the meaning. */
  icon?: ReactNode;
  /** Trailing keyboard hint, e.g. `"⌘K"`. */
  shortcut?: ReactNode;
  /** Optional secondary line. */
  description?: ReactNode;
}

export function CommandItem({
  className,
  children,
  icon,
  shortcut,
  description,
  ...props
}: CommandItemProps) {
  return (
    <CmdkCommand.Item
      data-slot="command-item"
      className={cn(
        "group/item flex cursor-default select-none items-center gap-2.5 rounded-sm px-2 py-2",
        "text-label text-fg-secondary outline-none luc-transition",
        "data-[selected=true]:bg-surface-interactive-hover data-[selected=true]:text-fg-primary",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:text-fg-disabled",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className="grid size-4 shrink-0 place-items-center text-fg-muted group-data-[selected=true]/item:text-fg-accent [&_svg]:size-4"
        >
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate">{children}</span>
        {description ? <span className="truncate text-caption text-fg-muted">{description}</span> : null}
      </span>
      {shortcut ? (
        <kbd className="ml-3 shrink-0 rounded-xs border border-line-subtle bg-surface-sunken px-1.5 py-0.5 font-mono text-micro text-fg-muted">
          {shortcut}
        </kbd>
      ) : null}
    </CmdkCommand.Item>
  );
}

export function CommandSeparator({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof CmdkCommand.Separator>) {
  return <CmdkCommand.Separator className={cn("mx-1 my-1 h-px bg-line-subtle", className)} {...props} />;
}

export function CommandEmpty({
  className,
  children = "No results found",
  ...props
}: React.ComponentPropsWithRef<typeof CmdkCommand.Empty>) {
  return (
    <CmdkCommand.Empty
      className={cn("px-3 py-6 text-center text-caption text-fg-muted", className)}
      {...props}
    >
      {children}
    </CmdkCommand.Empty>
  );
}

export function CommandLoading({
  className,
  children = "Loading…",
  ...props
}: React.ComponentPropsWithRef<typeof CmdkCommand.Loading>) {
  return (
    <CmdkCommand.Loading className={cn("px-3 py-6 text-center text-caption text-fg-muted", className)} {...props}>
      {children}
    </CmdkCommand.Loading>
  );
}

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
export function CommandMenu({
  open,
  onOpenChange,
  children,
  label = "Command menu",
  description,
  footer,
  className,
}: CommandMenuProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay
          data-slot="command-overlay"
          className={cn(
            "fixed inset-0 z-[var(--z-overlay)] bg-surface-scrim backdrop-blur-[2px]",
            "data-[state=open]:animate-[luc-scrim-in_var(--motion-fast)_var(--ease-enter)]",
            "data-[state=closed]:animate-[luc-scrim-out_var(--motion-fast)_var(--ease-exit)]",
          )}
        />
        <RadixDialog.Content
          data-slot="command-menu"
          aria-label={label}
          className={cn(
            "fixed top-[12vh] left-1/2 z-[var(--z-modal)] w-[min(38rem,calc(100vw-2rem))] -translate-x-1/2",
            "overflow-hidden rounded-xl border border-line-default bg-surface-overlay luc-float-high",
            "focus:outline-none",
            "data-[state=open]:animate-[luc-overlay-in_var(--motion-fast)_var(--ease-enter)]",
            "data-[state=closed]:animate-[luc-overlay-out_var(--motion-fast)_var(--ease-exit)]",
            className,
          )}
        >
          <RadixDialog.Title className="sr-only">{label}</RadixDialog.Title>
          {description ? (
            <p className="border-b border-line-subtle px-4 py-2 text-caption text-fg-muted">{description}</p>
          ) : null}
          {children}
          {footer ? (
            <div className="flex items-center justify-between gap-3 border-t border-line-subtle bg-surface-raised/40 px-4 py-2 text-caption text-fg-muted">
              {footer}
            </div>
          ) : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export { useCommandState, CmdkCommandDialog as CommandDialog };

/**
 * Nested pages inside one palette (root → sub-page → back), the pattern cmdk
 * documents: keep a page stack, clear the search on navigation, and pop with
 * Backspace when the field is empty.
 */
export function useCommandPages() {
  const [pages, setPages] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const page = pages[pages.length - 1];

  const push = useCallback((next: string) => {
    setPages((current) => [...current, next]);
    setSearch("");
  }, []);

  const pop = useCallback(() => {
    setPages((current) => current.slice(0, -1));
    setSearch("");
  }, []);

  const reset = useCallback(() => {
    setPages([]);
    setSearch("");
  }, []);

  /** Spread onto `<Command onKeyDown={…}>`. */
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Backspace" && search.length === 0 && pages.length > 0) {
        event.preventDefault();
        pop();
      }
    },
    [pages.length, pop, search.length],
  );

  return { pages, page, search, setSearch, push, pop, reset, onKeyDown };
}

/**
 * ⌘K / Ctrl+K. Deliberately tiny — a hotkey is 20 lines, not a dependency.
 * The Showcase uses this; products may wire their own global handler instead.
 */
export function useCommandHotkey(onOpen: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const isK = event.key === "k" || event.key === "K";
      if (isK && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpen();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled, onOpen]);
}
