"use client";
import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/product-tour/spotlight.tsx
/**
* Four scrim plates leave the highlighted rectangle genuinely interactive.
* A single shadow-based cut-out looks identical in a screenshot, but it blocks
* the target underneath; a guided product tour has to be able to explain an
* input that the reader can still use.
*/
function ProductTourSpotlight({ rect, viewport, visible, variant, onDismiss, dismissLabel }) {
	const safe = rect ?? {
		top: Math.round(viewport.height / 2),
		left: Math.round(viewport.width / 2),
		width: 0,
		height: 0
	};
	const bottom = safe.top + safe.height;
	const right = safe.left + safe.width;
	const plates = [
		{
			top: 0,
			left: 0,
			width: viewport.width,
			height: Math.max(0, safe.top)
		},
		{
			top: bottom,
			left: 0,
			width: viewport.width,
			height: Math.max(0, viewport.height - bottom)
		},
		{
			top: safe.top,
			left: 0,
			width: Math.max(0, safe.left),
			height: Math.max(0, safe.height)
		},
		{
			top: safe.top,
			left: right,
			width: Math.max(0, viewport.width - right),
			height: Math.max(0, safe.height)
		}
	];
	return /* @__PURE__ */ jsxs("div", {
		"aria-hidden": "true",
		"data-slot": "product-tour-spotlight",
		children: [plates.map((plate, index) => /* @__PURE__ */ jsx("button", {
			type: "button",
			tabIndex: -1,
			"aria-label": dismissLabel,
			onClick: onDismiss,
			className: "luc-product-tour__scrim",
			style: {
				top: plate.top,
				left: plate.left,
				width: plate.width,
				height: plate.height,
				opacity: visible ? 1 : 0
			}
		}, index)), rect ? /* @__PURE__ */ jsxs("div", {
			"aria-hidden": "true",
			"data-slot": "product-tour-target",
			"data-variant": variant,
			className: cn("luc-product-tour__target", visible && "is-visible"),
			style: {
				transform: `translate3d(${rect.left}px, ${rect.top}px, 0)`,
				width: rect.width,
				height: rect.height
			},
			children: [/* @__PURE__ */ jsx("span", { className: "luc-product-tour__target-rim" }), /* @__PURE__ */ jsx("span", { className: "luc-product-tour__target-aura" })]
		}) : null]
	});
}
//#endregion
export { ProductTourSpotlight };

//# sourceMappingURL=spotlight.js.map