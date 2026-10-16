// LUC form system.
//
// Presentation primitives only: `Form` owns the submit lifecycle and the error
// summary, `Field` owns label/description/error wiring, and the inputs own their
// own visuals. Field values and validation live in the consumer's engine.
// React Hook Form gets a thin bridge from `@luc/ui/forms/react-hook-form`.
//
// `Field`, `Fieldset` and `FieldGroup` ship with this entry (not only with the
// root barrel): the field family is part of the form system, and
// `docs/PUBLIC_API.md` documents them here. `src/forms/public-api.test.tsx`
// fails if this entry and that table ever disagree again.

export * from "./form";
export * from "./sections";
export * from "../components/field";
/*
 * The field *shell*. A form consumer should not have to reach the root barrel
 * for a prefix or a suffix on a field it already gets from this entry — the
 * same reasoning that put `Field` here in Phase 2.
 */
export * from "../components/input-group";
export * from "./inputs/number-input";
export * from "./inputs/password-input";
export * from "./inputs/otp-input";
export * from "./inputs/file-input";
export * from "./inputs/tag-input";
