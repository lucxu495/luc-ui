"use client";

import {
  OTPInput,
  REGEXP_ONLY_CHARS,
  REGEXP_ONLY_DIGITS,
  REGEXP_ONLY_DIGITS_AND_CHARS,
  type RenderProps,
} from "input-otp";
import { useState } from "react";
import { useField } from "../../components/field";
import type { ControlSize } from "../../components/input";
import { cn } from "../../utils/cn";

/**
 * LUC OtpInput — one code, one control.
 *
 * `input-otp` owns the hard parts: a single real `<input autocapitalize=off
 * autocomplete="one-time-code">` behind the slots, paste of a whole code,
 * backspace across the boundary, arrow-key navigation, and password-manager
 * behaviour. LUC owns the slots, the sizes and the direction.
 *
 * No authentication logic exists here — the component reports a string.
 */

export type OtpMode = "numeric" | "alphanumeric" | "alpha";

const MODE_PATTERN: Record<OtpMode, string> = {
  numeric: REGEXP_ONLY_DIGITS,
  alphanumeric: REGEXP_ONLY_DIGITS_AND_CHARS,
  alpha: REGEXP_ONLY_CHARS,
};

export interface OtpInputProps {
  /** Number of characters. */
  length?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Fired when every slot is filled. */
  onComplete?: (value: string) => void;
  mode?: OtpMode;
  size?: ControlSize;
  invalid?: boolean;
  disabled?: boolean;
  /** Groups the slots visually, e.g. `3` renders 3+3 for a six-digit code. */
  groups?: number[];
  /** Accessible name. A code field is usually labelled by its `<Field>`. */
  "aria-label"?: string;
  id?: string;
  name?: string;
  className?: string;
}

const slotSize: Record<ControlSize, string> = {
  sm: "h-control-sm w-7 rounded-sm text-label",
  md: "h-control-md w-9 rounded-md text-body",
  lg: "h-control-lg w-11 rounded-md text-title",
};

function Slot({
  char,
  isActive,
  hasFakeCaret,
  size,
  disabled,
  invalid,
}: {
  char: string | null;
  isActive: boolean;
  hasFakeCaret: boolean;
  size: ControlSize;
  disabled: boolean;
  invalid: boolean;
}) {
  return (
    <div
      data-slot="otp-slot"
      data-active={isActive || undefined}
      data-filled={Boolean(char) || undefined}
      className={cn(
        "relative grid place-items-center border bg-surface-sunken",
        "border-line-default text-fg-primary shadow-xs luc-transition luc-numeric",
        "data-[filled]:bg-surface-default",
        "data-[active]:border-line-accent data-[active]:shadow-[var(--glow-focus)]",
        invalid && "border-negative shadow-[0_0_0_3px_var(--negative-soft)]",
        disabled && "cursor-not-allowed opacity-60",
        slotSize[size],
      )}
    >
      {char ? <span>{char}</span> : null}
      {hasFakeCaret && isActive && !disabled ? (
        <span
          aria-hidden="true"
          data-motion-essential
          className={cn(
            "pointer-events-none absolute h-4 w-px bg-fg-accent",
            "motion-safe:animate-[luc-pulse-soft_1.1s_ease-in-out_infinite]",
          )}
        />
      ) : null}
    </div>
  );
}

/**
 * The OTP control. It renders real, individually visible slots on top of one
 * hidden input, so screen readers hear a single "one-time code" field rather
 * than six unlabelled boxes.
 */
export function OtpInput({
  length = 6,
  value,
  defaultValue,
  onValueChange,
  onComplete,
  mode = "numeric",
  size = "md",
  invalid,
  disabled,
  groups,
  className,
  id,
  name,
  ...props
}: OtpInputProps) {
  const field = useField();
  const isInvalid = invalid ?? field.invalid;
  const groupSize = groups ?? [length];

  /*
   * LUC owns the uncontrolled value rather than delegating it.
   *
   * `input-otp` reads `defaultValue` to seed its state and then spreads every
   * remaining prop onto the real `<input>` while setting `value` itself — which
   * makes React warn about an input with both, on every uncontrolled LUC field.
   * Keeping the initial value here means the underlying input is simply
   * controlled, and the component's public behaviour is unchanged.
   */
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  const current = value ?? uncontrolled;

  const renderSlots = (renderProps: RenderProps) => {
    let cursor = 0;
    return (
      <div className="flex items-center gap-2">
        {groupSize.map((groupLength, groupIndex) => {
          const group = renderProps.slots.slice(cursor, cursor + groupLength);
          cursor += groupLength;
          return (
            <div key={groupIndex} className="flex items-center gap-1.5">
              {group.map((slot, slotIndex) => (
                <Slot
                  // The slot index is part of the key: two empty slots in the
                  // same group share a character, and would otherwise collide.
                  key={`${groupIndex}-${slotIndex}`}
                  char={slot.char}
                  isActive={slot.isActive}
                  hasFakeCaret={slot.hasFakeCaret}
                  size={size}
                  disabled={Boolean(disabled ?? field.disabled)}
                  invalid={isInvalid}
                />
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <OTPInput
      data-slot="otp-input"
      maxLength={length}
      value={current}
      onChange={(next) => {
        if (value === undefined) setUncontrolled(next);
        onValueChange?.(next);
      }}
      onComplete={onComplete}
      pattern={MODE_PATTERN[mode]}
      inputMode={mode === "numeric" ? "numeric" : "text"}
      disabled={disabled ?? field.disabled}
      id={id ?? field.id}
      name={name}
      aria-label={props["aria-label"]}
      aria-invalid={isInvalid || undefined}
      aria-describedby={field.describedBy}
      autoComplete="one-time-code"
      containerClassName={cn("group/otp flex items-center", className)}
      render={renderSlots}
    />
  );
}
