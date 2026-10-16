"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { duration, easing } from "./tokens.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
import { AnimatePresence, motion } from "motion/react";
//#region src/motion/collapse.tsx
function Collapse({ className, open, onOpenChange, title, description, aside, children, size = "md", variant = "plain", ...props }) {
	const reduced = useReducedMotion();
	const contentId = useId();
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "collapse",
		"data-state": open ? "open" : "closed",
		className: cn("min-w-0", variant === "card" && "rounded-lg border border-line-subtle bg-surface-default", className),
		...props,
		children: [/* @__PURE__ */ jsxs("button", {
			type: "button",
			"aria-expanded": open,
			"aria-controls": contentId,
			onClick: () => onOpenChange?.(!open),
			className: cn("luc-focus luc-transition flex w-full items-center justify-between gap-3 text-left", size === "sm" ? "px-3 py-2" : "px-4 py-3", "text-label font-medium text-fg-secondary hover:text-fg-primary"),
			children: [/* @__PURE__ */ jsxs("span", {
				className: "flex min-w-0 flex-col gap-0.5",
				children: [/* @__PURE__ */ jsx("span", {
					className: "truncate",
					children: title
				}), description ? /* @__PURE__ */ jsx("span", {
					className: "text-caption font-normal text-fg-muted",
					children: description
				}) : null]
			}), /* @__PURE__ */ jsxs("span", {
				className: "flex shrink-0 items-center gap-3",
				children: [aside, /* @__PURE__ */ jsx(motion.span, {
					"aria-hidden": "true",
					className: "text-fg-muted",
					animate: { rotate: open ? 180 : 0 },
					transition: reduced ? { duration: 0 } : {
						duration: duration.fast,
						ease: easing.standard
					},
					children: /* @__PURE__ */ jsx("svg", {
						width: "14",
						height: "14",
						viewBox: "0 0 16 16",
						fill: "none",
						stroke: "currentColor",
						strokeWidth: "1.6",
						children: /* @__PURE__ */ jsx("path", {
							d: "M4 6.5 8 10.5l4-4",
							strokeLinecap: "round",
							strokeLinejoin: "round"
						})
					})
				})]
			})]
		}), /* @__PURE__ */ jsx(AnimatePresence, {
			initial: false,
			children: open ? /* @__PURE__ */ jsx(motion.div, {
				id: contentId,
				"data-slot": "collapse-content",
				initial: reduced ? false : {
					height: 0,
					opacity: 0
				},
				animate: {
					height: "auto",
					opacity: 1
				},
				exit: reduced ? { opacity: 1 } : {
					height: 0,
					opacity: 0
				},
				transition: reduced ? { duration: 0 } : {
					height: {
						duration: duration.slow,
						ease: easing.enter
					},
					opacity: { duration: duration.fast }
				},
				className: "overflow-hidden",
				children: /* @__PURE__ */ jsx("div", {
					className: cn(size === "sm" ? "px-3 pb-2" : "px-4 pb-4", "min-w-0"),
					children
				})
			}, "content") : null
		})]
	});
}
//#endregion
export { Collapse };

//# sourceMappingURL=collapse.js.map