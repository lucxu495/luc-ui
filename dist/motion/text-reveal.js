"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { depth, duration, easing } from "./tokens.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
//#region src/motion/text-reveal.tsx
/**
* LUC TextReveal — premium entrance for a *headline*, never for body copy.
*
* Four modes, one axis of difference: how much of the text arrives at once.
* `blur` and `mask` treat the line as one object; `word` and `char` stagger it.
*
* Fail-safe by construction, exactly like `Reveal`: the text is rendered
* **visible** in the markup and is only hidden once JavaScript has confirmed it
* should animate. So SSR, no-JS rendering, print, PDF export, headless
* screenshots and reduced motion all show the headline, and the transition runs
* in CSS — which means the global reduced-motion clamp applies without a second
* code path.
*/
function TextReveal({ className, text, mode = "blur", delay = 0, step = .035, whenVisible = false, as = "span", style, ...props }) {
	const ref = useRef(null);
	const reduced = useReducedMotion();
	const [state, setState] = useState("idle");
	const Tag = as;
	const show = useCallback(() => setState((current) => current === "shown" ? current : "shown"), []);
	useLayoutEffect(() => {
		if (reduced) return;
		if (whenVisible) {
			const element = ref.current;
			if (!element || typeof IntersectionObserver === "undefined") return;
			if (element.getBoundingClientRect().top < window.innerHeight) return;
			setState("hidden");
			const observer = new IntersectionObserver((entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					show();
					observer.disconnect();
				}
			}, { rootMargin: "-8% 0px -8% 0px" });
			observer.observe(element);
			const fallback = window.setTimeout(show, 2500);
			return () => {
				observer.disconnect();
				window.clearTimeout(fallback);
			};
		}
		setState("hidden");
		const frame = window.requestAnimationFrame(show);
		return () => window.cancelAnimationFrame(frame);
	}, [
		reduced,
		show,
		whenVisible
	]);
	const hidden = !reduced && state === "hidden";
	const transitionDuration = state === "shown" ? `${Math.round(duration.deliberate * 1e3)}ms` : hidden ? "0ms" : "0ms";
	const blur = mode === "blur" ? `blur(${depth.enterBlur}px)` : "blur(0px)";
	const unitStyle = (index, isSpace) => ({
		display: "inline-block",
		whiteSpace: "pre",
		opacity: hidden ? 0 : 1,
		transform: hidden && mode === "mask" ? "translateY(0.9em)" : hidden ? "translateY(0.36em)" : "none",
		filter: hidden ? blur : "blur(0px)",
		transitionProperty: "opacity, transform, filter",
		transitionDuration,
		transitionTimingFunction: `cubic-bezier(${easing.enter.join(", ")})`,
		transitionDelay: state === "shown" ? `${delay + index * (isSpace ? step * .4 : step)}s` : "0s"
	});
	if (mode === "word" || mode === "char") {
		const units = mode === "word" ? text.split(/(\s+)/) : Array.from(text);
		return /* @__PURE__ */ jsx(Tag, {
			ref,
			"data-slot": "text-reveal",
			"data-mode": mode,
			"data-reveal-state": state,
			className: cn("inline-block", className),
			style,
			...props,
			children: units.map((unit, index) => {
				if (unit === "") return null;
				const isSpace = /^\s+$/.test(unit);
				return /* @__PURE__ */ jsx("span", {
					style: unitStyle(index, isSpace),
					"aria-hidden": isSpace ? "true" : void 0,
					children: isSpace ? "\xA0" : unit
				}, `${unit}-${index}`);
			})
		});
	}
	return /* @__PURE__ */ jsx(Tag, {
		ref,
		"data-slot": "text-reveal",
		"data-mode": mode,
		"data-reveal-state": state,
		className: cn("inline-block", className),
		...props,
		children: /* @__PURE__ */ jsx("span", {
			style: {
				display: "inline-block",
				overflow: mode === "mask" ? "hidden" : void 0,
				verticalAlign: mode === "mask" ? "bottom" : void 0,
				...unitStyle(0, false),
				transitionDelay: state === "shown" ? `${delay}s` : "0s"
			},
			children: text
		})
	});
}
/**
* LUC ScrambleText — a short decode flourish for a *status*, not a paragraph.
*
* Right for "ANALYZING", "SIGNAL ACTIVE", a command result. The real text is in
* the DOM the whole time as the accessible name, and the final frame is exactly
* `text`, so a screen reader and a screenshot both read the settled value.
* Reduced motion prints it immediately.
*/
function ScrambleText({ className, text, duration: total = 700, charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·—", ...props }) {
	const reduced = useReducedMotion();
	const [display, setDisplay] = useState(text);
	useEffect(() => {
		if (reduced) return;
		let frame = 0;
		const start = performance.now();
		const tick = (now) => {
			const progress = Math.min(1, (now - start) / total);
			const revealed = Math.floor(progress * text.length);
			setDisplay(Array.from(text, (char, index) => index < revealed || char === " " ? char : charset[Math.floor(Math.random() * charset.length)] ?? char).join(""));
			if (progress < 1) frame = window.requestAnimationFrame(tick);
			else setDisplay(text);
		};
		frame = window.requestAnimationFrame(tick);
		return () => window.cancelAnimationFrame(frame);
	}, [
		charset,
		reduced,
		text,
		total
	]);
	const shown = reduced ? text : display;
	return /* @__PURE__ */ jsxs("span", {
		"data-slot": "scramble-text",
		"aria-label": text,
		className: cn("luc-numeric", className),
		...props,
		children: [/* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			children: shown
		}), /* @__PURE__ */ jsx("span", {
			className: "sr-only",
			children: text
		})]
	});
}
//#endregion
export { ScrambleText, TextReveal };

//# sourceMappingURL=text-reveal.js.map