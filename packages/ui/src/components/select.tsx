"use client";

import { Select as RadixSelect } from "radix-ui";
import { RiArrowDownSLine, RiArrowUpSLine, RiCheckLine, RiExpandUpDownLine } from "@remixicon/react";
import { createContext, useContext, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { useField } from "./field";
import { inputAdornmentClass, type ControlSize } from "./input";

/**
 * LUC Select — choosing one value from a *known, finite* option set.
 *
 * Radix Select supplies the hard parts: the listbox/option ARIA model, typeahead,
 * roving focus, portal collision handling, scroll buttons and the `aria-activedescendant`
 * contract. LUC supplies the trigger (identical chrome to `Input`), the menu
 * surface, the row rhythm and the selection indicator.
 *
 * Select is not a search box and not a command palette:
 *   Select     → pick one of a handful of known options
 *   Combobox   → search/filter, then pick
 *   CommandMenu→ *execute* something (navigate, run, toggle)
 * See AI_DESIGN_GUIDE.md §selection semantics.
 */

const SizeContext = createContext<ControlSize>("md");

/** Raw Radix root, for callers who do not want the LUC size context. */
export const SelectRoot = RadixSelect.Root;
export const SelectValue = RadixSelect.Value;
export const SelectGroup = RadixSelect.Group;
export const SelectSeparator = RadixSelect.Separator;

export interface SelectProps extends React.ComponentPropsWithRef<typeof RadixSelect.Root> {
  /** Control size, shared by the trigger and the menu. Default `md`. */
  size?: ControlSize;
}

/**
 * `Select` is the sized root: one `size` drives the trigger height, the type
 * scale and the menu rhythm, so a product never hand-tunes a dropdown.
 */
export function Select({ size = "md", children, ...props }: SelectProps) {
  return (
    <SizeContext.Provider value={size}>
      <RadixSelect.Root {...props}>{children}</RadixSelect.Root>
    </SizeContext.Provider>
  );
}

const triggerSize: Record<ControlSize, string> = {
  sm: "h-control-sm rounded-sm pl-2.5 pr-8 text-label",
  md: "h-control-md rounded-md pl-3 pr-8 text-label",
  lg: "h-control-lg rounded-md pl-3.5 pr-9 text-body",
};

export interface SelectTriggerProps extends React.ComponentPropsWithRef<typeof RadixSelect.Trigger> {
  size?: ControlSize;
  /** Leading icon or avatar. Decorative by default. */
  leadingIcon?: ReactNode;
  invalid?: boolean;
}

export function SelectTrigger({
  className,
  children,
  size,
  leadingIcon,
  invalid,
  disabled,
  id,
  ...props
}: SelectTriggerProps) {
  const contextSize = useContext(SizeContext);
  const field = useField();
  const resolved = size ?? contextSize;
  const isInvalid = invalid ?? field.invalid;

  return (
    <RadixSelect.Trigger
      data-slot="select-trigger"
      data-size={resolved}
      // A `<button>` is labelable, so the Field label binds to the trigger.
      id={id ?? field.id}
      disabled={disabled ?? field.disabled}
      aria-invalid={isInvalid || undefined}
      aria-describedby={props["aria-describedby"] ?? field.describedBy}
      className={cn(
        "group/select relative inline-flex w-full items-center gap-2",
        "border border-line-default bg-surface-sunken text-left text-fg-primary shadow-well",
        "luc-transition",
        "hover:border-line-strong hover:bg-surface-interactive hover:shadow-rest",
        /* Same focus language as Input, so a trigger and a text field sitting in
           one form row cannot disagree about what "focused" looks like. */
        "data-[state=open]:border-line-accent",
        "data-[state=open]:shadow-[var(--glow-focus),inset_0_1px_0_0_color-mix(in_oklab,var(--accent-default)_12%,transparent)]",
        "focus-visible:border-line-accent focus-visible:outline-none",
        "focus-visible:shadow-[var(--glow-focus),inset_0_1px_0_0_color-mix(in_oklab,var(--accent-default)_12%,transparent)]",
        // Placeholder text is real content to a screen reader and to axe, so it
        // uses a readable token rather than the disabled one.
        "data-[placeholder]:text-fg-muted",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-line-default disabled:hover:bg-surface-sunken",
        "aria-[invalid=true]:border-negative aria-[invalid=true]:shadow-[0_0_0_3px_var(--negative-soft)]",
        triggerSize[resolved],
        className,
      )}
      {...props}
    >
      {leadingIcon ? (
        <span
          aria-hidden="true"
          className={cn(
            inputAdornmentClass,
            "text-fg-muted group-data-[state=open]/select:text-fg-accent",
            resolved === "sm" ? "size-3.5" : resolved === "lg" ? "size-[18px]" : "size-4",
          )}
        >
          {leadingIcon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <RadixSelect.Icon asChild>
        <RiExpandUpDownLine
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-fg-muted luc-transition",
            "group-data-[state=open]/select:text-fg-accent",
            resolved === "sm" ? "size-3.5" : "size-4",
          )}
        />
      </RadixSelect.Icon>
    </RadixSelect.Trigger>
  );
}

export interface SelectContentProps extends React.ComponentPropsWithRef<typeof RadixSelect.Content> {
  size?: ControlSize;
}

export function SelectContent({
  className,
  children,
  size,
  position = "popper",
  sideOffset = 6,
  ...props
}: SelectContentProps) {
  const contextSize = useContext(SizeContext);
  const resolved = size ?? contextSize;

  return (
    <RadixSelect.Portal>
      <RadixSelect.Content
        data-slot="select-content"
        position={position}
        sideOffset={sideOffset}
        className={cn(
          "z-[var(--z-popover)] max-h-[min(20rem,var(--radix-select-content-available-height))]",
          "min-w-[var(--radix-select-trigger-width)] overflow-hidden",
          // An opaque elevated surface, like every other LUC information panel.
          "rounded-lg border border-line-default bg-surface-overlay text-fg-primary luc-float",
          "origin-[var(--radix-select-content-transform-origin)]",
          "data-[state=open]:animate-[luc-anchored-in_var(--motion-fast)_var(--ease-enter)]",
          "data-[state=closed]:animate-[luc-anchored-out_var(--motion-fast)_var(--ease-exit)]",
          className,
        )}
        {...props}
      >
        <RadixSelect.ScrollUpButton className="flex h-6 cursor-default items-center justify-center bg-surface-overlay text-fg-muted">
          <RiArrowUpSLine className="size-3.5" aria-hidden="true" />
        </RadixSelect.ScrollUpButton>
        <RadixSelect.Viewport className={cn("p-1 text-label", resolved === "sm" && "py-0.5")}>
          {children}
        </RadixSelect.Viewport>
        <RadixSelect.ScrollDownButton className="flex h-6 cursor-default items-center justify-center bg-surface-overlay text-fg-muted">
          <RiArrowDownSLine className="size-3.5" aria-hidden="true" />
        </RadixSelect.ScrollDownButton>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  );
}

export interface SelectItemProps extends React.ComponentPropsWithRef<typeof RadixSelect.Item> {
  /** Secondary line under the main label. */
  description?: ReactNode;
}

export function SelectItem({ className, children, description, ...props }: SelectItemProps) {
  return (
    <RadixSelect.Item
      data-slot="select-item"
      className={cn(
        "relative flex cursor-default select-none items-start gap-2 rounded-sm py-1.5 pr-2 pl-7",
        "text-fg-secondary outline-none luc-transition",
        "data-[highlighted]:bg-surface-interactive-hover data-[highlighted]:text-fg-primary",
        "data-[state=checked]:text-fg-primary",
        "data-[disabled]:pointer-events-none data-[disabled]:text-fg-disabled",
        className,
      )}
      {...props}
    >
      <span className="absolute left-1.5 top-[7px] grid size-4 place-items-center">
        <RadixSelect.ItemIndicator>
          <RiCheckLine aria-hidden="true" className="size-4 text-fg-accent" />
        </RadixSelect.ItemIndicator>
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
        {description ? <span className="text-caption text-fg-muted">{description}</span> : null}
      </span>
    </RadixSelect.Item>
  );
}

export function SelectLabel({ className, ...props }: React.ComponentPropsWithRef<typeof RadixSelect.Label>) {
  return (
    <RadixSelect.Label
      className={cn("px-2 pt-2 pb-1 text-micro font-medium text-fg-muted uppercase", className)}
      {...props}
    />
  );
}
