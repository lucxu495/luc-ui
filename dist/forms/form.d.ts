import { ButtonProps } from "../components/button-base.js";
import "../components/button.js";
import { ReactNode } from "react";
//#region src/forms/form.d.ts
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
/**
 * Reads the submit lifecycle. Returns inert defaults outside a `<Form>`, so a
 * `SubmitButton` can sit in a toolbar without exploding.
 */
export declare function useLucForm(): FormStatusValue;
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
/**
 * The form shell. Renders a real `<form>`, owns the submit lifecycle and
 * publishes it through `useLucForm()`. It does not know what a field is.
 */
export declare function Form({ children, className, onSubmit, onError, errors, error, errorMessage, noValidate, ...props }: FormProps): import("react").JSX.Element;
export interface SubmitButtonProps extends Omit<ButtonProps, "type" | "loading"> {
  /** Shown while submitting. Defaults to the button's own label. */
  loadingText?: ReactNode;
}
/**
 * A submit button wired to the form lifecycle. The label does not change unless
 * you ask it to — a button that renames itself mid-click is a layout shift.
 */
export declare function SubmitButton({ loadingText, children, disabled, ...props }: SubmitButtonProps): import("react").JSX.Element;
export interface FormActionsProps extends React.ComponentPropsWithRef<"div"> {
  align?: "start" | "end" | "between";
  /**
   * Pins the row to the bottom of a scrolling container (a Sheet or a long
   * settings page). Sticky rows are opaque, per the system overlay rule.
   */
  sticky?: boolean;
}
export declare function FormActions({ align, sticky, className, ...props }: FormActionsProps): import("react").JSX.Element;
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
export declare function FormErrorSummary({ className, always, title, errors: providedErrors, ...props }: FormErrorSummaryProps): import("react").JSX.Element | null;
/** Stable ids for a repeating group, so labels stay unique across rows. */
export declare function useFieldIdPrefix(explicit?: string): string;
//#endregion
//# sourceMappingURL=form.d.ts.map