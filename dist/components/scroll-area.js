"use client";
import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { ScrollArea } from "radix-ui";
//#region src/components/scroll-area.tsx
/**
* LUC ScrollArea — a scroll region with a themed, always-consistent scrollbar.
*
* Why a component and not `overflow-auto`: a native scrollbar is painted by the
* platform, so it is a different width, colour and corner radius on every OS,
* it disappears on macOS until you scroll, and it overlaps the last row of a
* table. Radix gives us one scrollbar element we can style, plus
* `type="scroll"` / `"hover"` / `"always"` / `"auto"` behaviour and the
* `ScrollAreaCorner` that keeps two axes from overlapping.
*
* It is the missing piece under several overlays (a long Command list, a Sheet's
* body, a DataTable's horizontal axis), so it lives in the core entry rather
* than in a subpath.
*/
const ScrollAreaRoot = ScrollArea.Root;
function ScrollArea$1({ className, viewportClassName, type = "hover", scrollbarSize = 10, corner = true, children, ...props }) {
	const scrollbarClass = cn("flex touch-none select-none p-0.5 luc-transition", "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2.5 data-[orientation=vertical]:border-l data-[orientation=vertical]:border-l-transparent", "data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:border-t data-[orientation=horizontal]:border-t-transparent");
	const thumbClass = cn("relative flex-1 rounded-full bg-line-strong", "before:absolute before:top-1/2 before:left-1/2 before:size-full before:min-h-6 before:min-w-6 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']", "hover:bg-fg-disabled");
	return /* @__PURE__ */ jsxs(ScrollArea.Root, {
		"data-slot": "scroll-area",
		type,
		scrollHideDelay: 600,
		className: cn("relative overflow-hidden", className),
		...props,
		children: [
			/* @__PURE__ */ jsx(ScrollArea.Viewport, {
				"data-slot": "scroll-area-viewport",
				tabIndex: 0,
				className: cn("size-full rounded-[inherit] outline-none luc-focus-inset", viewportClassName),
				children
			}),
			/* @__PURE__ */ jsx(ScrollArea.Scrollbar, {
				orientation: "vertical",
				style: { width: scrollbarSize },
				className: scrollbarClass,
				children: /* @__PURE__ */ jsx(ScrollArea.Thumb, { className: thumbClass })
			}),
			/* @__PURE__ */ jsx(ScrollArea.Scrollbar, {
				orientation: "horizontal",
				style: { height: scrollbarSize },
				className: scrollbarClass,
				children: /* @__PURE__ */ jsx(ScrollArea.Thumb, { className: thumbClass })
			}),
			corner ? /* @__PURE__ */ jsx(ScrollArea.Corner, { className: "bg-transparent" }) : null
		]
	});
}
//#endregion
export { ScrollArea$1 as ScrollArea, ScrollAreaRoot };

//# sourceMappingURL=scroll-area.js.map