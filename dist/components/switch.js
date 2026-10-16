"use client";
import { cn } from "../utils/cn.js";
import { useField } from "./field.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Switch } from "radix-ui";
//#region src/components/switch.tsx
const sizeStyles = {
	sm: {
		root: "h-4 w-7",
		thumb: "size-3"
	},
	md: {
		root: "h-[22px] w-[38px]",
		thumb: "size-[18px]"
	}
};
function Switch$1({ className, label, description, size = "md", id, disabled, ...props }) {
	const field = useField();
	const styles = sizeStyles[size];
	const control = /* @__PURE__ */ jsx(Switch.Root, {
		"data-slot": "switch",
		id: id ?? field.id,
		disabled: disabled ?? field.disabled,
		"aria-describedby": props["aria-describedby"] ?? field.describedBy,
		className: cn("group/switch relative inline-flex shrink-0 items-center rounded-full border", "luc-transition luc-focus luc-hit", "border-line-strong bg-surface-sunken", "hover:border-line-accent", "data-[state=checked]:border-transparent data-[state=checked]:bg-accent-default", "data-[state=checked]:hover:bg-accent-hover", "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line-strong", styles.root, className),
		...props,
		children: /* @__PURE__ */ jsx(Switch.Thumb, { className: cn("pointer-events-none block rounded-full bg-fg-secondary shadow-xs", "will-change-transform", "[transition:transform_var(--motion-fast)_var(--ease-emphasized),background-color_var(--motion-fast)_var(--ease-standard)]", "translate-x-0.5 data-[state=checked]:translate-x-[calc(100%-2px)]", "data-[state=checked]:bg-accent-on-accent", "group-active/switch:scale-x-110", styles.thumb) })
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
export { Switch$1 as Switch };

//# sourceMappingURL=switch.js.map