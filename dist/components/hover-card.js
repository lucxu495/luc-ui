"use client";
import { cn } from "../utils/cn.js";
import { jsx } from "react/jsx-runtime";
import { HoverCard } from "radix-ui";
//#region src/components/hover-card.tsx
/**
* LUC HoverCard — a rich preview on hover, for a *pointer*.
*
* The distinction from Tooltip is the whole reason this exists:
*
*   Tooltip    a short label for one control      ~500ms, keyboard-focusable
*   HoverCard  a preview with content and actions ~700ms, pointer only
*
* A HoverCard is never the only way to reach its content: the trigger is
* focusable and the card follows focus, and anything the card offers must also
* exist on the page it previews. That is why `openDelay` defaults high — a
* preview that fires while the pointer crosses a list is worse than none.
*/
const HoverCard$1 = HoverCard.Root;
const HoverCardTrigger = HoverCard.Trigger;
const HoverCardPortal = HoverCard.Portal;
const widthClass = {
	sm: "w-64",
	md: "w-80",
	lg: "w-96"
};
function HoverCardContent({ className, width = "md", align = "center", sideOffset = 8, ...props }) {
	return /* @__PURE__ */ jsx(HoverCard.Portal, { children: /* @__PURE__ */ jsx(HoverCard.Content, {
		"data-slot": "hover-card",
		align,
		sideOffset,
		className: cn("z-[var(--z-popover)] overflow-hidden rounded-lg border border-line-default p-4 text-fg-primary", "bg-surface-overlay luc-float luc-settle", "origin-[var(--radix-hover-card-content-transform-origin)]", "data-[state=open]:animate-[luc-anchored-in_var(--motion-fast)_var(--ease-enter)]", "data-[state=closed]:animate-[luc-anchored-out_var(--motion-fast)_var(--ease-exit)]", widthClass[width], className),
		...props
	}) });
}
//#endregion
export { HoverCard$1 as HoverCard, HoverCardContent, HoverCardPortal, HoverCardTrigger };

//# sourceMappingURL=hover-card.js.map