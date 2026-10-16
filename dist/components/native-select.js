"use client";
import { cn } from "../utils/cn.js";
import { useField } from "./field.js";
import { inputShellClass } from "./input.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { RiArrowDownSLine } from "@remixicon/react";
//#region src/components/native-select.tsx
const sizeClass = {
	sm: "h-control-sm rounded-sm px-2.5 text-label",
	md: "h-control-md rounded-md px-3 text-label",
	lg: "h-control-lg rounded-md px-4 text-body"
};
function NativeSelect({ className, size = "md", invalid, options, placeholder, id, disabled, required, "aria-describedby": ariaDescribedBy, children, ...props }) {
	const field = useField();
	return /* @__PURE__ */ jsxs("div", {
		className: cn(inputShellClass, sizeClass[size], "pr-8", className),
		"data-size": size,
		children: [/* @__PURE__ */ jsxs("select", {
			id: id ?? field.id,
			"data-slot": "native-select",
			disabled: disabled ?? field.disabled,
			required: required ?? field.required,
			"aria-invalid": (invalid ?? field.invalid) || void 0,
			"aria-describedby": ariaDescribedBy ?? field.describedBy,
			className: cn("peer h-full w-full appearance-none bg-transparent text-inherit outline-none", "disabled:cursor-not-allowed disabled:text-fg-disabled", "[&>option]:bg-surface-overlay [&>option]:text-fg-primary"),
			...props,
			children: [
				placeholder ? /* @__PURE__ */ jsx("option", {
					value: "",
					disabled: true,
					children: placeholder
				}) : null,
				options?.map((option) => /* @__PURE__ */ jsx("option", {
					value: option.value,
					disabled: option.disabled,
					children: option.label
				}, option.value)),
				children
			]
		}), /* @__PURE__ */ jsx(RiArrowDownSLine, {
			"aria-hidden": "true",
			className: "pointer-events-none absolute end-2.5 size-4 text-fg-muted"
		})]
	});
}
//#endregion
export { NativeSelect };

//# sourceMappingURL=native-select.js.map