"use client";
import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Label } from "radix-ui";
//#region src/components/label.tsx
function Label$1({ className, children, required, size = "md", "aria-disabled": ariaDisabled, ...props }) {
	return /* @__PURE__ */ jsxs(Label.Root, {
		"data-slot": "label",
		"aria-disabled": ariaDisabled,
		className: cn("flex w-fit select-none items-center gap-1.5 font-medium text-fg-secondary", size === "sm" ? "text-caption" : "text-label", ariaDisabled && "text-fg-disabled", className),
		...props,
		children: [children, required ? /* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			className: "text-fg-negative",
			children: "*"
		}) : null]
	});
}
//#endregion
export { Label$1 as Label };

//# sourceMappingURL=label.js.map