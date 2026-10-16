"use client";
import { LocaleProvider } from "./providers/locale-provider.js";
import { useControllableState } from "./hooks/use-controllable-state.js";
import { cn } from "./utils/cn.js";
import { useField } from "./components/field.js";
import { inputShellClass } from "./components/input.js";
import { formatDateOnly, isSameCalendarDate } from "./datetime/format.js";
import { Calendar as Calendar$1, CalendarActionButton, CalendarFooter, RangeCalendar as RangeCalendar$1 } from "./calendar.js";
import { renderSegment } from "./datetime/segments.js";
import { Button, DateField as DateField$1, DateInput, DatePicker as DatePicker$1, DateRangePicker as DateRangePicker$1, Dialog, Group, Popover } from "react-aria-components";
import { jsx, jsxs } from "react/jsx-runtime";
import { RiArrowDownSLine, RiCalendarLine, RiCloseLine } from "@remixicon/react";
import { Time, getLocalTimeZone, toCalendarDate, toCalendarDateTime, toZoned, today } from "@internationalized/date";
//#region src/datetime/date-picker.tsx
const dateInputClass = "flex flex-1 items-center gap-0.5 overflow-hidden px-2.5";
const shellBySize = {
	sm: "h-control-sm rounded-sm text-label",
	md: "h-control-md rounded-md text-label",
	lg: "h-control-lg rounded-md text-body"
};
const triggerBySize = {
	sm: "size-6",
	md: "size-6",
	lg: "size-7"
};
const popoverClass = cn("z-[var(--z-popover)] rounded-lg border border-line-default bg-surface-overlay text-fg-primary luc-float", "data-[entering]:animate-[luc-overlay-in_var(--motion-fast)_var(--ease-enter)]", "data-[exiting]:animate-[luc-overlay-out_var(--motion-fast)_var(--ease-exit)]");
/**
* What "Today" means for this field.
*
* A date-only field gets today's date. A date-and-time field keeps the clock
* the user already chose (or midnight when empty), and a zoned field keeps its
* zone — so the action never silently changes the value's shape.
*/
function todayFor({ todayValue, reference, granularity }) {
	const base = todayValue ?? today(getLocalTimeZone());
	if (granularity === void 0 || granularity === "day") return base;
	const time = reference && "hour" in reference ? new Time(reference.hour, reference.minute, "second" in reference ? reference.second ?? 0 : 0) : void 0;
	const dateTime = toCalendarDateTime(base, time);
	if (reference && "timeZone" in reference) return toZoned(dateTime, reference.timeZone);
	return dateTime;
}
function TriggerButton({ size, className, children, ...props }) {
	return /* @__PURE__ */ jsx(Button, {
		...props,
		className: cn("mr-1 grid shrink-0 place-items-center rounded-xs text-fg-muted luc-transition luc-focus", "hover:bg-surface-interactive-hover hover:text-fg-primary", "disabled:pointer-events-none disabled:opacity-40", triggerBySize[size], className),
		children
	});
}
/** Shared shell for every segmented date control. */
function shellClass(field, invalid, size, className) {
	return cn(inputShellClass, shellBySize[size], "gap-0", invalid && "border-negative shadow-[0_0_0_3px_var(--negative-soft)]", field.readOnly && "border-dashed bg-surface-canvas", className);
}
/** Segment renderer: the same treatment everywhere a date is editable. */
function segmentRenderer() {
	return (segment) => renderSegment(segment);
}
/**
* A date (or date-and-time) field with segmented editing and no popover. Use it
* in a dense filter bar where a calendar would be too much surface.
*/
function DateField({ size = "md", invalid, disabled, readOnly, className, trailingAction, ...props }) {
	const field = useField();
	const isInvalid = invalid ?? field.invalid;
	return /* @__PURE__ */ jsx(LocaleProvider, {
		locale: props.locale,
		children: /* @__PURE__ */ jsxs(DateField$1, {
			...props,
			id: field.id,
			"aria-describedby": field.describedBy,
			"aria-labelledby": field.labelId,
			isInvalid,
			isDisabled: disabled ?? field.disabled,
			isReadOnly: readOnly ?? field.readOnly,
			className: shellClass(field, isInvalid, size, className),
			children: [/* @__PURE__ */ jsx(DateInput, {
				className: dateInputClass,
				children: segmentRenderer()
			}), trailingAction]
		})
	});
}
/** One date, chosen from a calendar or typed segment by segment. */
function DatePicker({ onValueChange, size = "md", invalid, disabled, readOnly, required, locale, viewSwitch = true, showTodayAction = true, showClearAction = true, calendarButtonLabel, footer, className, todayValue, value, ...props }) {
	const field = useField();
	const isInvalid = invalid ?? field.invalid;
	const resolvedToday = todayFor({
		todayValue,
		reference: value,
		granularity: props.granularity
	});
	return /* @__PURE__ */ jsx(LocaleProvider, {
		locale,
		children: /* @__PURE__ */ jsxs(DatePicker$1, {
			...props,
			value,
			onChange: (next) => onValueChange?.(next),
			isInvalid,
			isDisabled: disabled ?? field.disabled,
			isReadOnly: readOnly ?? field.readOnly,
			isRequired: required ?? field.required,
			className: "flex min-w-0 flex-col gap-1.5",
			children: [/* @__PURE__ */ jsxs(Group, {
				className: shellClass(field, isInvalid, size, className),
				id: field.id,
				"aria-describedby": field.describedBy,
				"aria-labelledby": field.labelId,
				children: [/* @__PURE__ */ jsx(DateInput, {
					className: dateInputClass,
					children: segmentRenderer()
				}), /* @__PURE__ */ jsx(TriggerButton, {
					slot: "calendar",
					size,
					"aria-label": calendarButtonLabel,
					children: /* @__PURE__ */ jsx(RiCalendarLine, {
						"aria-hidden": "true",
						className: "size-4"
					})
				})]
			}), /* @__PURE__ */ jsx(Popover, {
				offset: 8,
				className: popoverClass,
				children: /* @__PURE__ */ jsx(Dialog, {
					className: "outline-none",
					children: /* @__PURE__ */ jsx(Calendar$1, {
						locale,
						viewSwitch,
						value: value ?? null,
						onChange: (next) => onValueChange?.(next),
						minValue: props.minValue,
						maxValue: props.maxValue,
						isDateUnavailable: props.isDateUnavailable,
						className: "border-0 shadow-none",
						footer: showTodayAction || showClearAction || footer ? /* @__PURE__ */ jsxs(CalendarFooter, { children: [showTodayAction ? /* @__PURE__ */ jsx(CalendarActionButton, {
							onClick: () => onValueChange?.(resolvedToday),
							children: "Today"
						}) : /* @__PURE__ */ jsx("span", {}), /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2",
							children: [footer, showClearAction ? /* @__PURE__ */ jsxs(CalendarActionButton, {
								className: "inline-flex items-center gap-1",
								onClick: () => onValueChange?.(null),
								children: [/* @__PURE__ */ jsx(RiCloseLine, {
									"aria-hidden": "true",
									className: "size-3"
								}), "Clear"]
							}) : null]
						})] }) : null
					})
				})
			})]
		})
	});
}
/**
* A start/end date range. Both ends are inclusive and neither is nudged to
* 23:59:59 — a range of dates is a pair of dates, and what it means to a query
* is the consumer's decision.
*/
function DateRangePicker({ onValueChange, size = "md", invalid, disabled, readOnly, required, locale, months = 2, presets, showTodayAction = true, showClearAction = true, calendarButtonLabel, footer, className, todayValue, value, defaultValue, ...props }) {
	const field = useField();
	const isInvalid = invalid ?? field.invalid;
	const resolvedToday = todayFor({ todayValue });
	const [current, setCurrent] = useControllableState({
		value,
		defaultValue: defaultValue ?? null,
		onChange: onValueChange
	});
	const resolvePreset = (preset) => typeof preset.range === "function" ? preset.range({ today: toCalendarDate(resolvedToday) }) : preset.range;
	return /* @__PURE__ */ jsx(LocaleProvider, {
		locale,
		children: /* @__PURE__ */ jsxs(DateRangePicker$1, {
			...props,
			value: current,
			onChange: (next) => setCurrent(next),
			isInvalid,
			isDisabled: disabled ?? field.disabled,
			isReadOnly: readOnly ?? field.readOnly,
			isRequired: required ?? field.required,
			className: cn("flex min-w-0 flex-col gap-1.5", className),
			children: [/* @__PURE__ */ jsxs(Group, {
				className: shellClass(field, isInvalid, size),
				id: field.id,
				"aria-describedby": field.describedBy,
				"aria-labelledby": field.labelId,
				children: [
					/* @__PURE__ */ jsx(DateInput, {
						slot: "start",
						className: dateInputClass,
						children: segmentRenderer()
					}),
					/* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						className: "px-0.5 text-fg-muted",
						children: "–"
					}),
					/* @__PURE__ */ jsx(DateInput, {
						slot: "end",
						className: cn(dateInputClass, "pl-0.5"),
						children: segmentRenderer()
					}),
					/* @__PURE__ */ jsx(TriggerButton, {
						slot: "calendar",
						size,
						"aria-label": calendarButtonLabel,
						children: /* @__PURE__ */ jsx(RiArrowDownSLine, {
							"aria-hidden": "true",
							className: "size-4"
						})
					})
				]
			}), /* @__PURE__ */ jsx(Popover, {
				offset: 8,
				className: popoverClass,
				children: /* @__PURE__ */ jsx(Dialog, {
					className: "outline-none",
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex max-w-[calc(100vw-2rem)] flex-col sm:max-w-none sm:flex-row",
						children: [presets && presets.length > 0 ? /* @__PURE__ */ jsxs("div", {
							className: "flex gap-1 overflow-x-auto border-b border-line-subtle p-2 sm:w-40 sm:flex-col sm:border-r sm:border-b-0 sm:overflow-visible",
							children: [/* @__PURE__ */ jsx("p", {
								className: "hidden px-2 pt-1 pb-1.5 text-micro font-medium text-fg-muted uppercase sm:block",
								children: "Ranges"
							}), presets.map((preset) => {
								const presetRange = resolvePreset(preset);
								const selected = Boolean(current) && isSameCalendarDate(current.start, presetRange.start) && isSameCalendarDate(current.end, presetRange.end);
								return /* @__PURE__ */ jsx("button", {
									type: "button",
									onClick: () => onValueChange?.(presetRange),
									className: cn("shrink-0 rounded-sm px-2 py-1.5 text-left text-label luc-transition luc-focus", "hover:bg-surface-interactive-hover hover:text-fg-primary", selected ? "bg-accent-soft text-fg-accent" : "text-fg-secondary"),
									children: preset.label
								}, preset.id);
							})]
						}) : null, /* @__PURE__ */ jsx(RangeCalendar$1, {
							locale,
							months,
							value: current ?? null,
							onChange: (next) => setCurrent(next),
							minValue: props.minValue,
							maxValue: props.maxValue,
							isDateUnavailable: props.isDateUnavailable,
							className: "border-0 shadow-none",
							footer: showTodayAction || showClearAction || footer ? /* @__PURE__ */ jsxs(CalendarFooter, { children: [/* @__PURE__ */ jsx("span", {
								className: "text-caption text-fg-muted",
								children: current ? `${formatDateOnly(current.start, { locale })} – ${formatDateOnly(current.end, { locale })}` : "Select a start and end date"
							}), /* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2",
								children: [
									footer,
									showTodayAction ? /* @__PURE__ */ jsx(CalendarActionButton, {
										onClick: () => setCurrent({
											start: todayFor({
												todayValue,
												reference: current?.start,
												granularity: props.granularity
											}),
											end: todayFor({
												todayValue,
												reference: current?.end,
												granularity: props.granularity
											})
										}),
										children: "Today"
									}) : null,
									showClearAction ? /* @__PURE__ */ jsx(CalendarActionButton, {
										onClick: () => onValueChange?.(null),
										children: "Clear"
									}) : null
								]
							})] }) : null
						})]
					})
				})
			})]
		})
	});
}
//#endregion
export { DateField, DatePicker, DateRangePicker };

//# sourceMappingURL=date-picker.js.map