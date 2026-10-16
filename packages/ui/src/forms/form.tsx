"use client";

import { createContext, useContext, useId, useRef, useState, type ReactNode } from "react";
import { Button, type ButtonProps } from "../components/button";
import { cn } from "../utils/cn";

/**
 * LUC form foundation.
 *
 * LUC UI deliberately does **not** own form state. Field values, validation and
 * submission live in whatever the product already uses — React Hook Form,
 * TanStack Form, a plain reducer — and this module owns the part every product
 * would otherwise rebuild: the submit lifecycle, the status vocabulary, the
 * form-level error summary and the action row. See docs/FORM_GUIDE.md.
 *
 * The adapter in `@luc/ui/forms/react-hook-form` is the supported integration
 * for React Hook Form; it is a *bridge*, not a second form system.
 */

export type FormStatus = "idle" | "submitting" | "success" | "error";

export interface FormErrorItem {
  /** Anchor target. Matches a field id, so the summary can point at the field. */
  id?: string;
  /** Human label for the row — "Email address", not "email". */
  label: string;
  message: string;
  /** Moves focus to the offending control. Supplied by the form engine adapter. */
  focus?: () => void;
}

export interface FormStatusValue {
  status: FormStatus;
  isSubmitting: boolean;
  /** True once a submit has been attempted, successfully or not. */
  submitAttempted: boolean;
  /** Form-level error, e.g. "We could not save your changes." */
  error?: ReactNode;
  /** Field-level errors, listed by `FormErrorSummary`. */
  errors: FormErrorItem[];
  setStatus: (status: FormStatus) => void;
  setError: (error: ReactNode | undefined) => void;
  markSubmitAttempted: () => void;
  /** Returns the form to `idle` with no error. Does not touch field values. */
  resetStatus: () => void;
}

const FormStatusContext = createContext<FormStatusValue | null>(null);

const FALLBACK_STATUS: FormStatusValue = {
  status: "idle",
  isSubmitting: false,
  submitAttempted: false,
  errors: [],
  setStatus: () => {},
  setError: () => {},
  markSubmitAttempted: () => {},
  resetStatus: () => {},
};

/**
 * Reads the submit lifecycle. Returns inert defaults outside a `<Form>`, so a
 * `SubmitButton` can sit in a toolbar without exploding.
 */
export function useLucForm(): FormStatusValue {
  return useContext(FormStatusContext) ?? FALLBACK_STATUS;
}

export interface FormProps extends Omit<React.ComponentPropsWithRef<"form">, "onSubmit" | "onError"> {
  /**
   * Submit handler. Returning a promise puts the form into `submitting`;
   * throwing (or rejecting) sets `error` and the summary. Return a `FormStatus`
   * to decide the outcome yourself — an adapter that validates first returns
   * `"error"` when validation fails, so a failed validation is never reported
   * as a successful save.
   */
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void | FormStatus | Promise<void | FormStatus>;
  /** Called after a submit rejects, for logging or analytics. */
  onError?: (error: unknown) => void;
  /** Field errors for `FormErrorSummary`. Derived by the caller's form engine. */
  errors?: FormErrorItem[];
  /** Form-level message. Rendered in the summary, never as a toast-only error. */
  error?: ReactNode;
  /** Message used when a submit rejects without one of its own. */
  errorMessage?: ReactNode;
}

function messageFromError(error: unknown): ReactNode {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return undefined;
}

/**
 * The form shell. Renders a real `<form>`, owns the submit lifecycle and
 * publishes it through `useLucForm()`. It does not know what a field is.
 */
export function Form({
  children,
  className,
  onSubmit,
  onError,
  errors = [],
  error,
  errorMessage = "Something went wrong while saving. Please try again.",
  noValidate = true,
  ...props
}: FormProps) {
  const [status, setStatusState] = useState<FormStatus>("idle");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [internalError, setInternalError] = useState<ReactNode>(undefined);
  const statusRef = useRef<FormStatus>("idle");

  const setStatus = (next: FormStatus) => {
    statusRef.current = next;
    setStatusState(next);
  };

  const value: FormStatusValue = {
    status,
    isSubmitting: status === "submitting",
    submitAttempted,
    error: error ?? internalError,
    errors,
    setStatus,
    setError: setInternalError,
    markSubmitAttempted: () => setSubmitAttempted(true),
    resetStatus: () => {
      setInternalError(undefined);
      setSubmitAttempted(false);
      setStatus("idle");
    },
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (internalError) setInternalError(undefined);
    if (!onSubmit) return;

    setStatus("submitting");
    let outcome: void | FormStatus;
    try {
      outcome = await onSubmit(event);
    } catch (caught) {
      onError?.(caught);
      setInternalError(messageFromError(caught) ?? errorMessage);
      setStatus("error");
      return;
    }
    // A handler that returned a status, or that set one while it ran, has
    // already decided the outcome. Otherwise a resolved promise means success.
    if (outcome) setStatus(outcome);
    else if (statusRef.current === "submitting") setStatus("success");
  };

  return (
    <FormStatusContext.Provider value={value}>
      <form
        data-slot="form"
        data-status={status}
        noValidate={noValidate}
        onSubmit={handleSubmit}
        className={cn("flex min-w-0 flex-col gap-6", className)}
        {...props}
      >
        {children}
      </form>
    </FormStatusContext.Provider>
  );
}

export interface SubmitButtonProps extends Omit<ButtonProps, "type" | "loading"> {
  /** Shown while submitting. Defaults to the button's own label. */
  loadingText?: ReactNode;
}

/**
 * A submit button wired to the form lifecycle. The label does not change unless
 * you ask it to — a button that renames itself mid-click is a layout shift.
 */
export function SubmitButton({ loadingText, children, disabled, ...props }: SubmitButtonProps) {
  const { isSubmitting } = useLucForm();
  return (
    <Button
      type="submit"
      variant="primary"
      loading={isSubmitting}
      disabled={disabled}
      loadingLabel={typeof loadingText === "string" ? loadingText : "Submitting"}
      {...props}
    >
      {isSubmitting && loadingText ? loadingText : children}
    </Button>
  );
}

export interface FormActionsProps extends React.ComponentPropsWithRef<"div"> {
  align?: "start" | "end" | "between";
  /**
   * Pins the row to the bottom of a scrolling container (a Sheet or a long
   * settings page). Sticky rows are opaque, per the system overlay rule.
   */
  sticky?: boolean;
}

export function FormActions({ align = "end", sticky = false, className, ...props }: FormActionsProps) {
  return (
    <div
      data-slot="form-actions"
      className={cn(
        "flex flex-wrap items-center gap-2",
        align === "start" && "justify-start",
        align === "end" && "justify-end",
        align === "between" && "justify-between",
        sticky &&
          "sticky bottom-0 z-[var(--z-sticky)] -mx-5 -mb-5 mt-2 border-t border-line-subtle bg-surface-overlay px-5 py-3 sm:-mx-6 sm:-mb-6 sm:px-6",
        className,
      )}
      {...props}
    />
  );
}

export interface FormErrorSummaryProps extends React.ComponentPropsWithRef<"div"> {
  /** Render even when no submit has been attempted (e.g. an edit form). */
  always?: boolean;
  title?: string;
  /**
   * Explicit error list. Form engines with their own error tree (React Hook
   * Form, TanStack Form) pass theirs here instead of pushing into the context.
   */
  errors?: FormErrorItem[];
}

/**
 * The form-level error summary.
 *
 * It appears after a failed submit — not while the user is still typing — and
 * is announced (`role="alert"`). Each row can move focus to the field that
 * caused it. The summary does not steal focus on mount: React Hook Form already
 * focuses the first invalid control, and two things fighting over focus is
 * worse than either.
 */
export function FormErrorSummary({
  className,
  always = false,
  title = "Please fix the following before saving",
  errors: providedErrors,
  ...props
}: FormErrorSummaryProps) {
  const { errors: contextErrors, error, submitAttempted } = useLucForm();
  const errors = providedErrors ?? contextErrors;
  const visible = always || submitAttempted;
  if (!visible || (errors.length === 0 && !error)) return null;

  return (
    <div
      data-slot="form-error-summary"
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-negative-line bg-surface-overlay p-3.5",
        "text-caption text-fg-secondary shadow-xs",
        className,
      )}
      {...props}
    >
      <p className="flex items-center gap-2 text-label font-medium text-fg-negative">
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 shrink-0">
          <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 5.25v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="8" cy="11" r="0.85" fill="currentColor" />
        </svg>
        {title}
      </p>
      {error ? <p className="text-fg-secondary">{error}</p> : null}
      {errors.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {errors.map((item, index) => (
            <li key={`${item.id ?? item.label}-${index}`} className="flex gap-2 leading-[1.5]">
              <span aria-hidden="true" className="text-fg-muted">
                ·
              </span>
              {item.focus ? (
                <button
                  type="button"
                  onClick={() => item.focus?.()}
                  className="luc-focus rounded-xs text-left text-fg-secondary underline decoration-line-strong decoration-1 underline-offset-2 luc-transition hover:text-fg-primary hover:decoration-line-accent"
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="text-fg-muted"> — {item.message}</span>
                </button>
              ) : (
                <span>
                  <span className="font-medium text-fg-secondary">{item.label}</span>
                  <span className="text-fg-muted"> — {item.message}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Stable ids for a repeating group, so labels stay unique across rows. */
export function useFieldIdPrefix(explicit?: string): string {
  const generated = useId();
  return explicit ?? `field-${generated}`;
}
