"use client";
import { cn } from "../utils/cn.js";
import { useMotionProfile } from "./intensity.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
//#region src/motion/selection-beam.tsx
function readBox(node) {
	if (!node) return null;
	const rect = node.getBoundingClientRect();
	if (rect.width === 0 && rect.height === 0) return null;
	return {
		left: rect.left,
		top: rect.top,
		right: rect.right,
		bottom: rect.bottom,
		width: rect.width,
		height: rect.height
	};
}
function sameBox(a, b) {
	if (a === b) return true;
	if (!a || !b) return false;
	return Math.abs(a.left - b.left) < .5 && Math.abs(a.top - b.top) < .5 && Math.abs(a.width - b.width) < .5 && Math.abs(a.height - b.height) < .5;
}
/**
* LUC `SelectionBeam` — the line that connects two things that are actually
* connected.
*
* Table selection → chart marker → inspector is the interaction LUC UI is best
* at, and the missing piece was always the *visible* link: the user selects a
* row, a marker highlights, a panel fills in, and nothing says those three are
* one gesture. `SelectionBeam` measures the two live DOM nodes and draws a
* travelling packet between them, so the connection is legible without the
* product hard-coding an arrow.
*
* It is deliberately provider-agnostic: it takes two refs and knows nothing
* about tables or charts. Any pair of elements can be linked — a metric card and
* its breakdown, a step and the state it produced, an image thumbnail and the
* canvas that owns it.
*
* Performance and safety:
*
*  - The overlay is `position: fixed`, so it needs no positioned ancestor and
*    cannot be clipped by one; it simply follows the viewport.
*  - Measurement is rAF-coalesced and driven by `ResizeObserver` plus a passive
*    capture-phase scroll listener, so a beam attached inside a scrolling pane
*    stays attached.
*  - It renders nothing until the first measurement, so SSR output is empty and
*    there is no hydration mismatch.
*  - Both geometry and the travelling packet are disabled under reduced motion;
*    the rail remains, because the *relationship* is information.
*/
function SelectionBeam({ from, to, active = true, tone = "accent", width = 1.5, speed = 3.6, bow = .32, revision, label, className }) {
	const profile = useMotionProfile();
	const [boxes, setBoxes] = useState(null);
	const frame = useRef(null);
	const measure = useCallback(() => {
		frame.current = null;
		const nextFrom = readBox(from.current);
		const nextTo = readBox(to.current);
		if (!nextFrom || !nextTo) {
			setBoxes((previous) => previous === null ? previous : null);
			return;
		}
		setBoxes((previous) => previous && sameBox(previous.from, nextFrom) && sameBox(previous.to, nextTo) ? previous : {
			from: nextFrom,
			to: nextTo
		});
	}, [from, to]);
	const schedule = useCallback(() => {
		if (frame.current !== null) return;
		frame.current = requestAnimationFrame(measure);
	}, [measure]);
	useEffect(() => {
		schedule();
		window.addEventListener("resize", schedule);
		window.addEventListener("scroll", schedule, {
			capture: true,
			passive: true
		});
		const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => schedule());
		if (observer) {
			if (from.current) observer.observe(from.current);
			if (to.current) observer.observe(to.current);
		}
		return () => {
			window.removeEventListener("resize", schedule);
			window.removeEventListener("scroll", schedule, { capture: true });
			observer?.disconnect();
			if (frame.current !== null) cancelAnimationFrame(frame.current);
			frame.current = null;
		};
	}, [
		from,
		revision,
		schedule,
		to
	]);
	if (!boxes) return null;
	const { from: a, to: b } = boxes;
	const forwards = b.left + b.width / 2 >= a.left + a.width / 2;
	const start = {
		x: forwards ? a.right : a.left,
		y: a.top + a.height / 2
	};
	const end = {
		x: forwards ? b.left : b.right,
		y: b.top + b.height / 2
	};
	const run = end.x - start.x;
	const control = {
		x: start.x + run * (.5 + bow * .5),
		y: start.y
	};
	const control2 = {
		x: end.x - run * (.5 + bow * .5),
		y: end.y
	};
	const path = `M ${start.x} ${start.y} C ${control.x} ${control.y} ${control2.x} ${control2.y} ${end.x} ${end.y}`;
	const stroke = tone === "accent" ? "var(--accent-default)" : "var(--line-strong)";
	const travelling = active && profile.ambient;
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "selection-beam",
		"data-active": active ? "true" : "false",
		className: cn("pointer-events-none fixed inset-0 z-[var(--z-raised)]", className),
		...label ? {
			role: "img",
			"aria-label": label
		} : { "aria-hidden": "true" },
		children: /* @__PURE__ */ jsxs("svg", {
			width: "100%",
			height: "100%",
			className: "size-full overflow-visible",
			children: [
				/* @__PURE__ */ jsx("path", {
					d: path,
					fill: "none",
					stroke,
					strokeWidth: width,
					strokeLinecap: "round",
					strokeDasharray: active ? void 0 : "2 4",
					opacity: active ? .42 : .3
				}),
				travelling ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("path", {
					d: path,
					fill: "none",
					stroke,
					strokeWidth: width + 1.4,
					strokeLinecap: "round",
					pathLength: 100,
					strokeDasharray: "8 92",
					className: "luc-beam-dash",
					style: { animationDuration: `${speed}s` }
				}), /* @__PURE__ */ jsx("path", {
					d: path,
					fill: "none",
					stroke,
					strokeWidth: width + 4,
					strokeLinecap: "round",
					pathLength: 100,
					strokeDasharray: "3 97",
					className: "luc-beam-dash",
					opacity: .15,
					style: { animationDuration: `${speed * 1.5}s` }
				})] }) : null,
				[start, end].map((point, index) => /* @__PURE__ */ jsx("circle", {
					cx: point.x,
					cy: point.y,
					r: travelling ? 3 : 2.2,
					fill: stroke,
					opacity: active ? .9 : .5
				}, index))
			]
		})
	});
}
//#endregion
export { SelectionBeam };

//# sourceMappingURL=selection-beam.js.map