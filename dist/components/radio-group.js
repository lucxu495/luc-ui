"use client";
import { cn } from "../utils/cn.js";
import { useField } from "./field.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { RadioGroup } from "radix-ui";
//#region src/components/radio-group.tsx
const RadioGroup$1 = RadioGroup.Root;
function Radio({ className, label, description, id, disabled, invalid, ...props }) {
	const field = useField();
	const control = /* @__PURE__ */ jsx(RadioGroup.Item, {
		"data-slot": "radio",
		id: id ?? field.id,
		disabled: disabled ?? field.disabled,
		"aria-invalid": (invalid ?? field.invalid) || void 0,
		"aria-describedby": props["aria-describedby"] ?? field.describedBy,
		className: cn("group/radio relative grid size-[18px] shrink-0 place-items-center rounded-full", "border border-line-strong bg-surface-sunken", "luc-transition luc-focus luc-hit", "hover:border-line-accent hover:bg-surface-interactive-hover", "data-[state=checked]:border-accent-default data-[state=checked]:bg-accent-soft", "disabled:cursor-not-allowed disabled:opacity-50", "aria-[invalid=true]:border-negative", className),
		...props,
		children: /* @__PURE__ */ jsx(RadioGroup.Indicator, {
			forceMount: true,
			className: cn("block size-2 rounded-full bg-accent-default", "[transition:transform_var(--motion-fast)_var(--ease-overshoot)]", "data-[state=checked]:scale-100 data-[state=unchecked]:scale-0")
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
export { Radio, RadioGroup$1 as RadioGroup };

//# sourceMappingURL=radio-group.js.map