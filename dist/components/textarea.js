"use client";
import { cn } from "../utils/cn.js";
import { useField } from "./field.js";
import { inputElementClass, inputShellClass } from "./input.js";
import { jsx } from "react/jsx-runtime";
//#region src/components/textarea.tsx
const sizeClass = {
	sm: "min-h-16 rounded-sm px-2 py-1.5 text-label",
	md: "min-h-20 rounded-md px-2.5 py-2 text-label",
	lg: "min-h-24 rounded-md px-3 py-2.5 text-body"
};
function Textarea({ className, size = "md", invalid, autoResize = false, id, required, disabled, readOnly, rows = 4, ...props }) {
	const field = useField();
	const isInvalid = invalid ?? field.invalid;
	return /* @__PURE__ */ jsx("div", {
		className: cn(inputShellClass, "items-start", sizeClass[size], className),
		"data-size": size,
		children: /* @__PURE__ */ jsx("textarea", {
			"data-slot": "textarea",
			id: id ?? field.id,
			rows,
			required: required ?? field.required,
			disabled: disabled ?? field.disabled,
			readOnly: readOnly ?? field.readOnly,
			"aria-busy": field.busy || void 0,
			"aria-invalid": isInvalid || void 0,
			"aria-describedby": props["aria-describedby"] ?? field.describedBy,
			className: cn(inputElementClass, "luc-transition resize-y py-0 leading-[1.55]", autoResize && "[field-sizing:content] resize-none"),
			...props
		})
	});
}
//#endregion
export { Textarea };

//# sourceMappingURL=textarea.js.map