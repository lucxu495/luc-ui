"use client";
import { useControllableState } from "../hooks/use-controllable-state.js";
import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { RiStarFill, RiStarLine } from "@remixicon/react";
//#region src/components/rating.tsx
const sizeClass = {
	sm: "size-4",
	md: "size-5",
	lg: "size-6"
};
function Rating({ className, value, defaultValue = 0, onValueChange, max = 5, allowHalf = false, readOnly = false, size = "md", label, clearable = true, ...props }) {
	const [score, setScore] = useControllableState({
		value,
		defaultValue,
		onChange: onValueChange
	});
	const step = allowHalf ? .5 : 1;
	const steps = Array.from({ length: Math.round(max / step) }, (_, index) => (index + 1) * step);
	if (readOnly) return /* @__PURE__ */ jsx("div", {
		"data-slot": "rating",
		"data-readonly": "",
		role: "img",
		"aria-label": label ?? `${score} out of ${max}`,
		className: cn("inline-flex items-center gap-0.5 text-fg-warning", className),
		...props,
		children: Array.from({ length: max }).map((_, index) => {
			const filled = index + 1 <= Math.floor(score);
			const half = !filled && index + .5 <= score;
			return /* @__PURE__ */ jsxs("span", {
				"aria-hidden": "true",
				className: "relative inline-flex",
				children: [/* @__PURE__ */ jsx(RiStarLine, { className: cn(sizeClass[size], "text-line-strong") }), filled || half ? /* @__PURE__ */ jsx("span", {
					className: "absolute inset-0 overflow-hidden",
					style: { width: half ? "50%" : "100%" },
					children: /* @__PURE__ */ jsx(RiStarFill, { className: sizeClass[size] })
				}) : null]
			}, index);
		})
	});
	const move = (delta) => {
		setScore(Math.min(max, Math.max(0, score + delta * step)));
	};
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "rating",
		role: "radiogroup",
		"aria-label": label ?? "Rating",
		tabIndex: -1,
		className: cn("inline-flex items-center gap-0.5", className),
		onKeyDown: (event) => {
			if (event.key === "ArrowRight" || event.key === "ArrowUp") {
				event.preventDefault();
				move(1);
			} else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
				event.preventDefault();
				move(-1);
			} else if (event.key === "Home") {
				event.preventDefault();
				setScore(0);
			} else if (event.key === "End") {
				event.preventDefault();
				setScore(max);
			}
		},
		...props,
		children: steps.map((option) => {
			const checked = Math.abs(score - option) < .001;
			const filled = option <= score;
			const classes = cn("grid place-items-center rounded-xs p-0.5 luc-transition luc-focus", "text-line-strong hover:text-fg-warning", filled && "text-fg-warning", "hover:scale-110 active:scale-95 motion-reduce:transform-none");
			return /* @__PURE__ */ jsx("button", {
				type: "button",
				role: "radio",
				"aria-checked": checked,
				"aria-label": `${option} of ${max}`,
				tabIndex: checked || score === 0 && option === step ? 0 : -1,
				onClick: () => {
					if (clearable && checked) setScore(0);
					else setScore(option);
				},
				className: classes,
				children: filled ? /* @__PURE__ */ jsx(RiStarFill, {
					"aria-hidden": "true",
					className: sizeClass[size]
				}) : /* @__PURE__ */ jsx(RiStarLine, {
					"aria-hidden": "true",
					className: sizeClass[size]
				})
			}, option);
		})
	});
}
//#endregion
export { Rating };

//# sourceMappingURL=rating.js.map