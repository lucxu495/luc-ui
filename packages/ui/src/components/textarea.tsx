"use client";

import { cn } from "../utils/cn";
import { useField } from "./field";
import { inputElementClass, inputShellClass, type ControlSize } from "./input";

const sizeClass: Record<ControlSize, string> = {
  sm: "min-h-16 rounded-sm px-2 py-1.5 text-label",
  md: "min-h-20 rounded-md px-2.5 py-2 text-label",
  lg: "min-h-24 rounded-md px-3 py-2.5 text-body",
};

export interface TextareaProps extends React.ComponentPropsWithRef<"textarea"> {
  size?: ControlSize;
  invalid?: boolean;
  /**
   * Grow with content instead of scrolling. Uses `field-sizing: content` where
   * supported and falls back to a comfortable fixed minimum height.
   */
  autoResize?: boolean;
}

export function Textarea({
  className,
  size = "md",
  invalid,
  autoResize = false,
  id,
  required,
  disabled,
  readOnly,
  rows = 4,
  ...props
}: TextareaProps) {
  const field = useField();
  const isInvalid = invalid ?? field.invalid;
  return (
    <div className={cn(inputShellClass, "items-start", sizeClass[size], className)} data-size={size}>
      <textarea
        data-slot="textarea"
        id={id ?? field.id}
        rows={rows}
        required={required ?? field.required}
        disabled={disabled ?? field.disabled}
        readOnly={readOnly ?? field.readOnly}
        aria-busy={field.busy || undefined}
        aria-invalid={isInvalid || undefined}
        aria-describedby={props["aria-describedby"] ?? field.describedBy}
        className={cn(
          inputElementClass,
          "luc-transition resize-y py-0 leading-[1.55]",
          autoResize && "[field-sizing:content] resize-none",
        )}
        {...props}
      />
    </div>
  );
}
