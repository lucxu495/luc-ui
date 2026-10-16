"use client";
import { cn } from "../utils/cn.js";
import { Text } from "../typography.js";
import { Button } from "./button-base.js";
import { formatHexColor, hsvToRgb, parseHexColor, rgbToHsv } from "../utils/color.js";
import { Input } from "./input.js";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "./popover.js";
import { Slider } from "../slider.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useId, useMemo, useRef, useState } from "react";
//#region src/components/color-picker.tsx
const DEFAULT_COLOR = "#3b6ef5";
function normalize(input) {
	const parsed = parseHexColor(input);
	return parsed ? formatHexColor(parsed) : null;
}
function ColorPicker({ value, defaultValue = DEFAULT_COLOR, onValueChange, swatches = [], label = "Colour", disabled = false, className }) {
	const controlled = value !== void 0;
	const [internal, setInternal] = useState(() => normalize(defaultValue) ?? DEFAULT_COLOR);
	const current = controlled ? normalize(value) ?? DEFAULT_COLOR : internal;
	const [draft, setDraft] = useState(null);
	const areaRef = useRef(null);
	const fieldId = useId();
	const hsv = useMemo(() => rgbToHsv(parseHexColor(current) ?? {
		r: 59,
		g: 110,
		b: 245,
		a: 1
	}), [current]);
	const commit = useCallback((next) => {
		const hex = normalize(next);
		if (!hex) return;
		if (!controlled) setInternal(hex);
		onValueChange?.(hex);
	}, [controlled, onValueChange]);
	const commitHsv = useCallback((next) => commit(formatHexColor(hsvToRgb(next))), [commit]);
	const pickFromArea = useCallback((event) => {
		const rect = areaRef.current?.getBoundingClientRect();
		if (!rect) return;
		const s = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
		const v = 1 - Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
		commitHsv({
			...hsv,
			s,
			v
		});
	}, [commitHsv, hsv]);
	const hexValue = draft ?? current;
	return /* @__PURE__ */ jsxs(PopoverRoot, { children: [/* @__PURE__ */ jsx(PopoverTrigger, {
		asChild: true,
		children: /* @__PURE__ */ jsxs("button", {
			type: "button",
			disabled,
			"aria-label": `${label}: ${current}`,
			className: cn("luc-transition luc-focus inline-flex h-control-md items-center gap-2 rounded-md border border-line-default bg-surface-default px-2 pr-2.5", "text-label text-fg-secondary shadow-rest hover:border-line-strong hover:bg-surface-interactive-hover", "disabled:pointer-events-none disabled:opacity-60", className),
			children: [/* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				style: { "--luc-swatch": current },
				className: "size-4 shrink-0 rounded-sm border border-line-subtle bg-[var(--luc-swatch)] shadow-well"
			}), /* @__PURE__ */ jsx("span", {
				className: "font-mono text-caption uppercase",
				children: current
			})]
		})
	}), /* @__PURE__ */ jsxs(PopoverContent, {
		width: "sm",
		align: "start",
		className: "flex w-64 flex-col gap-3",
		children: [
			/* @__PURE__ */ jsx("div", {
				ref: areaRef,
				"aria-hidden": "true",
				onPointerDown: (event) => {
					event.currentTarget.setPointerCapture(event.pointerId);
					pickFromArea(event);
				},
				onPointerMove: (event) => {
					if (event.buttons === 1) pickFromArea(event);
				},
				style: { "--luc-hue": formatHexColor(hsvToRgb({
					h: hsv.h,
					s: 1,
					v: 1
				})) },
				className: cn("relative h-32 w-full cursor-crosshair rounded-md border border-line-subtle", "bg-[linear-gradient(to_top,black,transparent),linear-gradient(to_right,white,var(--luc-hue))]"),
				children: /* @__PURE__ */ jsx("span", {
					className: "pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_var(--line-strong)]",
					style: {
						left: `${hsv.s * 100}%`,
						top: `${(1 - hsv.v) * 100}%`
					}
				})
			}),
			/* @__PURE__ */ jsx(Slider, {
				value: Math.round(hsv.h),
				min: 0,
				max: 360,
				size: "sm",
				label: `${label} hue`,
				showValue: "never",
				onValueChange: (next) => commitHsv({
					...hsv,
					h: next
				})
			}),
			/* @__PURE__ */ jsx(Slider, {
				value: Math.round(hsv.s * 100),
				min: 0,
				max: 100,
				size: "sm",
				label: `${label} saturation`,
				showValue: "never",
				onValueChange: (next) => commitHsv({
					...hsv,
					s: next / 100
				})
			}),
			/* @__PURE__ */ jsx(Slider, {
				value: Math.round(hsv.v * 100),
				min: 0,
				max: 100,
				size: "sm",
				label: `${label} brightness`,
				showValue: "never",
				onValueChange: (next) => commitHsv({
					...hsv,
					v: next / 100
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ jsx("label", {
					htmlFor: fieldId,
					className: "sr-only",
					children: `${label} hex value`
				}), /* @__PURE__ */ jsx(Input, {
					id: fieldId,
					value: hexValue,
					size: "sm",
					spellCheck: false,
					autoComplete: "off",
					className: "font-mono uppercase",
					onChange: (event) => {
						setDraft(event.target.value);
						const hex = normalize(event.target.value);
						if (hex) commit(hex);
					},
					onBlur: () => setDraft(null)
				})]
			}),
			swatches.length > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Text, {
				variant: "micro",
				tone: "muted",
				children: "Presets"
			}), /* @__PURE__ */ jsx("div", {
				role: "group",
				"aria-label": `${label} presets`,
				className: "flex flex-wrap gap-1.5",
				children: swatches.map((swatch) => /* @__PURE__ */ jsx("button", {
					type: "button",
					"aria-label": swatch.label,
					onClick: () => commit(swatch.value),
					style: { "--luc-swatch": swatch.value },
					className: cn("luc-transition luc-focus size-6 rounded-sm border border-line-subtle bg-[var(--luc-swatch)]", "hover:scale-110 hover:border-line-strong")
				}, swatch.value))
			})] }) : null,
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between gap-2 pt-0.5",
				children: [/* @__PURE__ */ jsxs(Text, {
					variant: "caption",
					tone: "muted",
					className: "font-mono luc-numeric",
					children: [
						hsvToRgb(hsv).r,
						", ",
						hsvToRgb(hsv).g,
						", ",
						hsvToRgb(hsv).b
					]
				}), /* @__PURE__ */ jsx(Button, {
					type: "button",
					variant: "ghost",
					size: "sm",
					onClick: () => commit(normalize(defaultValue) ?? DEFAULT_COLOR),
					children: "Reset"
				})]
			})
		]
	})] });
}
//#endregion
export { ColorPicker };

//# sourceMappingURL=color-picker.js.map