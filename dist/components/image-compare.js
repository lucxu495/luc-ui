"use client";
import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId, useState } from "react";
//#region src/components/image-compare.tsx
const aspectClass = {
	square: "aspect-square",
	video: "aspect-video",
	wide: "aspect-[21/9]"
};
function ImageCompare({ before, after, value, defaultValue = 50, onValueChange, label = "Compare images", beforeLabel = "Before", afterLabel = "After", aspect = "video", className, ...props }) {
	const controlled = value !== void 0;
	const [internal, setInternal] = useState(defaultValue);
	const position = Math.min(Math.max(controlled ? value : internal, 0), 100);
	const inputId = useId();
	const commit = (next) => {
		if (!controlled) setInternal(next);
		onValueChange?.(next);
	};
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "image-compare",
		className: cn("relative overflow-hidden rounded-lg border border-line-subtle bg-surface-sunken luc-rest", aspectClass[aspect], className),
		...props,
		children: [
			/* @__PURE__ */ jsx("img", {
				src: after.src,
				alt: after.alt,
				className: "absolute inset-0 size-full object-cover",
				draggable: false
			}),
			/* @__PURE__ */ jsx("img", {
				src: before.src,
				alt: before.alt,
				draggable: false,
				style: { clipPath: `inset(0 ${100 - position}% 0 0)` },
				className: "absolute inset-0 size-full object-cover"
			}),
			/* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: "absolute top-2 left-2 rounded-sm bg-surface-overlay/80 px-1.5 py-0.5 text-micro text-fg-secondary backdrop-blur-sm",
				children: beforeLabel
			}),
			/* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: "absolute top-2 right-2 rounded-sm bg-surface-overlay/80 px-1.5 py-0.5 text-micro text-fg-secondary backdrop-blur-sm",
				children: afterLabel
			}),
			/* @__PURE__ */ jsx("label", {
				htmlFor: inputId,
				className: "sr-only",
				children: label
			}),
			/* @__PURE__ */ jsx("input", {
				id: inputId,
				type: "range",
				min: 0,
				max: 100,
				step: 1,
				value: position,
				onChange: (event) => commit(Number(event.target.value)),
				className: "peer absolute inset-0 size-full cursor-ew-resize appearance-none bg-transparent opacity-0"
			}),
			/* @__PURE__ */ jsxs("span", {
				"aria-hidden": "true",
				style: { left: `${position}%` },
				className: cn("pointer-events-none absolute inset-y-0 -translate-x-1/2 luc-transition", "peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring"),
				children: [/* @__PURE__ */ jsx("span", { className: "block h-full w-0.5 bg-surface-overlay shadow-[0_0_0_1px_var(--line-strong)]" }), /* @__PURE__ */ jsxs("span", {
					className: "absolute top-1/2 left-1/2 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line-strong bg-surface-overlay text-fg-secondary shadow-rest",
					children: [/* @__PURE__ */ jsx("span", { className: "block h-3 w-0.5 bg-fg-muted" }), /* @__PURE__ */ jsx("span", { className: "absolute h-3 w-0.5 translate-x-1.5 bg-fg-muted" })]
				})]
			}),
			/* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: "sr-only luc-numeric",
				children: position
			})
		]
	});
}
//#endregion
export { ImageCompare };

//# sourceMappingURL=image-compare.js.map