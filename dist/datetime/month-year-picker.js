"use client";
import { useControllableState } from "../hooks/use-controllable-state.js";
import { cn } from "../utils/cn.js";
import { IconButton } from "../components/icon-button.js";
import { formatMonthName, formatMonthYear } from "./format.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { CalendarDate } from "@internationalized/date";
//#region src/datetime/month-year-picker.tsx
function chunk(items, size) {
	const rows = [];
	for (let index = 0; index < items.length; index += size) rows.push(items.slice(index, index + size));
	return rows;
}
const NAV_BUTTON = cn("grid size-6 shrink-0 place-items-center rounded-sm text-fg-muted luc-transition luc-focus", "hover:bg-surface-interactive-hover hover:text-fg-primary", "disabled:pointer-events-none disabled:opacity-40");
/** The grid itself: roving focus, arrows, Home/End, PageUp/PageDown, Enter/Space. */
function PickerGrid({ label, items, columns, activeIndex, onActiveIndexChange, onSelect, className }) {
	const refs = useRef([]);
	const focusIndex = (index) => {
		const clamped = Math.max(0, Math.min(items.length - 1, index));
		onActiveIndexChange(clamped);
		refs.current[clamped]?.focus();
	};
	const handleKeyDown = (event, index) => {
		const columns_ = columns;
		switch (event.key) {
			case "ArrowLeft":
				event.preventDefault();
				focusIndex(index - 1);
				break;
			case "ArrowRight":
				event.preventDefault();
				focusIndex(index + 1);
				break;
			case "ArrowUp":
				event.preventDefault();
				focusIndex(index - columns_);
				break;
			case "ArrowDown":
				event.preventDefault();
				focusIndex(index + columns_);
				break;
			case "Home":
				event.preventDefault();
				focusIndex(index - index % columns_);
				break;
			case "End":
				event.preventDefault();
				focusIndex(index - index % columns_ + columns_ - 1);
				break;
			case "PageUp":
				event.preventDefault();
				focusIndex(index - columns_ * 4);
				break;
			case "PageDown":
				event.preventDefault();
				focusIndex(index + columns_ * 4);
				break;
			case "Enter":
			case " ":
				event.preventDefault();
				if (items[index]) onSelect(items[index]);
		}
	};
	const rows = chunk(items, columns);
	return /* @__PURE__ */ jsx("div", {
		role: "grid",
		"aria-label": label,
		"aria-colcount": columns,
		className: cn("flex flex-col gap-1", className),
		children: rows.map((row, rowIndex) => /* @__PURE__ */ jsx("div", {
			role: "row",
			className: "contents",
			children: row.map((item, cellIndex) => {
				const index = rowIndex * columns + cellIndex;
				return /* @__PURE__ */ jsx("div", {
					ref: (node) => {
						refs.current[index] = node;
					},
					role: "gridcell",
					"aria-selected": item.selected,
					"aria-label": item.accessibleLabel,
					"aria-disabled": item.disabled || void 0,
					tabIndex: index === activeIndex ? 0 : -1,
					onClick: () => {
						if (item.disabled) return;
						onActiveIndexChange(index);
						onSelect(item);
					},
					onFocus: () => onActiveIndexChange(index),
					onKeyDown: (event) => handleKeyDown(event, index),
					className: cn("flex h-8 cursor-default items-center justify-center rounded-sm text-label luc-transition", "text-fg-secondary hover:bg-surface-interactive-hover hover:text-fg-primary", "focus-visible:outline-none focus-visible:shadow-[var(--glow-focus)] focus-visible:text-fg-primary", item.selected && "bg-accent-soft text-fg-accent shadow-xs", item.disabled && "pointer-events-none text-fg-disabled"),
					children: item.label
				}, item.key);
			})
		}, rowIndex))
	});
}
/** Twelve months in a 3×4 grid, with a year strip above it. */
function MonthPicker({ value, onValueChange, year, defaultYear, onYearChange, minValue, maxValue, isMonthUnavailable, locale = "en-US", withYearNavigation = true, footer, className, ...props }) {
	const fallbackYear = value?.year ?? defaultYear ?? (/* @__PURE__ */ new Date()).getFullYear();
	const [activeYear, setActiveYear] = useControllableState({
		value: year,
		defaultValue: fallbackYear,
		onChange: onYearChange
	});
	const [activeIndex, setActiveIndex] = useState(0);
	const months = Array.from({ length: 12 }, (_, index) => {
		const month = index + 1;
		const date = new CalendarDate(activeYear, month, 1);
		const label = formatMonthName(date, { locale });
		const beforeMin = minValue ? date.compare(minValue) < 0 : false;
		const afterMax = maxValue ? date.compare(maxValue) > 0 : false;
		return {
			key: `${activeYear}-${month}`,
			label,
			accessibleLabel: formatMonthYear(date, { locale }),
			value: date,
			selected: Boolean(value && value.year === activeYear && value.month === month),
			disabled: beforeMin || afterMax || Boolean(isMonthUnavailable?.(date))
		};
	});
	const yearDisabled = (direction) => {
		if (direction === -1 && minValue) return activeYear <= minValue.year;
		if (direction === 1 && maxValue) return activeYear >= maxValue.year;
		return false;
	};
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "month-picker",
		className: cn("flex w-56 flex-col gap-2", className),
		...props,
		children: [
			withYearNavigation ? /* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between gap-1",
				children: [
					/* @__PURE__ */ jsx(IconButton, {
						label: "Previous year",
						size: "sm",
						variant: "ghost",
						className: NAV_BUTTON,
						disabled: yearDisabled(-1),
						onClick: () => setActiveYear(activeYear - 1),
						icon: /* @__PURE__ */ jsx(Chevron, { direction: "left" })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-label font-medium text-fg-primary luc-numeric",
						children: activeYear
					}),
					/* @__PURE__ */ jsx(IconButton, {
						label: "Next year",
						size: "sm",
						variant: "ghost",
						className: NAV_BUTTON,
						disabled: yearDisabled(1),
						onClick: () => setActiveYear(activeYear + 1),
						icon: /* @__PURE__ */ jsx(Chevron, { direction: "right" })
					})
				]
			}) : null,
			/* @__PURE__ */ jsx(PickerGrid, {
				label: props["aria-label"] ?? "Select month",
				items: months,
				columns: 3,
				activeIndex,
				onActiveIndexChange: setActiveIndex,
				onSelect: (item) => onValueChange?.(item.value)
			}),
			footer
		]
	});
}
/** Years in a page, with fast page navigation across a wide range. */
function YearPicker({ value, onValueChange, pageStart, defaultPageStart, onPageStartChange, yearsPerPage = 10, minValue, maxValue, locale = "en-US", className, ...props }) {
	const anchorYear = value?.year ?? (/* @__PURE__ */ new Date()).getFullYear();
	const fallbackPageStart = Math.floor(anchorYear / yearsPerPage) * yearsPerPage;
	const [activePageStart, setActivePageStart] = useControllableState({
		value: pageStart,
		defaultValue: defaultPageStart ?? fallbackPageStart,
		onChange: onPageStartChange
	});
	const [activeIndex, setActiveIndex] = useState(0);
	const years = Array.from({ length: yearsPerPage }, (_, index) => {
		const year = activePageStart + index;
		const date = new CalendarDate(year, 1, 1);
		const formatted = new Intl.NumberFormat(locale, { useGrouping: false }).format(year);
		return {
			key: String(year),
			label: formatted,
			accessibleLabel: formatted,
			value: date,
			selected: value?.year === year,
			disabled: (minValue ? year < minValue.year : false) || (maxValue ? year > maxValue.year : false)
		};
	});
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "year-picker",
		className: cn("flex w-56 flex-col gap-2", className),
		...props,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center justify-between gap-1",
			children: [
				/* @__PURE__ */ jsx(IconButton, {
					label: `Previous ${yearsPerPage} years`,
					size: "sm",
					variant: "ghost",
					className: NAV_BUTTON,
					disabled: minValue ? activePageStart <= minValue.year : false,
					onClick: () => setActivePageStart(activePageStart - yearsPerPage),
					icon: /* @__PURE__ */ jsx(Chevron, { direction: "left" })
				}),
				/* @__PURE__ */ jsxs("span", {
					className: "text-label font-medium text-fg-primary luc-numeric",
					children: [
						activePageStart,
						"–",
						activePageStart + yearsPerPage - 1
					]
				}),
				/* @__PURE__ */ jsx(IconButton, {
					label: `Next ${yearsPerPage} years`,
					size: "sm",
					variant: "ghost",
					className: NAV_BUTTON,
					disabled: maxValue ? activePageStart + yearsPerPage - 1 >= maxValue.year : false,
					onClick: () => setActivePageStart(activePageStart + yearsPerPage),
					icon: /* @__PURE__ */ jsx(Chevron, { direction: "right" })
				})
			]
		}), /* @__PURE__ */ jsx(PickerGrid, {
			label: props["aria-label"] ?? "Select year",
			items: years,
			columns: 3,
			activeIndex,
			onActiveIndexChange: setActiveIndex,
			onSelect: (item) => onValueChange?.(item.value)
		})]
	});
}
function Chevron({ direction }) {
	return /* @__PURE__ */ jsx("svg", {
		viewBox: "0 0 16 16",
		"aria-hidden": "true",
		style: { transform: `rotate(${direction === "left" ? 90 : direction === "right" ? -90 : 0}deg)` },
		className: "size-3.5",
		children: /* @__PURE__ */ jsx("path", {
			d: "M4 6.5 8 10.5l4-4",
			stroke: "currentColor",
			strokeWidth: "1.6",
			strokeLinecap: "round",
			strokeLinejoin: "round",
			fill: "none"
		})
	});
}
//#endregion
export { Chevron, MonthPicker, YearPicker };

//# sourceMappingURL=month-year-picker.js.map