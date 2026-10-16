"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { useMotionProfile } from "./intensity.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/motion/marquee.tsx
const edgeMask = "linear-gradient(to right, transparent, black 6%, black 94%, transparent)";
/**
* LUC Marquee — a strip that never stops, used sparingly.
*
* A marquee is loud, so it is reserved for content that is genuinely a stream:
* a logo wall, a ticker of live values, a wall of contributor names, a long
* quote that will not fit. It is never a way to fit more cards on a page.
*
* Implementation notes that matter:
*
*  - The track is rendered **twice**: the first copy is the real content, the
*    second is `aria-hidden`, so a screen reader hears the list once.
*  - Each copy is shifted by exactly its own width, so the loop is seamless at
*    any content length without measuring anything in JavaScript.
*  - The trailing gutter is padding *inside* the copy rather than a flex `gap`
*    on the parent — otherwise one gap's worth of drift accumulates per loop.
*  - `pauseOnHover` is on by default: an unreadable strip is a usability defect,
*    not a style choice.
*  - Reduced motion and `functional` intensity stop the drift entirely, leaving
*    a normal, scrollable row.
*/
function Marquee({ className, children, speed = 34, direction = "left", gap = "2.5rem", pauseOnHover = true, fade = true, style, ...props }) {
	const reduced = useReducedMotion();
	const profile = useMotionProfile();
	const animate = !reduced && profile.ambient;
	const vertical = direction === "up" || direction === "down";
	const track = (clone) => /* @__PURE__ */ jsx("div", {
		"aria-hidden": clone || void 0,
		"data-slot": "marquee-copy",
		className: cn("flex w-max shrink-0 items-center", vertical ? "flex-col" : "flex-row", animate && (vertical ? "luc-marquee-y" : "luc-marquee-x"), direction === "right" && "luc-marquee-reverse", direction === "down" && "luc-marquee-reverse"),
		style: {
			columnGap: gap,
			rowGap: gap,
			paddingInlineEnd: vertical ? void 0 : gap,
			paddingBlockEnd: vertical ? gap : void 0,
			animationDuration: `${speed}s`
		},
		children
	}, clone ? "clone" : "source");
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "marquee",
		"data-direction": direction,
		className: cn("relative flex overflow-hidden", vertical ? "flex-col" : "flex-row", pauseOnHover && "luc-marquee-pause", className),
		style: {
			...fade && !vertical ? {
				maskImage: edgeMask,
				WebkitMaskImage: edgeMask
			} : null,
			...style
		},
		...props,
		children: [track(false), animate ? track(true) : null]
	});
}
//#endregion
export { Marquee };

//# sourceMappingURL=marquee.js.map