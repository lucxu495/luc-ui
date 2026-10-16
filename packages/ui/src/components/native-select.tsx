"use client";

import { RiArrowDownSLine } from "@remixicon/react";
import { cn } from "../utils/cn";
import { useField } from "./field";
import { inputShellClass } from "./input";

/**
 * LUC NativeSelect — the platform's own picker.
 *
 * `Select` is the right control nine times out of ten: it is searchable,
 * consistent and fully themeable. The tenth time is a mobile form, where the
 * native picker is a full-screen wheel the user already knows, with the right
 * keyboard for the locale — and a custom popup on a 360px screen is worse than
 * either.
 *
 * The element is a real `<select>`, so keyboard behaviour, autofill, form
 * submission and `required` validation come from the browser. LUC supplies the
 * chrome (the same shell as every other field) and hides the default arrow.
 *
 * It also reads the surrounding `Field`, exactly as `Input` and `Textarea` do.
 * It did not until Phase 8: a `NativeSelect` inside a labelled `Field` rendered
 * an unnamed `<select>` — the label was on screen, the accessible name was not
 * there — and nothing caught it until a product page put one in a form and an
 * axe scan over the *page* reported `select-name` (critical) rather than the
 * component's own story passing. Sharing the field's id is what makes
 * `htmlFor` name the control.
 */

export interface NativeSelectProps
  extends Omit<React.ComponentPropsWithRef<"select">, "size"> {
  size?: "sm" | "md" | "lg";
  invalid?: boolean;
  /** Options as data — or pass `<option>` children, both work. */
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  /** Rendered as an empty, disabled first option. */
  placeholder?: string;
}

const sizeClass = {
  sm: "h-control-sm rounded-sm px-2.5 text-label",
  md: "h-control-md rounded-md px-3 text-label",
  lg: "h-control-lg rounded-md px-4 text-body",
} as const;

export function NativeSelect({
  className,
  size = "md",
  invalid,
  options,
  placeholder,
  id,
  disabled,
  required,
  "aria-describedby": ariaDescribedBy,
  children,
  ...props
}: NativeSelectProps) {
  const field = useField();
  return (
    <div className={cn(inputShellClass, sizeClass[size], "pr-8", className)} data-size={size}>
      <select
        id={id ?? field.id}
        data-slot="native-select"
        disabled={disabled ?? field.disabled}
        required={required ?? field.required}
        aria-invalid={(invalid ?? field.invalid) || undefined}
        aria-describedby={ariaDescribedBy ?? field.describedBy}
        className={cn(
          "peer h-full w-full appearance-none bg-transparent text-inherit outline-none",
          "disabled:cursor-not-allowed disabled:text-fg-disabled",
          "[&>option]:bg-surface-overlay [&>option]:text-fg-primary",
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options?.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
      <RiArrowDownSLine
        aria-hidden="true"
        className="pointer-events-none absolute end-2.5 size-4 text-fg-muted"
      />
    </div>
  );
}
