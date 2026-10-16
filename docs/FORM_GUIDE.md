# LUC UI — form guide

How to build a form in LUC UI without turning it into a framework.

The short version: **LUC UI does not own form state.** It owns the parts every
product would otherwise rebuild — one field anatomy, one submit lifecycle, one
error summary, one place for messages — and leaves values, validation and
submission to whatever the product already uses.

## 1. Architecture

```
consumer            form engine: React Hook Form, TanStack Form, useReducer…
                          │  values, validation, submission
                          ▼
@luc/ui/forms       Form · FormSection · Fieldset · FieldGroup · FieldArray
                    FormActions · SubmitButton · FormErrorSummary
                          │  ids, ARIA wiring, status, layout
                          ▼
@luc/ui             Field + controls (Input, Select, NumberInput, DatePicker…)

@luc/ui/forms/react-hook-form   ← optional adapter (peer dependency)
```

Two rules follow from that picture:

1. **A control never knows about a form engine.** `Input` knows how to render an
   error, not how to validate.
2. **A form never knows about a field.** `Form` knows it is submitting, not what
   a field is.

## 2. The field contract

> **V4.0 addition.** `InputGroup` / `InputGroupAddon` / `InputGroupInput` /
> `InputGroupSeparator` are part of this entry (`@luc/ui/forms`) as well as the
> root barrel. A form consumer should not have to reach the barrel for a prefix
> or a suffix on a field it already gets from here — the same reasoning that put
> `Field` on this entry in Phase 2. The group is the shared field *shell*: it
> carries the focus ring, the invalid state and the sunken well, so an addon can
> never drift from the control beside it.

`Field` owns every id and every ARIA relationship:

| Concern | Who wires it |
| --- | --- |
| `for`/`id` between label and control | `Field` (through `useField()`) |
| `aria-describedby` → description *or* error *or* status | `Field` |
| `aria-invalid` | `Field` sets it; the control renders it |
| `aria-busy` while validating | `Field` → control |
| `required` / `disabled` / `readOnly` | `Field` → control, overridable per control |
| `<fieldset>`/`<legend>` for a group | `Fieldset` |

```tsx
<Field label="Notional" description="Settlement currency, whole units." required>
  <NumberInput defaultValue={250000} decimals={0} />
</Field>
```

Never hand-write an `id` to connect a label to a control. If a field must be
addressable (deep links, tests), pass `id` to `Field` — the control inherits it.

### States

Exactly one message slot is rendered, in this order:

`error` → `validating` → `success` → `description`

- **error** — `text-fg-negative`, `role="alert"`.
- **validating** — a 14px arc plus one line, `text-fg-muted`, `aria-busy` on the
  control. Never a spinner in the middle of a field.
- **success** — only for a value that was actually *checked* (an availability
  probe, a verified handle). Do not turn every completed field green.
- **description** — `text-fg-muted`, always readable, never `text-fg-disabled`.

Required is marked with **one accent asterisk** on the label and the control's
own `required` attribute. There is no second convention: no "(required)"
suffixes, no red asterisks, and optional fields are simply not marked.

## 3. Choosing a form engine

### React Hook Form (supported adapter)

```tsx
const form = useForm<Values>({ defaultValues, resolver });

<RhfForm form={form} onSubmit={save} fieldLabels={{ email: "Billing email" }}>
  <FormField name="email" label="Billing email" rules={{ required: "Required" }}>
    {({ controlProps }) => <Input type="email" {...controlProps} />}
  </FormField>
  <FormActions>
    <SubmitButton loadingText="Saving">Save</SubmitButton>
  </FormActions>
</RhfForm>;
```

The render prop hands you two paths:

- `controlProps` — spread onto a native-input control (`Input`, `Textarea`,
  `NumberInput`, `OtpInput`, `TagInput`, `PasswordInput`).
- `value` + `onValueChange` — for controlled controls with a value-first API
  (`Select`, `Combobox`, `DatePicker`, `Switch`).

It also gives `invalid`, `id`, `describedBy`, `isDirty`, `isTouched` and
`isValidating`, so a custom control can be wired without guessing.

`RhfForm` adds three things React Hook Form leaves to the UI: the submit
lifecycle (`idle → submitting → success | error`), the form-level error, and an
error summary built from `formState.errors` — every row able to move focus back
to its field.

### TanStack Form (documented, no adapter)

Its field render props compose with `Field` directly, so no adapter is needed:

```tsx
<form.Field name="email">
  {(field) => (
    <Field label="Email" error={field.state.meta.errors[0]?.message}>
      <Input
        value={field.state.value}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
      />
    </Field>
  )}
</form.Field>
```

### Nothing at all

`Form` works on its own. Validation is your JavaScript; the summary takes an
`errors` array of `{ id?, label, message, focus? }`.

```tsx
<Form errors={errors} onSubmit={submit}>
  <FormErrorSummary />
  …
</Form>
```

## 4. The submit lifecycle

```
idle ──submit──▶ submitting ──resolve──▶ success
                     │
                     └──reject / returned "error"──▶ error
```

- `SubmitButton` reads the status: it holds its width, stays in the tab order,
  and reports `aria-busy`.
- `FormActions sticky` pins the row inside a scrolling container (a Sheet or a
  long settings page) with an **opaque** surface.
- A handler can return a `FormStatus` to decide the outcome itself — that is how
  a validation failure is reported as `error` instead of being mistaken for a
  successful save.
- Throwing (or rejecting) sets the form-level error from `error.message` and
  marks the form as failed.

## 5. Where errors go

| Failure | Where it appears | Never |
| --- | --- | --- |
| A field is empty or malformed | Under the field (`Field error`) | A toast |
| An async check fails | Under the field, after the check | A spinner over the form |
| A submit is rejected because fields are invalid | `FormErrorSummary` (+ linked rows) | Only a toast |
| The server rejects the save | `FormErrorSummary` as a form-level message | Only a toast |
| The save succeeded | Optional `toast.success` | A green banner across the page |

The summary appears **after a submit attempt**, never while someone is still
filling the form in. It does not steal focus on mount: React Hook Form already
focuses the first invalid control, and two things fighting over focus is worse
than either.

## 6. Validation

- **Client rules** — React Hook Form's `rules` (`required`, `minLength`,
  `validate`) or a resolver.
- **Async rules** — `validate: async (value) => …`; the field shows the quiet
  validating state while it runs.
- **Server errors** — throw from `onSubmit`, or `form.setError(...)`; either way
  the message lands in the summary.
- **Any validator library** — pass a resolver. `@hookform/resolvers` speaks
  Standard Schema, so Zod 4 and Valibot both work. `@luc/ui` never imports a
  validation library.

## 7. Controlled and uncontrolled

Every LUC input works both ways: pass `value` + `onValueChange` to own the state,
or `defaultValue` and let the component hold it. `DataTable` and the date
controls use the same rule, so a Showcase demo and a server-driven product
screen use identical props.

Numbers commit on **blur or Enter**, like a well-behaved numeric input: partial
input is never reported to the form as a value. Arrow keys and the steppers
commit immediately.

## 8. Repeating rows

`FieldArray` renders the chrome — numbering, add, remove, move up/down — and
holds no array:

```tsx
<FieldArray legend="Endpoints" count={rows.length} onAdd={add} onRemove={remove} onMove={move}>
  {rows.map((row) => (
    <FieldGroup key={row.id} columns={2}>
      <Field label="Label"><Input defaultValue={row.label} /></Field>
      <Field label="URL"><Input defaultValue={row.url} /></Field>
    </FieldGroup>
  ))}
</FieldArray>
```

Plug it into `useFieldArray` (React Hook Form), a store slice, or `useState`.
Drag-and-drop is deliberately absent.

## 9. Forms in overlays

A Sheet or Dialog form uses the same components; only the container differs:

```
<Sheet><SheetContent>
  <Form>
    <SheetHeader/>        ← does not scroll
    <SheetBody>…</SheetBody>   ← scrolls
    <SheetFooter><FormActions/></SheetFooter>   ← does not scroll
  </Form>
</SheetContent></Sheet>
```

The dialog traps focus, Escape closes it, and focus returns to the trigger. A
failed save keeps the panel open and lists what is wrong, in place.

## 10. Accessibility checklist

- [ ] Every control has a label — visible, or `aria-label` when the design truly
      has no room for one.
- [ ] The message slot the user needs is the one that is rendered, and it is
      referenced by `aria-describedby`.
- [ ] Invalid controls carry `aria-invalid`; groups carry a `<legend>`.
- [ ] Required is conveyed by the `required` attribute, not by the asterisk.
- [ ] Tab order follows reading order; nothing inside a disabled field traps
      focus.
- [ ] A failed submit is reachable: either the first invalid field is focused, or
      the summary names and links it.
- [ ] No message is below 4.5:1 — including inside a disabled field.

## 11. Anti-patterns

- A second `FormField` implementation next to the one in `@luc/ui`.
- Using a toast as the only signal that a form failed.
- Dimming a whole field with `opacity` when it is disabled (it drops the label
  and the message below 4.5:1).
- Inventing an error colour; `text-fg-negative` and `negative-line` exist.
- Putting business rules in a component: LUC formats and lays out, the product
  decides what is valid.
- Making every row 64px tall. Density changes spacing, never touch targets.
- Wiring a `Select` to navigation, or using a `CommandMenu` as a field.
- Letting a component fetch, mutate or upload. Forms hand values to callbacks.
