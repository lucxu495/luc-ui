"use client";
import { cn } from "../utils/cn.js";
import { mergeRefs } from "../utils/refs.js";
import { IconButton } from "../components/icon-button.js";
import { Button } from "../components/button-base.js";
import { positionTourBubble } from "./engine.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine, RiPauseLine, RiPlayLine } from "@remixicon/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
//#region src/product-tour/bubble.tsx
function Countdown({ active, duration, resetKey, onElapsed, onSecondChange }) {
	const barRef = useRef(null);
	const elapsedRef = useRef(0);
	const startedRef = useRef(null);
	const reportedSecondRef = useRef(null);
	useEffect(() => {
		elapsedRef.current = 0;
		if (barRef.current) barRef.current.style.transform = "scaleX(1)";
		const seconds = Math.ceil(duration / 1e3);
		reportedSecondRef.current = seconds;
		onSecondChange?.(seconds);
	}, [
		duration,
		onSecondChange,
		resetKey
	]);
	useEffect(() => {
		if (!active) {
			if (startedRef.current !== null) {
				elapsedRef.current += Date.now() - startedRef.current;
				startedRef.current = null;
			}
			return;
		}
		let complete = false;
		startedRef.current = Date.now();
		const tick = () => {
			const now = Date.now();
			if (elapsedRef.current + (now - (startedRef.current ?? now)) >= duration) {
				elapsedRef.current = duration;
				if (barRef.current) barRef.current.style.transform = "scaleX(0)";
				if (reportedSecondRef.current !== 0) {
					reportedSecondRef.current = 0;
					onSecondChange?.(0);
				}
				if (!complete) {
					complete = true;
					onElapsed();
				}
				return;
			}
			const remaining = duration - elapsedRef.current - (now - (startedRef.current ?? now));
			const seconds = Math.ceil(remaining / 1e3);
			if (seconds !== reportedSecondRef.current) {
				reportedSecondRef.current = seconds;
				onSecondChange?.(seconds);
			}
			if (barRef.current) barRef.current.style.transform = `scaleX(${Math.max(0, remaining / duration)})`;
		};
		tick();
		const timer = window.setInterval(tick, 50);
		return () => {
			window.clearInterval(timer);
			if (startedRef.current !== null) {
				elapsedRef.current += Date.now() - startedRef.current;
				startedRef.current = null;
			}
		};
	}, [
		active,
		duration,
		onElapsed,
		onSecondChange
	]);
	return /* @__PURE__ */ jsx("span", {
		"aria-hidden": "true",
		"data-slot": "product-tour-countdown",
		className: "pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden rounded-full",
		children: /* @__PURE__ */ jsx("span", {
			ref: barRef,
			className: "block h-full origin-left bg-[var(--tour-countdown)]",
			style: { transition: "transform 34ms linear" }
		})
	});
}
function BubbleShape({ variant }) {
	return /* @__PURE__ */ jsxs("svg", {
		className: "pointer-events-none absolute inset-0 h-full w-full overflow-visible",
		viewBox: "0 0 360 220",
		preserveAspectRatio: "none",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ jsx("path", {
			d: variant === "cloud-glass" ? "M27 1C47 .4 61 3.2 83 2.2C104 1.2 121 3 143 2.1C161 1.4 176 1.8 196 1.2C218 .5 232 2.4 254 1.8C276 1.2 291 2 309 1.7C336 1.2 358 13 358.5 38C359 60 358 79 358.5 102C359 125 358.2 148 358.5 170C358.9 199 345 219 317 218.7C291 218.4 269 219.2 242 218.8C218 218.4 198 219.2 171 218.8C146 218.4 126 219.3 100 218.8C72 218.3 44 219.5 24 218.7C4 217.9 1.2 199 1 176C.8 154 1.1 136 .9 115C.7 94 1.3 77 1 57C.7 33 7 12 27 1Z" : "M17 1H343C351 1 359 9 359 17V203C359 211 351 219 343 219H17C9 219 1 211 1 203V17C1 9 9 1 17 1Z",
			fill: "var(--tour-bubble)",
			stroke: "var(--tour-bubble-border)",
			strokeWidth: "1",
			vectorEffect: "non-scaling-stroke"
		}), /* @__PURE__ */ jsx("path", {
			d: variant === "cloud-glass" ? "M34 2.3C70 1.2 109 2.8 150 1.7C207 .2 266 2.9 326 1.7" : "M20 1.5H340",
			fill: "none",
			stroke: "var(--tour-bubble-highlight)",
			strokeWidth: "1",
			strokeLinecap: "round",
			vectorEffect: "non-scaling-stroke"
		})]
	});
}
function Tail({ position, variant }) {
	if (!position.tail) return null;
	const { x, y, side } = position.tail;
	return /* @__PURE__ */ jsx("span", {
		"aria-hidden": "true",
		className: "luc-product-tour__tail pointer-events-none absolute",
		style: {
			left: side === "top" || side === "bottom" ? x : y,
			top: side === "top" || side === "bottom" ? y : x,
			transform: `translate(-50%, -50%) rotate(${side === "top" ? 0 : side === "right" ? 90 : side === "bottom" ? 180 : 270}deg)`
		},
		children: /* @__PURE__ */ jsx("svg", {
			width: "24",
			height: "14",
			viewBox: "0 0 24 14",
			className: "overflow-visible",
			children: /* @__PURE__ */ jsx("path", {
				d: variant === "cloud-glass" ? "M2 1C7.8 1.3 8.6 12.8 12 13C15.7 12.5 17.4 2.2 22 1.1C17.7 2.4 7.1 2.4 2 1Z" : "M2 1C8 2 8.2 12 12 13C15.8 12.1 16 2 22 1Z",
				fill: "var(--tour-bubble)",
				stroke: "var(--tour-bubble-border)",
				strokeWidth: "1",
				vectorEffect: "non-scaling-stroke"
			})
		})
	});
}
function ProductTourBubble({ eyebrow, title, description, icon, index, total, placement, anchor, variant, auto, interval, paused, missing, intro = false, introAutoStartAfter, onBack, onNext, onAutoAdvance, onSkip, onClose, onTogglePause, labels, titleId, descriptionId, bubbleRef, onHoverChange }) {
	const localRef = useRef(null);
	const [size, setSize] = useState(null);
	const [introSeconds, setIntroSeconds] = useState(() => Math.ceil((introAutoStartAfter ?? 0) / 1e3));
	const [viewport, setViewport] = useState(() => typeof window === "undefined" ? {
		width: 0,
		height: 0
	} : {
		width: window.innerWidth,
		height: window.innerHeight
	});
	const reducedMotion = useReducedMotion();
	const isLast = index === total - 1;
	const handleSecondChange = useCallback((seconds) => {
		setIntroSeconds(seconds);
	}, []);
	useLayoutEffect(() => {
		const node = localRef.current;
		if (!node) return;
		const measure = () => {
			const next = {
				width: node.offsetWidth,
				height: node.offsetHeight
			};
			setSize((current) => current && current.width === next.width && current.height === next.height ? current : next);
			setViewport({
				width: window.innerWidth,
				height: window.innerHeight
			});
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		window.addEventListener("resize", measure);
		return () => {
			observer.disconnect();
			window.removeEventListener("resize", measure);
		};
	}, [index]);
	const position = positionTourBubble({
		anchor,
		bubble: size ?? {
			width: 340,
			height: 190
		},
		viewport,
		preferred: placement
	});
	const attachRef = mergeRefs(localRef, bubbleRef);
	return /* @__PURE__ */ jsxs(motion.div, {
		ref: attachRef,
		"data-slot": "product-tour-bubble",
		"data-variant": variant,
		"data-placement": position.placement,
		role: "dialog",
		"aria-modal": "false",
		"aria-labelledby": titleId,
		"aria-describedby": description ? descriptionId : void 0,
		tabIndex: -1,
		initial: reducedMotion ? false : {
			opacity: 0,
			scale: .975
		},
		animate: {
			opacity: size ? 1 : 0,
			scale: 1
		},
		exit: {
			opacity: 0,
			scale: .985
		},
		transition: {
			duration: reducedMotion ? .001 : .26,
			ease: [
				.16,
				1,
				.3,
				1
			]
		},
		onPointerEnter: () => onHoverChange(true),
		onPointerLeave: () => onHoverChange(false),
		onFocusCapture: (event) => {
			if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLElement && event.target.isContentEditable) onHoverChange(true);
		},
		onBlurCapture: () => onHoverChange(false),
		className: cn("luc-product-tour__bubble fixed z-[calc(var(--z-overlay)+2)] outline-none", size ? "visible" : "invisible"),
		style: {
			top: position.top,
			left: position.left,
			transition: reducedMotion ? "none" : "top var(--motion-slower) var(--ease-enter), left var(--motion-slower) var(--ease-enter), width var(--motion-slower) var(--ease-enter), height var(--motion-slower) var(--ease-enter)"
		},
		children: [
			/* @__PURE__ */ jsx(BubbleShape, { variant }),
			/* @__PURE__ */ jsx(Tail, {
				position,
				variant
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "relative z-[1] flex min-h-0 flex-1 flex-col px-4 pb-3.5 pt-4",
				children: [
					intro && introAutoStartAfter ? /* @__PURE__ */ jsx(Countdown, {
						active: !paused && !missing,
						duration: introAutoStartAfter,
						resetKey: `intro-${titleId}`,
						onElapsed: onAutoAdvance,
						onSecondChange: handleSecondChange
					}) : intro ? null : auto ? /* @__PURE__ */ jsx(Countdown, {
						active: !paused && !missing && !isLast,
						duration: interval,
						resetKey: `${index}-${titleId}`,
						onElapsed: onAutoAdvance
					}) : /* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						"data-slot": "product-tour-progress",
						className: "pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden rounded-full bg-[var(--tour-divider)]",
						children: /* @__PURE__ */ jsx("span", {
							className: "block h-full origin-left bg-[var(--tour-countdown)] opacity-70 transition-transform duration-[var(--motion-normal)] ease-[var(--ease-emphasized)]",
							style: { transform: `scaleX(${(index + 1) / total})` }
						})
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex min-w-0 items-start gap-3",
						children: [
							icon ? /* @__PURE__ */ jsx("span", {
								"aria-hidden": "true",
								className: "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-[var(--tour-icon-border)] bg-[var(--tour-icon-surface)] text-[var(--tour-icon-ink)] shadow-[inset_0_1px_0_var(--tour-bubble-highlight)] [&_svg]:size-3.5",
								children: icon
							}) : null,
							/* @__PURE__ */ jsxs("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex min-h-5 items-center justify-between gap-2",
									children: [/* @__PURE__ */ jsx("span", {
										className: "truncate text-[10px] font-medium uppercase tracking-[0.13em] text-[var(--tour-eyebrow)]",
										children: missing ? labels?.unavailableTitle ?? "Waiting for this element" : eyebrow
									}), /* @__PURE__ */ jsx("span", {
										className: "shrink-0 text-[10px] font-medium tabular-nums tracking-[0.04em] text-[var(--tour-meta)]",
										children: intro ? introAutoStartAfter ? labels?.introAutoStart?.(introSeconds) ?? `Auto · ${introSeconds}s` : labels?.introMeta?.(total) ?? `${total} steps` : labels?.step?.(index + 1, total) ?? `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`
									})]
								}), /* @__PURE__ */ jsx("div", {
									className: "mt-1.5 min-w-0",
									children: /* @__PURE__ */ jsx(AnimatePresence, {
										initial: false,
										mode: "wait",
										children: /* @__PURE__ */ jsxs(motion.div, {
											initial: reducedMotion ? false : {
												opacity: 0,
												y: 4
											},
											animate: {
												opacity: 1,
												y: 0
											},
											exit: reducedMotion ? { opacity: 0 } : {
												opacity: 0,
												y: -3,
												transition: { duration: .12 }
											},
											transition: {
												duration: reducedMotion ? .001 : .2,
												ease: [
													.16,
													1,
													.3,
													1
												]
											},
											children: [/* @__PURE__ */ jsx("h2", {
												id: titleId,
												className: "text-title font-[560] leading-[1.28] tracking-[-0.018em] text-[var(--tour-title)]",
												children: missing ? labels?.unavailableTitle ?? "The anchor moved" : title
											}), description || missing ? /* @__PURE__ */ jsx("p", {
												id: descriptionId,
												className: "mt-1 max-w-[42ch] text-caption leading-[1.55] text-[var(--tour-copy)]",
												children: missing ? labels?.unavailableDescription ?? "Luc UI is watching for the element to return. You can skip this step or leave the tour now." : description
											}) : null]
										}, `${index}-${missing ? "missing" : "ready"}`)
									})
								})]
							}),
							/* @__PURE__ */ jsx(IconButton, {
								variant: "ghost",
								size: "sm",
								tactile: false,
								label: labels?.close ?? "Close tour",
								icon: /* @__PURE__ */ jsx(RiCloseLine, {}),
								onClick: onClose,
								className: "-mr-1.5 -mt-1.5 shrink-0 text-[var(--tour-meta)] hover:bg-[var(--tour-control-hover)] hover:text-[var(--tour-title)]"
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-3 flex min-h-8 items-center justify-between gap-2 border-t border-[var(--tour-divider)] pt-2.5",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ jsx(Button, {
								type: "button",
								variant: "ghost",
								size: "sm",
								tactile: false,
								onClick: onSkip,
								className: "h-7 px-1.5 text-caption text-[var(--tour-meta)] hover:bg-[var(--tour-control-hover)] hover:text-[var(--tour-title)]",
								children: intro ? labels?.exploreAlone ?? "Explore on my own" : missing ? labels?.skip ?? "Skip step" : labels?.skip ?? "Skip"
							}), auto && !intro ? /* @__PURE__ */ jsxs("button", {
								type: "button",
								onClick: onTogglePause,
								className: "luc-focus inline-flex h-7 items-center gap-1 rounded-sm px-1.5 text-caption text-[var(--tour-meta)] transition-colors hover:bg-[var(--tour-control-hover)] hover:text-[var(--tour-title)]",
								children: [paused ? /* @__PURE__ */ jsx(RiPlayLine, {
									"aria-hidden": "true",
									className: "size-3"
								}) : /* @__PURE__ */ jsx(RiPauseLine, {
									"aria-hidden": "true",
									className: "size-3"
								}), paused ? labels?.resume ?? "Resume" : labels?.pause ?? "Pause"]
							}) : null]
						}), /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-1.5",
							children: [index > 0 && !intro ? /* @__PURE__ */ jsxs(Button, {
								type: "button",
								variant: "ghost",
								size: "sm",
								tactile: false,
								onClick: onBack,
								className: "h-7 px-2 text-caption text-[var(--tour-meta)] hover:bg-[var(--tour-control-hover)] hover:text-[var(--tour-title)]",
								children: [/* @__PURE__ */ jsx(RiArrowLeftSLine, {
									"aria-hidden": "true",
									className: "size-3.5"
								}), labels?.back ?? "Back"]
							}) : null, /* @__PURE__ */ jsxs(Button, {
								type: "button",
								variant: "secondary",
								size: "sm",
								tactile: false,
								onClick: onNext,
								className: "h-7 border-[var(--tour-button-border)] bg-[var(--tour-button-surface)] px-2.5 text-caption text-[var(--tour-title)] shadow-[0_1px_1px_var(--tour-button-shadow)] hover:border-[var(--tour-button-border-hover)] hover:bg-[var(--tour-button-hover)]",
								children: [intro ? labels?.takeTour ?? "Take the tour" : isLast ? labels?.finish ?? "Finish" : labels?.next ?? "Continue", isLast && !intro ? null : /* @__PURE__ */ jsx(RiArrowRightSLine, {
									"aria-hidden": "true",
									className: "size-3.5"
								})]
							})]
						})]
					})
				]
			})
		]
	});
}
//#endregion
export { ProductTourBubble };

//# sourceMappingURL=bubble.js.map