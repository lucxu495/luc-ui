"use client";
import { Field, useField } from "../components/field.js";
import { Form, FormErrorSummary } from "./form.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Controller, FormProvider, useFormContext } from "react-hook-form";
//#region src/forms/adapters/react-hook-form.tsx
function messageFromError(error) {
	if (!error) return void 0;
	if (typeof error === "string") return error;
	if (typeof error === "object" && error !== null && "message" in error) {
		const message = error.message;
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
function FormField({ name, control, label, description, id, required, disabled, readOnly, validatingMessage, successMessage, rules, className, children }) {
	const context = useFormContext();
	const resolvedControl = control ?? context?.control;
	if (!resolvedControl) throw new Error("FormField needs a React Hook Form control: wrap it in <RhfForm> or <FormProvider>, or pass `control`.");
	return /* @__PURE__ */ jsx(Controller, {
		name,
		control: resolvedControl,
		rules,
		render: (controller) => {
			const message = messageFromError(controller.fieldState.error);
			const invalid = Boolean(controller.fieldState.error);
			const isValidating = Boolean(controller.fieldState.isValidating);
			const isRequired = Boolean(required);
			return /* @__PURE__ */ jsx(Field, {
				id,
				label,
				description,
				error: message,
				required: isRequired,
				disabled,
				readOnly,
				validating: isValidating && !invalid ? validatingMessage ?? true : false,
				success: !invalid && !isValidating ? successMessage : void 0,
				className,
				children: /* @__PURE__ */ jsx(FieldBinding, {
					controller,
					invalid,
					required: isRequired,
					disabled: disabled ?? Boolean(controller.field.disabled),
					readOnly: Boolean(readOnly),
					isValidating,
					children
				})
			});
		}
	});
}
/** Inner component so the render prop can read the `<Field>` context ids. */
function FieldBinding({ controller, invalid, required, disabled, readOnly, isValidating, children }) {
	const lucField = useField();
	return /* @__PURE__ */ jsx(Fragment, { children: children({
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
			...isValidating ? { "aria-busy": true } : {}
		},
		value: controller.field.value,
		onValueChange: (next) => controller.field.onChange(next),
		onBlur: controller.field.onBlur,
		invalid,
		id: lucField.id,
		describedBy: lucField.describedBy,
		isDirty: controller.fieldState.isDirty,
		isTouched: controller.fieldState.isTouched,
		isValidating,
		field: controller.field
	}) });
}
function humanize(path) {
	return (path.split(".").pop() ?? path).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^\w/, (character) => character.toUpperCase());
}
function buildSummaryErrors(form, fieldLabels) {
	const { errors, submitCount } = form.formState;
	if (submitCount === 0) return [];
	const items = [];
	for (const [path, error] of Object.entries(errors)) {
		if (!error) continue;
		const message = messageFromError(error);
		if (!message) continue;
		const ref = error.ref;
		items.push({
			id: path,
			label: fieldLabels?.[path] ?? humanize(path),
			message,
			...ref && typeof ref.focus === "function" ? { focus: () => {
				ref.focus?.();
				ref.scrollIntoView?.({
					block: "center",
					behavior: "smooth"
				});
			} } : {}
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
function RhfForm({ form, onSubmit, formatError, fieldLabels, summary = true, summaryTitle, children, ...props }) {
	const summaryErrors = buildSummaryErrors(form, fieldLabels);
	const [formError, setFormError] = useState(void 0);
	/**
	* RHF's `handleSubmit` runs validation, then either our handler or its own
	* `onInvalid` branch. Routing that through Luc UI's `Form` by *returning* a
	* status keeps one submit lifecycle instead of two competing ones.
	*/
	const submit = async (event) => {
		let outcome = "success";
		await form.handleSubmit(async (values, submitEvent) => {
			try {
				await onSubmit(values, submitEvent);
				setFormError(void 0);
			} catch (caught) {
				setFormError(formatError ? formatError(caught) : messageFromError(caught) ?? "Could not save your changes.");
				outcome = "error";
			}
		}, () => {
			outcome = "error";
		})(event);
		return outcome;
	};
	return /* @__PURE__ */ jsx(FormProvider, {
		...form,
		children: /* @__PURE__ */ jsxs(Form, {
			...props,
			onSubmit: submit,
			error: formError,
			children: [summary ? /* @__PURE__ */ jsx(FormErrorSummary, {
				errors: summaryErrors,
				title: summaryTitle
			}) : null, children]
		})
	});
}
//#endregion
export { FormField, RhfForm };

//# sourceMappingURL=react-hook-form.js.map