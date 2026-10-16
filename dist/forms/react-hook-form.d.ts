import { FormProps } from "./form.js";
import { ReactNode } from "react";
import { Control, ControllerRenderProps, FieldPath, FieldValues, UseControllerProps, UseFormReturn } from "react-hook-form";
//#region src/forms/adapters/react-hook-form.d.ts
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
/**
 * A field bound to React Hook Form.
 *
 * ```tsx
 * <FormField name="email" label="Email" description="We never share it.">
 *   {({ controlProps }) => <Input type="email" placeholder="you@luc.dev" {...controlProps} />}
 * </FormField>
 * ```
 */
export declare function FormField<TValues extends FieldValues, TName extends FieldPath<TValues>>({ name, control, label, description, id, required, disabled, readOnly, validatingMessage, successMessage, rules, className, children }: FormFieldProps<TValues, TName>): import("react").JSX.Element;
export interface RhfFormProps<TValues extends FieldValues> extends Omit<FormProps, "onSubmit" | "errors" | "error"> {
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
/**
 * A `<Form>` driven by React Hook Form.
 *
 * It owns the three things RHF deliberately leaves to the UI: the submit
 * lifecycle (`idle -> submitting -> success | error`), the form-level error, and
 * the error summary derived from `formState.errors` - each row able to move
 * focus back to the field that failed.
 */
export declare function RhfForm<TValues extends FieldValues>({ form, onSubmit, formatError, fieldLabels, summary, summaryTitle, children, ...props }: RhfFormProps<TValues>): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=react-hook-form.d.ts.map