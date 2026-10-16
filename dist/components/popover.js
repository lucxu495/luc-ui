"use client";
import { cn } from "../utils/cn.js";
import { jsx } from "react/jsx-runtime";
import { Popover } from "radix-ui";
//#region src/components/popover.tsx
const PopoverRoot = Popover.Root;
const PopoverTrigger = Popover.Trigger;
const PopoverAnchor = Popover.Anchor;
const PopoverClose = Popover.Close;
const widthClass = {
	auto: "",
	sm: "w-64",
	md: "w-80",
	lg: "w-[26rem]"
};
/**
* LUC Popover surface. Layout only — compose with `Stack`/`Section` inside.
* Enter/exit use the shared overlay keyframes so every floating surface in LUC
* UI arrives the same way.
*/
function PopoverContent({ className, width = "auto", sideOffset = 6, align = "center", ...props }) {
	return /* @__PURE__ */ jsx(Popover.Portal, { children: /* @__PURE__ */ jsx(Popover.Content, {
		"data-slot": "popover",
		align,
		sideOffset,
		className: cn("z-[var(--z-popover)] origin-[var(--radix-popover-content-transform-origin)]", "rounded-lg border border-line-default bg-surface-overlay p-3 text-fg-primary luc-float luc-settle", "data-[state=open]:animate-[luc-anchored-in_var(--motion-normal)_var(--ease-enter)]", "data-[state=closed]:animate-[luc-anchored-out_var(--motion-fast)_var(--ease-exit)]", widthClass[width], className),
		...props
	}) });
}
//#endregion
export { PopoverAnchor, PopoverClose, PopoverContent, PopoverRoot, PopoverTrigger };

//# sourceMappingURL=popover.js.map