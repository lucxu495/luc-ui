"use client";
import { cn } from "../utils/cn.js";
import { Spinner } from "./spinner.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { createContext, useContext, useId } from "react";
//#region src/components/field.tsx
const FieldContext = createContext(null);
/**
* Read field wiring inside a custom control. Returns safe defaults outside a
* `<Field>`, so every control also works standalone.
*/
function useField() {
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
		groupLabeled: context?.groupLabeled ?? false
	};
}
/**
* Composes a labelled, described, validatable control.
*
* The field owns ids and ARIA wiring; the control owns its visuals. This is the
* only place in LUC UI where `<label>` semantics are decided.
*/
function Field({ children, id, label, description, error, validating = false, success, required = false, disabled = false, readOnly = false, labelHint, className, orientation = "vertical" }) {
	const generatedId = useId();
	const fieldId = id ?? `field-${generatedId}`;
	const labelId = label ? `${fieldId}-label` : void 0;
	const isBusy = Boolean(validating) && !error;
	const descriptionId = description && !error && !success && !isBusy ? `${fieldId}-description` : void 0;
	const errorId = error ? `${fieldId}-error` : void 0;
	const statusId = isBusy ? `${fieldId}-status` : success ? `${fieldId}-success` : void 0;
	const describedBy = [
		descriptionId,
		errorId,
		statusId
	].filter(Boolean).join(" ") || void 0;
	return /* @__PURE__ */ jsx(FieldContext.Provider, {
		value: {
			id: fieldId,
			labelId,
			describedBy,
			hasLabel: Boolean(label),
			invalid: Boolean(error),
			disabled,
			readOnly,
			busy: isBusy,
			required,
			groupLabeled: false
		},
		children: /* @__PURE__ */ jsxs("div", {
			"data-slot": "field",
			"data-invalid": error ? true : void 0,
			"data-busy": isBusy || void 0,
			className: cn("flex min-w-0 gap-1.5", orientation === "vertical" ? "flex-col" : "flex-row items-center justify-between gap-4", className),
			children: [
				label ? /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-1.5",
					children: [/* @__PURE__ */ jsxs("label", {
						id: labelId,
						htmlFor: fieldId,
						className: "text-label font-medium text-fg-secondary data-[disabled]:text-fg-disabled",
						"data-disabled": disabled || void 0,
						children: [label, required ? /* @__PURE__ */ jsx("span", {
							"aria-hidden": "true",
							className: "ml-0.5 text-fg-accent",
							children: "*"
						}) : null]
					}), labelHint]
				}) : null,
				/* @__PURE__ */ jsx("div", {
					"data-disabled": disabled || void 0,
					className: cn(orientation === "vertical" ? "flex flex-col gap-1.5" : "shrink-0"),
					children
				}),
				error ? /* @__PURE__ */ jsxs("p", {
					id: errorId,
					role: "alert",
					className: "flex items-start gap-1.5 text-caption text-fg-negative",
					children: [/* @__PURE__ */ jsxs("svg", {
						viewBox: "0 0 16 16",
						"aria-hidden": "true",
						className: "mt-px size-3.5 shrink-0",
						children: [
							/* @__PURE__ */ jsx("circle", {
								cx: "8",
								cy: "8",
								r: "6.25",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "1.4"
							}),
							/* @__PURE__ */ jsx("path", {
								d: "M8 5.25v3.5",
								stroke: "currentColor",
								strokeWidth: "1.4",
								strokeLinecap: "round"
							}),
							/* @__PURE__ */ jsx("circle", {
								cx: "8",
								cy: "11",
								r: "0.85",
								fill: "currentColor"
							})
						]
					}), error]
				}) : isBusy ? /* @__PURE__ */ jsxs("p", {
					id: statusId,
					className: "flex items-center gap-1.5 text-caption text-fg-muted",
					children: [/* @__PURE__ */ jsx(Spinner, {
						size: 14,
						label: null,
						className: "text-fg-muted"
					}), typeof validating === "boolean" ? "Checking…" : validating]
				}) : success ? /* @__PURE__ */ jsxs("p", {
					id: statusId,
					className: "flex items-start gap-1.5 text-caption text-fg-positive",
					children: [/* @__PURE__ */ jsxs("svg", {
						viewBox: "0 0 16 16",
						"aria-hidden": "true",
						className: "mt-px size-3.5 shrink-0",
						children: [/* @__PURE__ */ jsx("circle", {
							cx: "8",
							cy: "8",
							r: "6.25",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "1.4"
						}), /* @__PURE__ */ jsx("path", {
							d: "M5.4 8.2 7.1 9.9l3.5-3.9",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "1.4",
							strokeLinecap: "round",
							strokeLinejoin: "round"
						})]
					}), success]
				}) : description ? /* @__PURE__ */ jsx("p", {
					id: descriptionId,
					className: "text-caption text-fg-muted",
					children: description
				}) : null
			]
		})
	});
}
/**
* A real `<fieldset>`/`<legend>` group. Use it when several controls answer one
* question (a set of checkboxes, a radio group, a repeatable block) — the legend
* is announced with each control, which a `<div>` with a heading is not.
*/
function Fieldset({ legend, description, children, className, disabled, legendHint, ...props }) {
	const generatedId = useId();
	const descriptionId = description ? `fieldset-${generatedId}-description` : void 0;
	return /* @__PURE__ */ jsxs("fieldset", {
		"data-slot": "fieldset",
		disabled,
		"aria-describedby": descriptionId,
		className: cn("flex min-w-0 flex-col gap-3 border-0 p-0", disabled && "opacity-60", className),
		...props,
		children: [
			/* @__PURE__ */ jsxs("legend", {
				className: cn("flex w-full items-center justify-between gap-3 p-0", description ? "mb-1" : "mb-3"),
				children: [/* @__PURE__ */ jsx("span", {
					className: "text-label font-medium text-fg-secondary",
					children: legend
				}), legendHint]
			}),
			description ? /* @__PURE__ */ jsx("p", {
				id: descriptionId,
				className: "text-caption text-fg-muted",
				children: description
			}) : null,
			children
		]
	});
}
/**
* Lays fields out in a responsive grid. It owns spacing only: every child keeps
* its own `<Field>` wiring, so the group never becomes a form engine.
*/
function FieldGroup({ columns = 2, className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "field-group",
		className: cn("grid gap-x-5 gap-y-4", columns === 1 && "grid-cols-1", columns === 2 && "grid-cols-1 sm:grid-cols-2", columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", className),
		...props
	});
}
//#endregion
export { Field, FieldGroup, Fieldset, useField };

//# sourceMappingURL=field.js.map