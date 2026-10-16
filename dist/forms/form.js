"use client";
import { cn } from "../utils/cn.js";
import { Button } from "../components/button-base.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { createContext, useContext, useId, useRef, useState } from "react";
//#region src/forms/form.tsx
const FormStatusContext = createContext(null);
const FALLBACK_STATUS = {
	status: "idle",
	isSubmitting: false,
	submitAttempted: false,
	errors: [],
	setStatus: () => {},
	setError: () => {},
	markSubmitAttempted: () => {},
	resetStatus: () => {}
};
/**
* Reads the submit lifecycle. Returns inert defaults outside a `<Form>`, so a
* `SubmitButton` can sit in a toolbar without exploding.
*/
function useLucForm() {
	return useContext(FormStatusContext) ?? FALLBACK_STATUS;
}
function messageFromError(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
}
/**
* The form shell. Renders a real `<form>`, owns the submit lifecycle and
* publishes it through `useLucForm()`. It does not know what a field is.
*/
function Form({ children, className, onSubmit, onError, errors = [], error, errorMessage = "Something went wrong while saving. Please try again.", noValidate = true, ...props }) {
	const [status, setStatusState] = useState("idle");
	const [submitAttempted, setSubmitAttempted] = useState(false);
	const [internalError, setInternalError] = useState(void 0);
	const statusRef = useRef("idle");
	const setStatus = (next) => {
		statusRef.current = next;
		setStatusState(next);
	};
	const value = {
		status,
		isSubmitting: status === "submitting",
		submitAttempted,
		error: error ?? internalError,
		errors,
		setStatus,
		setError: setInternalError,
		markSubmitAttempted: () => setSubmitAttempted(true),
		resetStatus: () => {
			setInternalError(void 0);
			setSubmitAttempted(false);
			setStatus("idle");
		}
	};
	const handleSubmit = async (event) => {
		event.preventDefault();
		setSubmitAttempted(true);
		if (internalError) setInternalError(void 0);
		if (!onSubmit) return;
		setStatus("submitting");
		let outcome;
		try {
			outcome = await onSubmit(event);
		} catch (caught) {
			onError?.(caught);
			setInternalError(messageFromError(caught) ?? errorMessage);
			setStatus("error");
			return;
		}
		if (outcome) setStatus(outcome);
		else if (statusRef.current === "submitting") setStatus("success");
	};
	return /* @__PURE__ */ jsx(FormStatusContext.Provider, {
		value,
		children: /* @__PURE__ */ jsx("form", {
			"data-slot": "form",
			"data-status": status,
			noValidate,
			onSubmit: handleSubmit,
			className: cn("flex min-w-0 flex-col gap-6", className),
			...props,
			children
		})
	});
}
/**
* A submit button wired to the form lifecycle. The label does not change unless
* you ask it to — a button that renames itself mid-click is a layout shift.
*/
function SubmitButton({ loadingText, children, disabled, ...props }) {
	const { isSubmitting } = useLucForm();
	return /* @__PURE__ */ jsx(Button, {
		type: "submit",
		variant: "primary",
		loading: isSubmitting,
		disabled,
		loadingLabel: typeof loadingText === "string" ? loadingText : "Submitting",
		...props,
		children: isSubmitting && loadingText ? loadingText : children
	});
}
function FormActions({ align = "end", sticky = false, className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "form-actions",
		className: cn("flex flex-wrap items-center gap-2", align === "start" && "justify-start", align === "end" && "justify-end", align === "between" && "justify-between", sticky && "sticky bottom-0 z-[var(--z-sticky)] -mx-5 -mb-5 mt-2 border-t border-line-subtle bg-surface-overlay px-5 py-3 sm:-mx-6 sm:-mb-6 sm:px-6", className),
		...props
	});
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
function FormErrorSummary({ className, always = false, title = "Please fix the following before saving", errors: providedErrors, ...props }) {
	const { errors: contextErrors, error, submitAttempted } = useLucForm();
	const errors = providedErrors ?? contextErrors;
	if (!(always || submitAttempted) || errors.length === 0 && !error) return null;
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "form-error-summary",
		role: "alert",
		"aria-live": "assertive",
		className: cn("flex flex-col gap-2 rounded-lg border border-negative-line bg-surface-overlay p-3.5", "text-caption text-fg-secondary shadow-xs", className),
		...props,
		children: [
			/* @__PURE__ */ jsxs("p", {
				className: "flex items-center gap-2 text-label font-medium text-fg-negative",
				children: [/* @__PURE__ */ jsxs("svg", {
					viewBox: "0 0 16 16",
					"aria-hidden": "true",
					className: "size-4 shrink-0",
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
				}), title]
			}),
			error ? /* @__PURE__ */ jsx("p", {
				className: "text-fg-secondary",
				children: error
			}) : null,
			errors.length > 0 ? /* @__PURE__ */ jsx("ul", {
				className: "flex flex-col gap-1",
				children: errors.map((item, index) => /* @__PURE__ */ jsxs("li", {
					className: "flex gap-2 leading-[1.5]",
					children: [/* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						className: "text-fg-muted",
						children: "·"
					}), item.focus ? /* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => item.focus?.(),
						className: "luc-focus rounded-xs text-left text-fg-secondary underline decoration-line-strong decoration-1 underline-offset-2 luc-transition hover:text-fg-primary hover:decoration-line-accent",
						children: [/* @__PURE__ */ jsx("span", {
							className: "font-medium",
							children: item.label
						}), /* @__PURE__ */ jsxs("span", {
							className: "text-fg-muted",
							children: [" — ", item.message]
						})]
					}) : /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("span", {
						className: "font-medium text-fg-secondary",
						children: item.label
					}), /* @__PURE__ */ jsxs("span", {
						className: "text-fg-muted",
						children: [" — ", item.message]
					})] })]
				}, `${item.id ?? item.label}-${index}`))
			}) : null
		]
	});
}
/** Stable ids for a repeating group, so labels stay unique across rows. */
function useFieldIdPrefix(explicit) {
	const generated = useId();
	return explicit ?? `field-${generated}`;
}
//#endregion
export { Form, FormActions, FormErrorSummary, SubmitButton, useFieldIdPrefix, useLucForm };

//# sourceMappingURL=form.js.map