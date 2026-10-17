"use client";

import {
  Controller,
  FormProvider,
  useFormContext,
  type Control,
  type ControllerRenderProps,
  type ControllerFieldState,
  type FieldPath,
  type FieldValues,
  type UseControllerProps,
  type UseFormReturn,
} from "react-hook-form";
import { useState, type ReactNode } from "react";
import { Field, useField } from "../../components/field";
import { Form, FormErrorSummary, type FormErrorItem, type FormProps, type FormStatus } from "../form";

/*
 * LUC UI x React Hook Form.
 *
 * This adapter exists so a product never re-derives the boring part: a label
 * bound to a control, `aria-describedby` pointing at the right message,
 * `aria-invalid` when the field errors, `aria-busy` while an async validator
 * runs, and an error summary that can move focus to the offending field.
 *
 * Form *state* stays in React Hook Form; field *presentation* stays in LUC UI.
 * Nothing here is required to use LUC fields - `Field` + `Input` work with any
 * engine (docs/FORM_GUIDE.md has the TanStack Form recipe). Import from the
 * subpath so products that do not use React Hook Form never load it:
 *
 *   import { RhfForm, FormField } from "@luc/ui/forms/react-hook-form";
 */

export interface FormFieldControlProps<TValue = unknown> {
  id: string;
  name: string;
  value: TValue;
  onChange: (...event: unknown[]) => void;
  onBlur: () => void;
  ref: (instance: unknown) => void;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
  "aria-describedby"?: string;
  "aria-busy"?: boolean;
}

export interface FormFieldRenderProps<TValue = unknown> {
  /** Spread onto a native-input LUC control: `<Input {...controlProps} />`. */
  controlProps: FormFieldControlProps<TValue>;
  /** The current value - for controlled controls (Select, NumberInput). */
  value: TValue;
  /** Sets the value directly, for controls with `onValueChange`. */
  onValueChange: (value: TValue) => void;
  onBlur: () => void;
  invalid: boolean;
  /** Resolved from the surrounding `<Field>`, for a fully custom control. */
  id: string;
  describedBy?: string;
  isDirty: boolean;
  isTouched: boolean;
  /** True while an async resolver or `trigger()` is in flight for this field. */
  isValidating: boolean;
  /** React Hook Form's raw field object, for escape-hatch wiring. */
  field: ControllerRenderProps<FieldValues, string>;
}

export interface FormFieldProps<TValues extends FieldValues, TName extends FieldPath<TValues>> {
  name: TName;
  /** Defaults to the nearest `<FormProvider>`; pass it for use outside one. */
  control?: Control<TValues>;
  label?: ReactNode;
  description?: ReactNode;
  /** Explicit id, when the field must be addressable (deep links, tests). */
  id?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Message shown while an async validator runs. */
  validatingMessage?: ReactNode;
  /** Confirmation for a value that was actually *checked*, e.g. "Available". */
  successMessage?: ReactNode;
  /**
   * React Hook Form's own validation rules (`required`, `minLength`, `validate`
   * …). A `resolver` on the form is the other way in; both are supported.
   */
  rules?: UseControllerProps<TValues, TName>["rules"];
  className?: string;
  /** The control. Receives RHF wiring plus the field's own id/ARIA wiring. */
  children: (field: FormFieldRenderProps<TValues[TName]>) => ReactNode;
}

function messageFromError(error: unknown): string | undefined {
  if (!error) return undefined;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return "This value is not valid";
}

/**
 * A field bound to React Hook Form.
 *
 * ```tsx
 * <FormField name="email" label="Email" description="We never share it.">
 *   {({ controlProps }) => <Input type="email" placeholder="you@luc.dev" {...controlProps} />}
 * </FormField>
 * ```
 */
export function FormField<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  name,
  control,
  label,
  description,
  id,
  required,
  disabled,
  readOnly,
  validatingMessage,
  successMessage,
  rules,
  className,
  children,
}: FormFieldProps<TValues, TName>) {
  const context = useFormContext<TValues>();
  const resolvedControl = control ?? context?.control;
  if (!resolvedControl) {
    throw new Error(
      "FormField needs a React Hook Form control: wrap it in <RhfForm> or <FormProvider>, or pass `control`.",
    );
  }

  return (
    <Controller<TValues, TName>
      name={name}
      control={resolvedControl}
      rules={rules}
      render={(controller) => {
        const message = messageFromError(controller.fieldState.error);
        const invalid = Boolean(controller.fieldState.error);
        const isValidating = Boolean(controller.fieldState.isValidating);
        const isRequired = Boolean(required);
        return (
          <Field
            id={id}
            label={label}
            description={description}
            error={message}
            required={isRequired}
            disabled={disabled}
            readOnly={readOnly}
            validating={isValidating && !invalid ? (validatingMessage ?? true) : false}
            success={!invalid && !isValidating ? successMessage : undefined}
            className={className}
          >
            <FieldBinding<TValues, TName>
              controller={controller}
              invalid={invalid}
              required={isRequired}
              disabled={disabled ?? Boolean(controller.field.disabled)}
              readOnly={Boolean(readOnly)}
              isValidating={isValidating}
            >
              {children as (field: FormFieldRenderProps<unknown>) => ReactNode}
            </FieldBinding>
          </Field>
        );
      }}
    />
  );
}

/** Inner component so the render prop can read the `<Field>` context ids. */
function FieldBinding<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  controller,
  invalid,
  required,
  disabled,
  readOnly,
  isValidating,
  children,
}: {
  controller: {
    field: ControllerRenderProps<TValues, TName>;
    fieldState: ControllerFieldState;
  };
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
  isValidating: boolean;
  children: (field: FormFieldRenderProps<unknown>) => ReactNode;
}) {
  const lucField = useField();

  return (
    <>
      {children({
        controlProps: {
          id: lucField.id,
          name: controller.field.name,
          value: controller.field.value,
          onChange: controller.field.onChange,
          onBlur: controller.field.onBlur,
          ref: controller.field.ref,
          invalid,
          required,
          disabled,
          readOnly,
          "aria-describedby": lucField.describedBy,
          ...(isValidating ? { "aria-busy": true as const } : {}),
        },
        value: controller.field.value,
        onValueChange: (next: unknown) => controller.field.onChange(next),
        onBlur: controller.field.onBlur,
        invalid,
        id: lucField.id,
        describedBy: lucField.describedBy,
        isDirty: controller.fieldState.isDirty,
        isTouched: controller.fieldState.isTouched,
        isValidating,
        field: controller.field as unknown as ControllerRenderProps<FieldValues, string>,
      })}
    </>
  );
}

export interface RhfFormProps<TValues extends FieldValues>
  extends Omit<FormProps, "onSubmit" | "errors" | "error"> {
  /** The value returned by `useForm()`. */
  form: UseFormReturn<TValues>;
  /** Runs only when validation passes. Throwing sets the form-level error. */
  onSubmit: (values: TValues, event?: React.BaseSyntheticEvent) => void | Promise<void>;
  /** Maps a submission rejection to a message. */
  formatError?: (error: unknown) => ReactNode;
  /** Human labels for the error summary. Falls back to a de-camel-cased path. */
  fieldLabels?: Partial<Record<FieldPath<TValues>, string>>;
  /** Renders the error summary above the fields. Default `true`. */
  summary?: boolean;
  /** Title for the generated summary. */
  summaryTitle?: string;
  children: ReactNode;
}

function humanize(path: string): string {
  const last = path.split(".").pop() ?? path;
  return last
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (character) => character.toUpperCase());
}

function buildSummaryErrors<TValues extends FieldValues>(
  form: UseFormReturn<TValues>,
  fieldLabels?: Partial<Record<FieldPath<TValues>, string>>,
): FormErrorItem[] {
  const { errors, submitCount } = form.formState;
  if (submitCount === 0) return [];
  const items: FormErrorItem[] = [];
  for (const [path, error] of Object.entries(errors)) {
    if (!error) continue;
    const message = messageFromError(error);
    if (!message) continue;
    const ref = (error as { ref?: { focus?: () => void } }).ref;
    items.push({
      id: path,
      label: fieldLabels?.[path as FieldPath<TValues>] ?? humanize(path),
      message,
      ...(ref && typeof ref.focus === "function"
        ? {
            focus: () => {
              ref.focus?.();
              (ref as unknown as { scrollIntoView?: (options?: ScrollIntoViewOptions) => void }).scrollIntoView?.({
                block: "center",
                behavior: "smooth",
              });
            },
          }
        : {}),
    });
  }
  return items;
}

/**
 * A `<Form>` driven by React Hook Form.
 *
 * It owns the three things RHF deliberately leaves to the UI: the submit
 * lifecycle (`idle -> submitting -> success | error`), the form-level error, and
 * the error summary derived from `formState.errors` - each row able to move
 * focus back to the field that failed.
 */
export function RhfForm<TValues extends FieldValues>({
  form,
  onSubmit,
  formatError,
  fieldLabels,
  summary = true,
  summaryTitle,
  children,
  ...props
}: RhfFormProps<TValues>) {
  const summaryErrors = buildSummaryErrors(form, fieldLabels);
  const [formError, setFormError] = useState<ReactNode>(undefined);

  /**
   * RHF's `handleSubmit` runs validation, then either our handler or its own
   * `onInvalid` branch. Routing that through Luc UI's `Form` by *returning* a
   * status keeps one submit lifecycle instead of two competing ones.
   */
  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<FormStatus> => {
    let outcome: FormStatus = "success";
    await form.handleSubmit(
      async (values, submitEvent) => {
        try {
          await onSubmit(values, submitEvent);
          setFormError(undefined);
        } catch (caught) {
          // Caught here rather than rethrown so `formatError` can render rich
          // content; the form still ends in the `error` state either way.
          setFormError(formatError ? formatError(caught) : (messageFromError(caught) ?? "Could not save your changes."));
          outcome = "error";
        }
      },
      () => {
        outcome = "error";
      },
    )(event as unknown as React.BaseSyntheticEvent);
    return outcome;
  };

  return (
    <FormProvider {...form}>
      <Form {...props} onSubmit={submit} error={formError}>
        {summary ? <FormErrorSummary errors={summaryErrors} title={summaryTitle} /> : null}
        {children}
      </Form>
    </FormProvider>
  );
}
