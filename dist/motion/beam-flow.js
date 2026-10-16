"use client";
import { cn } from "../utils/cn.js";
import { useMotionProfile } from "./intensity.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
//#region src/motion/beam-flow.tsx
const stateStroke = {
	idle: "var(--line-strong)",
	active: "var(--accent-default)",
	success: "var(--positive)",
	error: "var(--negative)"
};
function smoothPath(points) {
	if (points.length === 0) return "";
	if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
	const at = (index) => points[Math.min(Math.max(index, 0), points.length - 1)];
	let path = `M ${points[0].x} ${points[0].y}`;
	for (let index = 0; index < points.length - 1; index += 1) {
		const previous = at(index - 1);
		const start = at(index);
		const end = at(index + 1);
		const next = at(index + 2);
		const c1x = start.x + (end.x - previous.x) / 6;
		const c1y = start.y + (end.y - previous.y) / 6;
		const c2x = end.x - (next.x - start.x) / 6;
		const c2y = end.y - (next.y - start.y) / 6;
		path += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${end.x} ${end.y}`;
	}
	return path;
}
/**
* LUC BeamFlow — a connector that shows something moving between two places.
*
* Built for the surfaces LUC UI is used on beyond dashboards: an AI request
* travelling model to tool to answer, an ingest pipeline, an integration
* diagram, an onboarding map. It is an overlay, so the nodes themselves stay
* ordinary LUC surfaces (Card, Badge, IconButton) positioned by the caller.
*
*   <div className="relative grid grid-cols-3">
*     <Node /> <Node /> <Node />
*     <BeamFlow points={[{ x: 12, y: 50 }, { x: 50, y: 50 }, { x: 88, y: 50 }]} />
*   </div>
*
* The path is drawn in a 0-100 viewBox with `preserveAspectRatio="none"` and
* `non-scaling-stroke`, so the connector is responsive by construction and
* needs no ResizeObserver: the whole component is one SVG and two animations.
*/
function BeamFlow({ className, points, state = "active", width = 1.5, speed = 3.4, label, static: isStatic = false, ...props }) {
	const profile = useMotionProfile();
	const path = smoothPath(points);
	const animate = !isStatic && profile.ambient && points.length > 1;
	const stroke = stateStroke[state];
	const first = points[0];
	const last = points[points.length - 1];
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "beam-flow",
		"data-state": state,
		className: cn("pointer-events-none absolute inset-0", className),
		...label ? {
			role: "img",
			"aria-label": label
		} : { "aria-hidden": "true" },
		...props,
		children: /* @__PURE__ */ jsxs("svg", {
			viewBox: "0 0 100 100",
			preserveAspectRatio: "none",
			className: "size-full overflow-visible",
			children: [
				/* @__PURE__ */ jsx("path", {
					d: path,
					fill: "none",
					stroke,
					strokeWidth: width,
					strokeLinecap: "round",
					strokeDasharray: state === "idle" ? "2 3" : void 0,
					vectorEffect: "non-scaling-stroke",
					opacity: state === "idle" ? .5 : .28
				}),
				animate ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("path", {
					d: path,
					fill: "none",
					stroke,
					strokeWidth: width + 1.4,
					strokeLinecap: "round",
					pathLength: 100,
					strokeDasharray: "9 91",
					vectorEffect: "non-scaling-stroke",
					className: "luc-beam-travel",
					style: { animationDuration: `${speed}s` }
				}), /* @__PURE__ */ jsx("path", {
					d: path,
					fill: "none",
					stroke,
					strokeWidth: width + 4,
					strokeLinecap: "round",
					pathLength: 100,
					strokeDasharray: "4 96",
					vectorEffect: "non-scaling-stroke",
					className: "luc-beam-travel",
					opacity: .16,
					style: { animationDuration: `${speed * 1.55}s` }
				})] }) : null,
				[first, last].map((point, index) => point ? /* @__PURE__ */ jsx("circle", {
					cx: point.x,
					cy: point.y,
					r: 2.4,
					fill: stroke,
					vectorEffect: "non-scaling-stroke",
					opacity: .9
				}, index) : null)
			]
		})
	});
}
//#endregion
export { BeamFlow };

//# sourceMappingURL=beam-flow.js.map