"use client";

import { NumberField, Input as RacInput, Button as RacButton } from "react-aria-components";
import type { ReactNode } from "react";
import { useField } from "../../components/field";
import { inputShellClass, type ControlSize } from "../../components/input";
import { LocaleProvider } from "../../providers/locale-provider";
import { cn } from "../../utils/cn";

/**
 * LUC NumberInput.
 *
 * Behaviour comes from React Aria's `NumberField`: locale-aware parsing and
 * formatting, caret-safe editing, arrow-key steps, `Home`/`End` and a real
 * spinbutton role. LUC owns the shell, the stepper chrome and the unit contract.
 *
 * The value is always a plain JS number in the *canonical* unit — never a
 * formatted string. `formatOptions` changes presentation only.
 */

export interface NumberInputProps {
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  /** Called on blur; convenient for engines that validate on touch. */
  onBlur?: () => void;
  min?: number;
  max?: number;
  /**
   * Step grid. Omit it and the field keeps the value you gave it — the steppers
   * still move by React Aria's default (1, or 0.01 for a percentage). Set a
   * step only when the domain really is a grid, because a step also *snaps* a
   * typed value onto that grid on blur.
   */
  step?: number;
  /** `Intl.NumberFormatOptions`. Use `CurrencyInput`/`PercentageInput` presets. */
  formatOptions?: Intl.NumberFormatOptions;
  /** Convenience for `minimumFractionDigits` + `maximumFractionDigits`. */
  decimals?: number;
  /** BCP-47 locale. Inherits the surrounding locale when omitted. */
  locale?: string;
  size?: ControlSize;
  /** Text or glyph shown after the value. Presentation only, never in the value. */
  unit?: ReactNode;
  leadingIcon?: ReactNode;
  /** Chevron steppers. Keyboard and screen readers work either way. */
  steppers?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  placeholder?: string;
  name?: string;
  id?: string;
  /** Scroll-wheel editing is off by default; a page should not edit itself. */
  isWheelDisabled?: boolean;
  /** `snap` clamps to min/max/step on blur, which is React Aria's default. */
  commitBehavior?: "snap" | "validate";
  className?: string;
  inputClassName?: string;
  incrementAriaLabel?: string;
  decrementAriaLabel?: string;
  "aria-label"?: string;
}

const sizeClass: Record<ControlSize, string> = {
  sm: "h-control-sm rounded-sm text-label",
  md: "h-control-md rounded-md text-label",
  lg: "h-control-lg rounded-md text-body",
};

const stepperBtnClass = cn(
  "grid h-full w-6 shrink-0 place-items-center text-fg-muted luc-transition",
  "hover:bg-surface-interactive-hover hover:text-fg-primary",
  "disabled:pointer-events-none disabled:opacity-40",
  "focus-visible:bg-surface-interactive-hover focus-visible:text-fg-primary focus-visible:outline-none",
  "[&_svg]:size-3.5",
);

/**
 * The base number control. `CurrencyInput` and `PercentageInput` are the two
 * unit contracts products ask for most; both are built on this one.
 */
export function NumberInput({
  value,
  defaultValue,
  onValueChange,
  onBlur,
  min,
  max,
  step,
  formatOptions,
  decimals,
  locale,
  size = "md",
  unit,
  leadingIcon,
  steppers = true,
  invalid,
  disabled,
  readOnly,
  required,
  placeholder,
  name,
  id,
  isWheelDisabled = true,
  commitBehavior = "snap",
  className,
  inputClassName,
  incrementAriaLabel,
  decrementAriaLabel,
  ...props
}: NumberInputProps) {
  const field = useField();
  const isInvalid = invalid ?? field.invalid;
  const resolvedFormat: Intl.NumberFormatOptions | undefined =
    decimals === undefined
      ? formatOptions
      : {
          ...formatOptions,
          minimumFractionDigits: formatOptions?.minimumFractionDigits ?? decimals,
          maximumFractionDigits: formatOptions?.maximumFractionDigits ?? decimals,
        };

  return (
    <LocaleProvider locale={locale}>
      <NumberField
        data-slot="number-input"
      data-size={size}
        value={value ?? undefined}
        defaultValue={defaultValue ?? undefined}
        onChange={(next) => onValueChange?.(Number.isNaN(next) ? null : next)}
        onBlur={onBlur}
        minValue={min}
        maxValue={max}
      step={step}
        formatOptions={resolvedFormat}
        isInvalid={isInvalid}
        isDisabled={disabled ?? field.disabled}
        isReadOnly={readOnly ?? field.readOnly}
        isRequired={required ?? field.required}
        isWheelDisabled={isWheelDisabled}
        commitBehavior={commitBehavior}
        name={name}
        id={id ?? field.id}
        aria-label={props["aria-label"]}
        aria-describedby={field.describedBy}
        aria-labelledby={field.labelId}
        incrementAriaLabel={incrementAriaLabel}
        decrementAriaLabel={decrementAriaLabel}
        className={cn(inputShellClass, sizeClass[size], "overflow-hidden p-0", className)}
      >
      {leadingIcon ? (
        <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center pl-2.5 text-fg-muted">
          {leadingIcon}
        </span>
      ) : null}
      {steppers ? (
        <RacButton slot="decrement" className={cn(stepperBtnClass, "border-r border-line-subtle")}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        </RacButton>
      ) : null}
      <RacInput
        data-slot="number-input-element"
        // `placeholder` belongs to the input element, not the field wrapper —
        // React Aria omits it from NumberField's own props.
        placeholder={placeholder}
        className={cn(
          "w-full min-w-0 bg-transparent px-2.5 text-right text-fg-primary outline-none",
          "luc-numeric placeholder:text-fg-muted",
          inputClassName,
        )}
      />
      {unit ? (
        <span aria-hidden="true" className="shrink-0 pr-2.5 text-caption text-fg-muted">
          {unit}
        </span>
      ) : null}
      {steppers ? (
        <RacButton slot="increment" className={cn(stepperBtnClass, "border-l border-line-subtle")}>
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        </RacButton>
      ) : null}
      </NumberField>
    </LocaleProvider>
  );
}

export interface CurrencyInputProps extends Omit<NumberInputProps, "formatOptions" | "unit"> {
  /** ISO-4217 code. The component makes no assumption about which one. */
  currency: string;
  /** Fraction digits. Defaults to 2 — a currency field that hides cents is a bug. */
  decimals?: number;
}

/**
 * A number field bound to a currency *format*, not to a currency *policy*.
 * The value is the major unit as a plain number (`1234.5` renders `$1,234.50`).
 */
export function CurrencyInput({ currency, decimals = 2, ...props }: CurrencyInputProps) {
  return (
    <NumberInput {...props} decimals={decimals} formatOptions={{ style: "currency", currency }} />
  );
}

export interface PercentageInputProps extends Omit<NumberInputProps, "formatOptions" | "unit" | "step"> {
  /**
   * The unit contract, stated on purpose and never defaulted:
   * - `fraction`: `0.12` is 12% (what `Intl` and most APIs use).
   * - `percent`: `12` is 12% (what most people type and most forms store).
   */
  scale: "fraction" | "percent";
  step?: number;
}

/**
 * A percentage field with an explicit unit contract.
 *
 * `scale` is required because "0.12" is ambiguous, and a silent unit
 * conversion is how a 12% allocation becomes a 0.12% one. The component
 * converts only between the canonical value and the display value — the
 * consumer's stored value never changes meaning.
 */
export function PercentageInput({
  scale,
  step,
  decimals = 1,
  value,
  defaultValue,
  onValueChange,
  ...props
}: PercentageInputProps) {
  const toDisplay = (canonical: number | null | undefined) =>
    canonical === null || canonical === undefined ? null : scale === "fraction" ? canonical : canonical / 100;
  const toCanonical = (display: number | null) =>
    display === null ? null : scale === "fraction" ? display : display * 100;

  return (
    <NumberInput
      {...props}
      value={toDisplay(value)}
      // The uncontrolled path needs the same contract: a `defaultValue` of 8
      // with `scale="percent"` must render 8.0%, not 800%.
      defaultValue={toDisplay(defaultValue) ?? undefined}
      onValueChange={(display) => onValueChange?.(toCanonical(display))}
      step={step}
      decimals={decimals}
      formatOptions={{ style: "percent" }}
    />
  );
}
