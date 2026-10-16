//#region src/components/native-select.d.ts
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
export interface NativeSelectProps extends Omit<React.ComponentPropsWithRef<"select">, "size"> {
  size?: "sm" | "md" | "lg";
  invalid?: boolean;
  /** Options as data — or pass `<option>` children, both work. */
  options?: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  /** Rendered as an empty, disabled first option. */
  placeholder?: string;
}
export declare function NativeSelect({ className, size, invalid, options, placeholder, id, disabled, required, "aria-describedby": ariaDescribedBy, children, ...props }: NativeSelectProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=native-select.d.ts.map