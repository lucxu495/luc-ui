"use client";
import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Separator } from "radix-ui";
//#region src/components/separator.tsx
function Separator$1({ className, orientation = "horizontal", variant = "line", ...props }) {
	if (variant === "ornament") return /* @__PURE__ */ jsxs("div", {
		role: "separator",
		"data-slot": "separator",
		"data-orientation": orientation,
		className: cn("flex items-center justify-center gap-3 text-fg-disabled", className),
		...props,
		children: [
			/* @__PURE__ */ jsx("span", { className: "h-px w-8 bg-line-default" }),
			/* @__PURE__ */ jsx("span", { className: "size-1 rounded-full bg-line-strong" }),
			/* @__PURE__ */ jsx("span", { className: "h-px w-8 bg-line-default" })
		]
	});
	return /* @__PURE__ */ jsx(Separator.Root, {
		"data-slot": "separator",
		decorative: props.decorative ?? true,
		orientation,
		className: cn("shrink-0 bg-line-default", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className),
		...props
	});
}
//#endregion
export { Separator$1 as Separator };

//# sourceMappingURL=separator.js.map