"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { jsx } from "react/jsx-runtime";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
//#region src/motion/reveal.tsx
/**
* LUC Reveal — content entering with intent.
*
* A short fade plus a few px of travel, once, on first view.
*
* Fail-safe by design: the element renders **visible** and is only hidden once
* JavaScript confirms it starts below the fold. So print, PDF export, no-JS
* rendering, reduced motion, and headless screenshots all show the content.
* The transition itself is CSS, which means the reduced-motion clamp in
* `base.css` applies without a second code path.
*/
function Reveal({ className, children, delay = 0, distance = 8, repeat = false, immediate = false, style, ...props }) {
	const ref = useRef(null);
	const reducedMotion = useReducedMotion();
	const [state, setState] = useState("idle");
	const show = useCallback(() => setState((current) => current === "shown" ? current : "shown"), []);
	useLayoutEffect(() => {
		if (reducedMotion) {
			setState("idle");
			return;
		}
		if (immediate) {
			setState("hidden");
			const frame = window.requestAnimationFrame(show);
			return () => window.cancelAnimationFrame(frame);
		}
		const element = ref.current;
		if (!element || typeof IntersectionObserver === "undefined") {
			setState("idle");
			return;
		}
		if (element.getBoundingClientRect().top < window.innerHeight) {
			setState("idle");
			return;
		}
		setState("hidden");
		const observer = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				show();
				if (!repeat) observer.disconnect();
			}
		}, { rootMargin: "-8% 0px -8% 0px" });
		observer.observe(element);
		const fallback = window.setTimeout(show, 2500);
		return () => {
			observer.disconnect();
			window.clearTimeout(fallback);
		};
	}, [
		immediate,
		repeat,
		reducedMotion,
		show
	]);
	const isHidden = state === "hidden";
	return /* @__PURE__ */ jsx("div", {
		ref,
		"data-slot": "reveal",
		"data-reveal-state": state,
		className: cn("motion-safe:transition-[opacity,transform]", className),
		style: {
			opacity: isHidden ? 0 : 1,
			transform: isHidden ? `translateY(${distance}px)` : "none",
			transitionDuration: isHidden || state === "shown" ? "420ms" : "0ms",
			transitionDelay: isHidden ? "0ms" : `${delay}s`,
			transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
			...style
		},
		...props,
		children
	});
}
//#endregion
export { Reveal };

//# sourceMappingURL=reveal.js.map