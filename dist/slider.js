"use client";
import { cn } from "./utils/cn.js";
import { useField } from "./components/field.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Slider as Slider$1 } from "radix-ui";
import { useCallback, useEffect, useState } from "react";
//#region src/components/slider.tsx
const sizeStyles = {
	sm: {
		root: "h-4",
		track: "h-1",
		thumb: "size-3",
		bubble: "mb-1.5",
		tick: "size-1",
		bubbleRoom: "pt-8",
		markRoom: "pb-5"
	},
	md: {
		root: "h-5",
		track: "h-1.5",
		thumb: "size-3.5",
		bubble: "mb-2",
		tick: "size-1",
		bubbleRoom: "pt-8",
		markRoom: "pb-5"
	},
	lg: {
		root: "h-6",
		track: "h-2",
		thumb: "size-4",
		bubble: "mb-2",
		tick: "size-1.5",
		bubbleRoom: "pt-8",
		markRoom: "pb-6"
	}
};
function percentOf(value, min, max) {
	if (max === min) return 0;
	return (value - min) / (max - min) * 100;
}
/**
* The shared shell. Both Slider and RangeSlider are this component with a
* different value arity, so a single-thumb and a two-thumb control can never
* drift apart visually.
*/
function SliderShell({ values, onValuesChange, onValuesCommit, size = "md", label, thumbLabels, rootAriaLabel, invalid, showValue = "auto", formatValue = (value) => String(value), marks, orientation = "horizontal", disabled, className, id, min = 0, max = 100, ...props }) {
	const field = useField();
	const styles = sizeStyles[size];
	const isInvalid = invalid ?? field.invalid;
	const isDisabled = disabled ?? field.disabled;
	const vertical = orientation === "vertical";
	const [active, setActive] = useState(null);
	const showsBubble = showValue !== "never";
	const hasMarkCaptions = marks?.some((mark) => mark.label !== void 0) ?? false;
	const bubbleRoom = !vertical && showsBubble;
	const markRoom = !vertical && hasMarkCaptions;
	useEffect(() => {
		if (active === null) return;
		const clear = () => setActive(null);
		window.addEventListener("pointerup", clear);
		window.addEventListener("pointercancel", clear);
		return () => {
			window.removeEventListener("pointerup", clear);
			window.removeEventListener("pointercancel", clear);
		};
	}, [active]);
	const handleValueChange = useCallback((next) => {
		onValuesChange(next.length > 1 ? [...next].sort((a, b) => a - b) : next);
	}, [onValuesChange]);
	const ariaLabelFor = (index) => {
		const explicit = thumbLabels?.[index];
		if (explicit) return explicit;
		if (label && values.length > 1) return `${label} ${index === 0 ? "minimum" : "maximum"}`;
		if (label) return label;
		if (rootAriaLabel) return rootAriaLabel;
		if (values.length > 1) return index === 0 ? "Minimum" : "Maximum";
	};
	const ariaLabelledBy = label || values.length > 1 ? void 0 : field.labelId;
	const trackNode = /* @__PURE__ */ jsx(Slider$1.Track, {
		"data-slot": "slider-track",
		className: cn("relative grow overflow-hidden rounded-full bg-surface-sunken shadow-[inset_0_0_0_1px_var(--line-subtle)]", isInvalid && "shadow-[inset_0_0_0_1px_var(--negative)]", vertical ? "h-full w-1.5" : styles.track),
		children: /* @__PURE__ */ jsx(Slider$1.Range, {
			"data-slot": "slider-range",
			className: cn("absolute rounded-full luc-transition-slow", isInvalid ? "bg-negative" : "bg-[linear-gradient(to_right,color-mix(in_oklab,var(--accent-default)_62%,transparent),var(--accent-default))]", "group-data-[disabled]/slider:bg-line-strong")
		})
	});
	const markTicks = marks?.length ? marks.map((mark) => {
		const percent = percentOf(mark.value, min, max);
		return /* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			className: cn("pointer-events-none absolute rounded-full bg-line-strong", styles.tick, vertical ? "left-1/2 -translate-x-1/2 translate-y-1/2" : "top-1/2 -translate-x-1/2 -translate-y-1/2"),
			style: vertical ? { bottom: `${percent}%` } : { left: `${percent}%` },
			children: mark.label ? /* @__PURE__ */ jsx("span", {
				className: cn("absolute whitespace-nowrap text-micro text-fg-muted", vertical ? "left-full ml-2 -translate-y-1/2" : "top-full mt-1.5 -translate-x-1/2"),
				children: mark.label
			}) : null
		}, mark.value);
	}) : null;
	return /* @__PURE__ */ jsxs(Slider$1.Root, {
		"data-slot": "slider",
		"data-size": size,
		id: id ?? field.id,
		min,
		max,
		orientation,
		disabled: isDisabled,
		value: values,
		onValueChange: handleValueChange,
		onValueCommit: onValuesCommit,
		className: cn("group/slider relative flex w-full touch-none select-none items-center", vertical && "h-40 w-5 flex-col justify-center", !vertical && (bubbleRoom || markRoom ? cn(bubbleRoom && styles.bubbleRoom, markRoom && styles.markRoom) : styles.root), isDisabled && "cursor-not-allowed", className),
		...props,
		children: [vertical ? /* @__PURE__ */ jsxs(Fragment, { children: [trackNode, markTicks] }) : /* @__PURE__ */ jsxs("div", {
			"data-slot": "slider-rail",
			className: "relative flex grow items-center",
			children: [trackNode, markTicks]
		}), values.map((value, index) => {
			const visible = showValue === "always" || showValue === "auto" && active === index;
			return /* @__PURE__ */ jsx(Slider$1.Thumb, {
				"data-slot": "slider-thumb",
				"data-index": index,
				"aria-label": ariaLabelFor(index),
				"aria-labelledby": ariaLabelledBy,
				"aria-describedby": props["aria-describedby"] ?? field.describedBy,
				"aria-invalid": isInvalid || void 0,
				onPointerDown: () => setActive(index),
				className: cn("group/thumb relative block cursor-grab rounded-full border border-line-strong bg-surface-raised shadow-rest outline-none luc-transition", "hover:shadow-hover active:cursor-grabbing", "hover:scale-110 data-[dragging]:scale-110", "hover:border-line-accent active:cursor-grabbing", "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring", "before:absolute before:-inset-2 before:content-['']", "group-data-[disabled]/slider:cursor-not-allowed group-data-[disabled]/slider:border-line-subtle group-data-[disabled]/slider:bg-surface-interactive group-data-[disabled]/slider:shadow-none", isInvalid && "border-negative", styles.thumb),
				children: showValue === "never" ? null : /* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					className: cn("pointer-events-none absolute z-[var(--z-tooltip)] rounded-sm border border-line-default bg-surface-overlay px-1.5 py-0.5 text-micro whitespace-nowrap text-fg-primary luc-float luc-numeric", vertical ? "left-full top-1/2 ml-2 -translate-y-1/2" : cn("bottom-full left-1/2 -translate-x-1/2", styles.bubble), "luc-transition opacity-0", "group-hover/thumb:opacity-100 group-focus-within/thumb:opacity-100", visible && "opacity-100"),
					children: formatValue(value)
				})
			}, index);
		})]
	});
}
function useUncontrolled(value, defaultValue, onChange) {
	const [internal, setInternal] = useState(defaultValue);
	const isControlled = value !== void 0;
	return [isControlled ? value : internal, useCallback((next) => {
		if (!isControlled) setInternal(next);
		onChange?.(next);
	}, [isControlled, onChange])];
}
/**
* One thumb. `value`/`defaultValue` are plain numbers; the tuple the primitive
* needs never reaches the consumer.
*/
function Slider({ value, defaultValue = 0, onValueChange, onValueCommit, min = 0, max = 100, ...props }) {
	const [current, setCurrent] = useUncontrolled(value, defaultValue, onValueChange);
	const rootAriaLabel = typeof props["aria-label"] === "string" ? props["aria-label"] : void 0;
	return /* @__PURE__ */ jsx(SliderShell, {
		...props,
		rootAriaLabel,
		min,
		max,
		values: [current],
		onValuesChange: (next) => setCurrent(next[0] ?? min),
		onValuesCommit: (next) => onValueCommit?.(next[0] ?? min)
	});
}
/**
* Two thumbs, one inclusive range. The value is always a sorted tuple, so
* `values[0] <= values[1]` holds for every consumer.
*/
function RangeSlider({ value, defaultValue = [25, 75], onValueChange, onValueCommit, min = 0, max = 100, thumbLabels, ...props }) {
	const [current, setCurrent] = useUncontrolled(value ? [value[0], value[1]] : void 0, [defaultValue[0], defaultValue[1]], onValueChange);
	const rootAriaLabel = typeof props["aria-label"] === "string" ? props["aria-label"] : void 0;
	return /* @__PURE__ */ jsx(SliderShell, {
		...props,
		rootAriaLabel,
		min,
		max,
		values: [current[0], current[1]],
		thumbLabels,
		onValuesChange: (next) => setCurrent([next[0] ?? min, next[1] ?? max]),
		onValuesCommit: (next) => onValueCommit?.([next[0] ?? min, next[1] ?? max])
	});
}
//#endregion
export { RangeSlider, Slider };

//# sourceMappingURL=slider.js.map