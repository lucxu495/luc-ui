"use client";
import { cn } from "../utils/cn.js";
import { useField } from "./field.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/input.tsx
const shellSizeClass = {
	sm: "h-control-sm rounded-sm text-label",
	md: "h-control-md rounded-md text-label",
	lg: "h-control-lg rounded-md text-body"
};
const iconPadClass = {
	sm: "pl-7 pr-2",
	md: "pl-8 pr-2.5",
	lg: "pl-9 pr-3"
};
const iconPosClass = {
	sm: "left-2",
	md: "left-2.5",
	lg: "left-3"
};
/**
* The icon size for each control density.
*
* The value belongs to the *slot*, never to the glyph: a provider icon ships
* its own `width`/`height` attributes (Remix Icon defaults to 24), and an
* `svg` is an inline box that sits on the text baseline inside its parent. A
* slot that only sets its own `size-4` therefore renders a 24px glyph 4px below
* centre — which is exactly how the V0.6 combobox search bug shipped. Combined
* with `inputAdornmentClass` the slot owns the geometry and the glyph fills it.
*/
const controlIconSizeClass = {
	sm: "size-3.5",
	md: "size-4",
	lg: "size-[18px]"
};
/**
* Shared leading/adornment icon slot. Every control that puts a glyph inside
* its chrome composes this so the icon is sized by the slot, centred by grid
* (not by a baseline guess), and never overflows the field.
*/
const inputAdornmentClass = cn("pointer-events-none grid shrink-0 place-items-center text-fg-muted luc-transition [&_svg]:size-full");
/**
* Shared input chrome. Every text-entry control in LUC UI is one of these
* shells so focus, hover, invalid and disabled states stay identical.
*/
const inputShellClass = cn("group/input relative flex w-full items-center gap-2", "border border-line-default bg-surface-sunken text-fg-primary", "shadow-well luc-transition", "hover:border-line-strong hover:bg-surface-interactive hover:shadow-rest", "focus-within:border-line-accent", "focus-within:shadow-[var(--glow-focus),inset_0_1px_0_0_color-mix(in_oklab,var(--accent-default)_12%,transparent)]", "has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-surface-sunken has-[:disabled]:border-line-subtle has-[:disabled]:shadow-none", "has-[[readonly]]:border-dashed has-[[readonly]]:bg-surface-canvas", "has-[[aria-readonly=true]]:border-dashed has-[[aria-readonly=true]]:bg-surface-canvas", "has-[[contenteditable=false]]:border-dashed has-[[contenteditable=false]]:bg-surface-canvas", "has-[[aria-invalid=true]]:border-negative has-[[aria-invalid=true]]:shadow-[0_0_0_3px_var(--negative-soft)]");
const inputElementClass = cn("peer h-full w-full min-w-0 bg-transparent text-inherit outline-none", "placeholder:text-fg-disabled", "disabled:cursor-not-allowed disabled:text-fg-disabled");
function Input({ className, inputClassName, size = "md", leadingIcon, trailingAction, invalid, disabled, readOnly, id, required, ...props }) {
	const field = useField();
	const isInvalid = invalid ?? field.invalid;
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "input-shell",
		className: cn(inputShellClass, shellSizeClass[size], className),
		"data-size": size,
		children: [
			leadingIcon ? /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: cn(inputAdornmentClass, "absolute top-1/2 -translate-y-1/2", "group-focus-within/input:text-fg-accent", iconPosClass[size], controlIconSizeClass[size]),
				children: leadingIcon
			}) : null,
			/* @__PURE__ */ jsx("input", {
				"data-slot": "input",
				id: id ?? field.id,
				required: required ?? field.required,
				disabled: disabled ?? field.disabled,
				readOnly: readOnly ?? field.readOnly,
				"aria-busy": field.busy || void 0,
				"aria-invalid": isInvalid || void 0,
				"aria-describedby": props["aria-describedby"] ?? field.describedBy,
				className: cn(inputElementClass, leadingIcon && iconPadClass[size], !leadingIcon && "px-2.5", inputClassName),
				...props
			}),
			trailingAction ? /* @__PURE__ */ jsx("span", {
				className: "flex shrink-0 items-center pr-1.5",
				children: trailingAction
			}) : null
		]
	});
}
//#endregion
export { Input, controlIconSizeClass, inputAdornmentClass, inputElementClass, inputShellClass };

//# sourceMappingURL=input.js.map