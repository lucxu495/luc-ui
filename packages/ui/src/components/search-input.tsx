"use client";

import { RiSearchLine } from "@remixicon/react";
import { useRef, useState } from "react";
import { cn } from "../utils/cn";
import { Input, type InputProps } from "./input";

export interface SearchInputProps extends Omit<InputProps, "leadingIcon" | "trailingAction" | "type"> {
  /** Fires on every keystroke (controlled-ish convenience). */
  onValueChange?: (value: string) => void;
  /** Show a clear button when the field has content. Default `true`. */
  clearable?: boolean;
  /**
   * Accessible name for the clear button. The default is English; a product in
   * another language passes its own string instead of forking the component.
   */
  clearLabel?: string;
}

/**
 * Search field with a clear affordance. The clear button is a real button so
 * keyboard users can reach it, and it restores focus to the field.
 */
export function SearchInput({
  className,
  onValueChange,
  clearable = true,
  clearLabel = "Clear search",
  value,
  defaultValue,
  onChange,
  ref,
  ...props
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");
  const currentValue = value ?? uncontrolledValue;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (value === undefined) setUncontrolledValue(event.target.value);
    onChange?.(event);
    onValueChange?.(event.target.value);
  };

  const clear = () => {
    const input = inputRef.current;
    if (value === undefined) setUncontrolledValue("");
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    if (input && nativeInputValueSetter) {
      nativeInputValueSetter.call(input, "");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    input?.focus();
  };

  // An unlabelled search box is an accessibility defect; fall back to a
  // placeholder-derived name only when the caller gave us nothing better.
  const ariaLabel =
    props["aria-label"] ??
    (typeof props.placeholder === "string" && props.placeholder.length > 0
      ? props.placeholder
      : "Search");

  return (
    <Input
      ref={(node) => {
        inputRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      type="search"
      inputMode="search"
      autoComplete="off"
      spellCheck={false}
      aria-label={ariaLabel}
      value={value}
      defaultValue={defaultValue}
      onChange={handleChange}
      leadingIcon={<RiSearchLine />}
      trailingAction={
        clearable && String(currentValue).length > 0 ? (
          <button
            type="button"
            aria-label={clearLabel}
            onClick={clear}
            className={cn(
              /*
               * 24×24 (`luc-hit`) and `fg-muted`: the same target-size floor and
               * the same "an enabled control is never painted with the disabled
               * token" rule the Combobox clear button follows.
               */
              "luc-transition luc-hit grid size-5 place-items-center rounded-xs text-fg-muted",
              "hover:bg-surface-interactive-hover hover:text-fg-primary luc-focus",
            )}
          >
            <svg viewBox="0 0 16 16" className="size-3" aria-hidden="true">
              <path d="M4.5 4.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        ) : null
      }
      className={className}
      {...props}
    />
  );
}
