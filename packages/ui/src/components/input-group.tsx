import { cn } from "../utils/cn";

/**
 * LUC InputGroup — a field with leading/trailing addons.
 *
 * Every text control in the library already shares one shell
 * (`inputShellClass`), which is why a search icon, a currency prefix and a
 * unit suffix never line up differently in two components. This file exposes
 * that shell as a composition contract so a consumer can build the same field
 * without hand-writing the geometry:
 *
 *   <InputGroup>
 *     <InputGroupAddon>https://</InputGroupAddon>
 *     <InputGroupInput placeholder="example.com" />
 *     <InputGroupAddon align="end">.com</InputGroupAddon>
 *   </InputGroup>
 *
 * The addon is a real element with a hairline separator rather than a decorative
 * span, so it stays legible at 200% zoom and does not overlap the value.
 */

export interface InputGroupProps extends React.ComponentPropsWithRef<"div"> {
  size?: "sm" | "md" | "lg";
  invalid?: boolean;
  disabled?: boolean;
}

const sizeClass = {
  sm: "h-control-sm rounded-sm px-2.5 text-label",
  md: "h-control-md rounded-md px-3 text-label",
  lg: "h-control-lg rounded-md px-4 text-body",
} as const;

export function InputGroup({
  className,
  size = "md",
  invalid,
  disabled,
  children,
  ...props
}: InputGroupProps) {
  return (
    <div
      data-slot="input-group"
      data-size={size}
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
      className={cn(
        "group/input-group relative flex w-full items-center gap-2",
        "border border-line-default bg-surface-sunken text-fg-primary shadow-well luc-transition",
        "focus-within:border-line-accent",
        "focus-within:shadow-[var(--glow-focus),inset_0_1px_0_0_color-mix(in_oklab,var(--accent-default)_12%,transparent)]",
        "hover:border-line-strong hover:bg-surface-interactive hover:shadow-rest",
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:border-line-subtle has-[:disabled]:bg-surface-sunken has-[:disabled]:shadow-none",
        invalid && "border-negative shadow-[0_0_0_3px_var(--negative-soft)]",
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface InputGroupAddonProps extends React.ComponentPropsWithRef<"span"> {
  /** Which edge the addon sits on. Drives the separator direction. */
  align?: "start" | "end";
  /** Make the addon interactive — it becomes a real button-like target. */
  interactive?: boolean;
}

export function InputGroupAddon({
  className,
  align = "start",
  interactive = false,
  ...props
}: InputGroupAddonProps) {
  return (
    <span
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        "flex shrink-0 items-center gap-1.5 text-fg-muted",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        interactive && "cursor-pointer text-fg-secondary luc-transition hover:text-fg-primary",
        className,
      )}
      {...props}
    />
  );
}

export type InputGroupInputProps = React.ComponentPropsWithRef<"input">;

export function InputGroupInput({ className, ...props }: InputGroupInputProps) {
  return (
    <input
      data-slot="input-group-input"
      className={cn(
        "peer h-full w-full min-w-0 flex-1 bg-transparent text-inherit outline-none",
        "placeholder:text-fg-disabled disabled:cursor-not-allowed disabled:text-fg-disabled",
        className,
      )}
      {...props}
    />
  );
}

/** A hairline between the value and an adjacent element inside the shell. */
export function InputGroupSeparator({ className, ...props }: React.ComponentPropsWithRef<"span">) {
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      data-slot="input-group-separator"
      className={cn("my-1 w-px shrink-0 self-stretch bg-line-subtle", className)}
      {...props}
    />
  );
}
