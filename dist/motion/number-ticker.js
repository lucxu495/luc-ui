"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { formatNumber } from "../utils/format.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { animate } from "motion/react";
//#region src/motion/number-ticker.tsx
function NumberTicker({ className, value, kind = "number", currency, suffix, signed, locale, minimumFractionDigits, maximumFractionDigits, duration = .55, startFrom, align = "left", variant = "count", format, ...props }) {
	const nodeRef = useRef(null);
	const previousValue = useRef(startFrom ?? value ?? 0);
	const reducedMotion = useReducedMotion();
	const formatValue = useCallback((input) => format ? format(input) : formatNumber(input, {
		kind,
		currency,
		suffix,
		signed,
		locale,
		minimumFractionDigits,
		maximumFractionDigits
	}), [
		format,
		kind,
		currency,
		suffix,
		signed,
		locale,
		minimumFractionDigits,
		maximumFractionDigits
	]);
	const isUnavailable = value === null || value === void 0 || !Number.isFinite(value);
	const finalText = isUnavailable ? "—" : formatValue(value);
	const [initialText] = useState(() => finalText);
	useEffect(() => {
		const node = nodeRef.current;
		if (!node) return;
		if (isUnavailable) {
			node.textContent = "—";
			return;
		}
		const target = value;
		const from = previousValue.current;
		previousValue.current = target;
		if (reducedMotion || duration <= 0 || from === target) {
			node.textContent = formatValue(target);
			return;
		}
		const controls = animate(from, target, {
			duration,
			ease: [
				.16,
				1,
				.3,
				1
			],
			onUpdate: (latest) => {
				node.textContent = formatValue(latest);
			},
			onComplete: () => {
				node.textContent = formatValue(target);
			}
		});
		return () => controls.stop();
	}, [
		value,
		isUnavailable,
		reducedMotion,
		duration,
		formatValue
	]);
	if (variant === "digits") return /* @__PURE__ */ jsxs("span", {
		"data-slot": "number-ticker",
		"data-variant": "digits",
		"data-numeric": true,
		className: cn("luc-numeric relative inline-block tabular-nums", className),
		...props,
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "invisible",
				"aria-hidden": "true",
				children: finalText
			}),
			/* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: cn("absolute inset-0 flex items-center", align === "left" && "justify-start", align === "right" && "justify-end", align === "center" && "justify-center"),
				children: /* @__PURE__ */ jsx(DigitFlow, {
					text: finalText,
					reduced: reducedMotion,
					duration
				})
			}),
			/* @__PURE__ */ jsx("span", {
				className: "sr-only",
				children: finalText
			})
		]
	});
	return /* @__PURE__ */ jsxs("span", {
		"data-slot": "number-ticker",
		"data-numeric": true,
		className: cn("luc-numeric relative inline-block tabular-nums", className),
		...props,
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "invisible",
				"aria-hidden": "true",
				children: finalText
			}),
			/* @__PURE__ */ jsx("span", {
				ref: nodeRef,
				"aria-hidden": "true",
				className: cn("absolute inset-0 flex items-center", align === "left" && "justify-start", align === "right" && "justify-end", align === "center" && "justify-center"),
				children: initialText
			}),
			/* @__PURE__ */ jsx("span", {
				className: "sr-only",
				children: finalText
			})
		]
	});
}
/**
* The digit-level renderer.
*
* Each digit position is a 1em-tall window over a 0–9 column; the column simply
* translates to the current digit, so a value change moves only the digits that
* actually changed and everything else stays perfectly still. Punctuation,
* currency symbols, signs and suffixes are not digits and render statically, so
* "$1,284.31" keeps its exact shape throughout the transition.
*
* Widths come from the reserved invisible copy in `NumberTicker`, and the glyphs
* are tabular, so nothing reflows mid-roll.
*/
function DigitFlow({ text, reduced, duration }) {
	return /* @__PURE__ */ jsx("span", {
		"data-slot": "digit-flow",
		className: "inline-flex items-center tabular-nums",
		children: Array.from(text).map((char, index) => {
			if (char >= "0" && char <= "9") return /* @__PURE__ */ jsx(DigitColumn, {
				digit: Number(char),
				reduced,
				duration
			}, `${char}-${index}`);
			return /* @__PURE__ */ jsx("span", {
				className: "inline-block whitespace-pre",
				children: char
			}, `${char}-${index}`);
		})
	});
}
function DigitColumn({ digit, reduced, duration }) {
	const target = `-${digit}em`;
	return /* @__PURE__ */ jsx("span", {
		"data-slot": "digit-column",
		"data-digit": digit,
		className: "relative inline-block h-[1em] w-[1ch] overflow-hidden align-baseline",
		children: /* @__PURE__ */ jsx("span", {
			"data-slot": "digit-column-track",
			className: cn("absolute inset-x-0 top-0 flex flex-col items-center", !reduced && duration > 0 && "[transition:transform_var(--digit-duration)_cubic-bezier(0.16,1,0.3,1)]"),
			style: {
				transform: `translateY(${target})`,
				["--digit-duration"]: `${duration}s`
			},
			children: Array.from({ length: 10 }, (_, value) => /* @__PURE__ */ jsx("span", {
				className: "block h-[1em] leading-[1em]",
				children: value
			}, value))
		})
	});
}
//#endregion
export { NumberTicker };

//# sourceMappingURL=number-ticker.js.map