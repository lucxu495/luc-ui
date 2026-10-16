"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { Spinner } from "./spinner";

interface FieldContextValue {
  id: string;
  /** Id of the visible `<label>`, for controls that need `aria-labelledby`. */
  labelId?: string;
  describedBy?: string;
  hasLabel: boolean;
  invalid: boolean;
  disabled: boolean;
  readOnly: boolean;
  busy: boolean;
  required: boolean;
  /** Marks the group a control belongs to when a `<Fieldset>` owns the label. */
  groupLabeled: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/**
 * Read field wiring inside a custom control. Returns safe defaults outside a
 * `<Field>`, so every control also works standalone.
 */
export function useField() {
  const context = useContext(FieldContext);
  const fallbackId = useId();
  return {
    id: context?.id ?? fallbackId,
    labelId: context?.labelId,
    describedBy: context?.describedBy,
    hasLabel: context?.hasLabel ?? false,
    invalid: context?.invalid ?? false,
    disabled: context?.disabled ?? false,
    readOnly: context?.readOnly ?? false,
    busy: context?.busy ?? false,
    required: context?.required ?? false,
    groupLabeled: context?.groupLabeled ?? false,
  };
}

export interface FieldProps {
  children: ReactNode;
  /** Explicit id for the control. Generated when omitted. */
  id?: string;
  label?: ReactNode;
  /** Helper text rendered under the control. Replaced by `error` when present. */
  description?: ReactNode;
  /** Error message. Presence sets `aria-invalid` on the control. */
  error?: ReactNode;
  /**
   * Validation in flight. Renders a quiet inline status row and sets
   * `aria-busy` on the control. Pass a node to override "Checking…".
   */
  validating?: boolean | ReactNode;
  /**
   * Confirmation of a *checked* value (an availability probe, a verified
   * handle). Deliberately not rendered for ordinary "field is filled in" —
   * see DESIGN_SYSTEM.md §12.
   */
  success?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Optional content rendered next to the label, e.g. a "Why?" hint button. */
  labelHint?: ReactNode;
  className?: string;
  /** Compact layouts drop the label row spacing. */
  orientation?: "vertical" | "horizontal";
}

/**
 * Composes a labelled, described, validatable control.
 *
 * The field owns ids and ARIA wiring; the control owns its visuals. This is the
 * only place in LUC UI where `<label>` semantics are decided.
 */
export function Field({
  children,
  id,
  label,
  description,
  error,
  validating = false,
  success,
  required = false,
  disabled = false,
  readOnly = false,
  labelHint,
  className,
  orientation = "vertical",
}: FieldProps) {
  const generatedId = useId();
  const fieldId = id ?? `field-${generatedId}`;
  const labelId = label ? `${fieldId}-label` : undefined;
  const isBusy = Boolean(validating) && !error;
  const descriptionId = description && !error && !success && !isBusy ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const statusId = isBusy ? `${fieldId}-status` : success ? `${fieldId}-success` : undefined;
  const describedBy = [descriptionId, errorId, statusId].filter(Boolean).join(" ") || undefined;

  return (
    <FieldContext.Provider
      value={{
        id: fieldId,
        labelId,
        describedBy,
        hasLabel: Boolean(label),
        invalid: Boolean(error),
        disabled,
        readOnly,
        busy: isBusy,
        required,
        groupLabeled: false,
      }}
    >
      <div
        data-slot="field"
        data-invalid={error ? true : undefined}
        data-busy={isBusy || undefined}
        className={cn(
          "flex min-w-0 gap-1.5",
          orientation === "vertical" ? "flex-col" : "flex-row items-center justify-between gap-4",
          className,
        )}
      >
        {label ? (
          <div className="flex items-center gap-1.5">
            <label
              id={labelId}
              htmlFor={fieldId}
              className="text-label font-medium text-fg-secondary data-[disabled]:text-fg-disabled"
              data-disabled={disabled || undefined}
            >
              {label}
              {required ? (
                // Required is a *state*, not an error: one accent asterisk, never
                // the negative colour. The control's own `required` attribute
                // carries the meaning for assistive tech.
                <span aria-hidden="true" className="ml-0.5 text-fg-accent">
                  *
                </span>
              ) : null}
            </label>
            {labelHint}
          </div>
        ) : null}
        {/*
          A disabled field never dims with `opacity`: compositing drops the label,
          the message and any text inside the control below 4.5:1. Each control
          renders its own disabled state from tokens, and this wrapper only
          publishes `data-disabled` for styling and tests.
        */}
        <div
          data-disabled={disabled || undefined}
          className={cn(orientation === "vertical" ? "flex flex-col gap-1.5" : "shrink-0")}
        >
          {children}
        </div>
        {error ? (
          <p id={errorId} role="alert" className="flex items-start gap-1.5 text-caption text-fg-negative">
            <svg viewBox="0 0 16 16" aria-hidden="true" className="mt-px size-3.5 shrink-0">
              <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 5.25v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="8" cy="11" r="0.85" fill="currentColor" />
            </svg>
            {error}
          </p>
        ) : isBusy ? (
          <p id={statusId} className="flex items-center gap-1.5 text-caption text-fg-muted">
            <Spinner size={14} label={null} className="text-fg-muted" />
            {typeof validating === "boolean" ? "Checking…" : validating}
          </p>
        ) : success ? (
          <p id={statusId} className="flex items-start gap-1.5 text-caption text-fg-positive">
            <svg viewBox="0 0 16 16" aria-hidden="true" className="mt-px size-3.5 shrink-0">
              <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path
                d="M5.4 8.2 7.1 9.9l3.5-3.9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {success}
          </p>
        ) : description ? (
          <p id={descriptionId} className="text-caption text-fg-muted">
            {description}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

export interface FieldsetProps extends Omit<React.ComponentPropsWithRef<"fieldset">, "disabled"> {
  /** The group's accessible name. Always rendered — a fieldset without a legend
   * is a container, not a form group. */
  legend: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  /** Optional content in the legend row, e.g. "Select all". */
  legendHint?: ReactNode;
}

/**
 * A real `<fieldset>`/`<legend>` group. Use it when several controls answer one
 * question (a set of checkboxes, a radio group, a repeatable block) — the legend
 * is announced with each control, which a `<div>` with a heading is not.
 */
export function Fieldset({ legend, description, children, className, disabled, legendHint, ...props }: FieldsetProps) {
  const generatedId = useId();
  const descriptionId = description ? `fieldset-${generatedId}-description` : undefined;
  return (
    <fieldset
      data-slot="fieldset"
      disabled={disabled}
      aria-describedby={descriptionId}
      className={cn("flex min-w-0 flex-col gap-3 border-0 p-0", disabled && "opacity-60", className)}
      {...props}
    >
      {/*
        * The legend has to be the fieldset's own child — a nested `<legend>` is
        * invalid HTML and loses the group announcement.
        *
        * It also carries its own bottom margin, and that is a fix rather than a
        * preference. A `<legend>` is not an ordinary flex item: the container's
        * `gap-3` is applied between the elements *after* it but **not** between
        * the legend and the next sibling. Measured in Chrome and Firefox on
        * `/forms/validation` and `/forms` before this change: the legend ended
        * at y=803 and the description started at y=795 — because the description
        * carried `-mt-2` (the old code's way of closing the gap it assumed,
        * 12 − 8 = 4 px) on top of a gap that was never applied. Every Fieldset
        * with a description overlapped its own legend by exactly 8 px.
        *
        * So the spacing is explicit and does not depend on legend-gap
        * semantics: 4 px under the legend when a description follows it, 12 px
        * (the stack rhythm) when the group starts with its controls.
        */}
      <legend className={cn("flex w-full items-center justify-between gap-3 p-0", description ? "mb-1" : "mb-3")}>
        <span className="text-label font-medium text-fg-secondary">{legend}</span>
        {legendHint}
      </legend>
      {description ? (
        <p id={descriptionId} className="text-caption text-fg-muted">
          {description}
        </p>
      ) : null}
      {children}
    </fieldset>
  );
}

export interface FieldGroupProps extends React.ComponentPropsWithRef<"div"> {
  /** Column count from the `sm` breakpoint up. A single column on mobile always. */
  columns?: 1 | 2 | 3;
}

/**
 * Lays fields out in a responsive grid. It owns spacing only: every child keeps
 * its own `<Field>` wiring, so the group never becomes a form engine.
 */
export function FieldGroup({ columns = 2, className, ...props }: FieldGroupProps) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "grid gap-x-5 gap-y-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
      {...props}
    />
  );
}
