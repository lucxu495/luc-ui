"use client";
import { cn } from "../utils/cn.js";
import { RiCheckLine, RiMinusLine } from "../icons/animated.js";
import { useField } from "./field.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Checkbox } from "radix-ui";
//#region src/components/checkbox.tsx
function Checkbox$1({ className, label, description, invalid, id, disabled, ...props }) {
	const field = useField();
	const control = /* @__PURE__ */ jsx(Checkbox.Root, {
		"data-slot": "checkbox",
		id: id ?? field.id,
		disabled: disabled ?? field.disabled,
		"aria-invalid": (invalid ?? field.invalid) || void 0,
		"aria-describedby": props["aria-describedby"] ?? field.describedBy,
		className: cn("group/cb relative grid size-[18px] shrink-0 place-items-center rounded-[5px]", "border border-line-strong bg-surface-sunken", "luc-transition luc-focus luc-hit", "hover:border-line-accent hover:bg-surface-interactive-hover", "data-[state=checked]:border-transparent data-[state=checked]:bg-accent-default", "data-[state=indeterminate]:border-transparent data-[state=indeterminate]:bg-accent-default", "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line-strong", "aria-[invalid=true]:border-negative aria-[invalid=true]:shadow-[0_0_0_3px_var(--negative-soft)]", className),
		...props,
		children: /* @__PURE__ */ jsx(Checkbox.Indicator, {
			forceMount: true,
			className: "grid size-full place-items-center text-accent-on-accent",
			children: /* @__PURE__ */ jsxs("span", {
				"aria-hidden": "true",
				className: "relative grid size-full place-items-center",
				children: [/* @__PURE__ */ jsx(RiCheckLine, { className: "absolute size-[15px] opacity-0 transition-opacity duration-150 group-data-[state=checked]/cb:opacity-100" }), /* @__PURE__ */ jsx(RiMinusLine, { className: "absolute size-[15px] opacity-0 transition-opacity duration-150 group-data-[state=indeterminate]/cb:opacity-100" })]
			})
		})
	});
	if (!label && !description) return control;
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-start gap-2.5",
		children: [control, /* @__PURE__ */ jsxs("div", {
			className: "flex min-w-0 flex-col gap-0.5",
			children: [label ? /* @__PURE__ */ jsx("label", {
				htmlFor: id ?? field.id,
				className: "cursor-pointer select-none text-label leading-[18px] text-fg-primary",
				children: label
			}) : null, description ? /* @__PURE__ */ jsx("p", {
				className: "text-caption text-fg-muted",
				children: description
			}) : null]
		})]
	});
}
//#endregion
export { Checkbox$1 as Checkbox };

//# sourceMappingURL=checkbox.js.map