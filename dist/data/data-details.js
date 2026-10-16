"use client";
import { useMediaQuery } from "../hooks/use-media-query.js";
import { cn } from "../utils/cn.js";
import { Button } from "../components/button-base.js";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../components/sheet.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { RiTableLine } from "@remixicon/react";
//#region src/data/data-details.tsx
function DataDetails({ title, description, children, label = "Data", size = "xl", className, slot }) {
	const narrow = useMediaQuery("(max-width: 767px)");
	return /* @__PURE__ */ jsx("div", {
		"data-slot": slot,
		className: cn("min-w-0", className),
		children: /* @__PURE__ */ jsxs(Sheet, { children: [/* @__PURE__ */ jsx(SheetTrigger, {
			asChild: true,
			children: /* @__PURE__ */ jsx(Button, {
				size: "sm",
				variant: "ghost",
				leadingIcon: /* @__PURE__ */ jsx(RiTableLine, {}),
				"aria-label": label,
				children: label
			})
		}), /* @__PURE__ */ jsxs(SheetContent, {
			side: narrow ? "bottom" : "right",
			size,
			"data-details": "true",
			children: [/* @__PURE__ */ jsxs(SheetHeader, {
				icon: /* @__PURE__ */ jsx(RiTableLine, {}),
				children: [/* @__PURE__ */ jsx(SheetTitle, { children: title }), description ? /* @__PURE__ */ jsx(SheetDescription, { children: description }) : null]
			}), /* @__PURE__ */ jsx(SheetBody, {
				"data-slot": "data-details-body",
				children
			})]
		})] })
	});
}
//#endregion
export { DataDetails };

//# sourceMappingURL=data-details.js.map