"use client";
import { LocaleProvider } from "./providers/locale-provider.js";
import { cn } from "./utils/cn.js";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "./components/popover.js";
import { formatMonthSpan, formatMonthYear } from "./datetime/format.js";
import { Chevron, MonthPicker, YearPicker } from "./datetime/month-year-picker.js";
import { Button, Calendar as Calendar$1, CalendarCell, CalendarGrid, CalendarGridBody, CalendarGridHeader, CalendarHeaderCell, CalendarStateContext, RangeCalendar as RangeCalendar$1, RangeCalendarStateContext } from "react-aria-components";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useContext, useState } from "react";
import { CalendarDate } from "@internationalized/date";
//#region src/datetime/calendar.tsx
const cellClass = cn("relative grid size-8 place-items-center rounded-sm text-label text-fg-secondary luc-numeric", "cursor-default select-none luc-transition", "data-[hovered]:bg-surface-interactive-hover data-[hovered]:text-fg-primary", "data-[outside-month]:text-fg-muted", "data-[today]:text-fg-primary data-[today]:shadow-[inset_0_0_0_1px_var(--calendar-today-ring)]", "data-[unavailable]:text-calendar-unavailable data-[unavailable]:line-through", "data-[disabled]:pointer-events-none data-[disabled]:text-fg-disabled", "focus-visible:outline-none focus-visible:text-fg-primary focus-visible:shadow-[var(--glow-focus)]");
const rangeCellClass = cn(cellClass, "data-[selected]:rounded-none data-[selected]:bg-calendar-range", "data-[selection-start]:rounded-l-sm data-[selection-start]:bg-calendar-range-edge", "data-[selection-end]:rounded-r-sm data-[selection-end]:bg-calendar-range-edge", "data-[selection-start]:text-fg-primary data-[selection-end]:text-fg-primary");
const navButtonClass = cn("grid size-7 place-items-center rounded-sm text-fg-muted luc-transition luc-focus", "hover:bg-surface-interactive-hover hover:text-fg-primary", "disabled:pointer-events-none disabled:opacity-40");
const weekdayClass = "pb-1.5 text-center text-micro font-medium text-fg-muted uppercase";
/** The month/year jump, driven by whichever calendar state is around it. */
function CalendarViewSwitch({ locale }) {
	const calendarState = useContext(CalendarStateContext);
	const rangeState = useContext(RangeCalendarStateContext);
	const state = calendarState ?? rangeState;
	const [view, setView] = useState("months");
	const [open, setOpen] = useState(false);
	if (!state) return null;
	const visible = state.visibleRange.start;
	const close = () => {
		setOpen(false);
		setView("months");
	};
	return /* @__PURE__ */ jsxs(PopoverRoot, {
		open,
		onOpenChange: (next) => next ? setOpen(true) : close(),
		children: [/* @__PURE__ */ jsx(PopoverTrigger, {
			asChild: true,
			children: /* @__PURE__ */ jsxs("button", {
				type: "button",
				className: cn("inline-flex h-7 items-center gap-1.5 rounded-sm px-2 text-label font-medium text-fg-primary luc-transition luc-focus", "hover:bg-surface-interactive-hover"),
				children: [formatMonthYear(visible, { locale }), /* @__PURE__ */ jsx(Chevron, { direction: "down" })]
			})
		}), /* @__PURE__ */ jsx(PopoverContent, {
			align: "start",
			sideOffset: 6,
			className: "p-2.5",
			children: view === "months" ? /* @__PURE__ */ jsx(MonthPicker, {
				locale,
				value: visible,
				year: visible.year,
				minValue: state.minValue ?? void 0,
				maxValue: state.maxValue ?? void 0,
				onYearChange: (next) => state.setFocusedDate(new CalendarDate(next, visible.month, 1)),
				onValueChange: (next) => {
					state.setFocusedDate(next);
					close();
				},
				footer: /* @__PURE__ */ jsx("div", {
					className: "flex items-center justify-between gap-2 border-t border-line-subtle pt-2",
					children: /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => setView("years"),
						className: "rounded-xs px-1.5 py-1 text-caption text-fg-muted luc-transition luc-focus hover:bg-surface-interactive-hover hover:text-fg-primary",
						children: "Choose year…"
					})
				})
			}) : /* @__PURE__ */ jsx(YearPicker, {
				locale,
				value: visible,
				minValue: state.minValue ?? void 0,
				maxValue: state.maxValue ?? void 0,
				onValueChange: (next) => {
					state.setFocusedDate(new CalendarDate(next.year, visible.month, 1));
					setView("months");
				}
			})
		})]
	});
}
function CalendarHeader({ locale, viewSwitch }) {
	return /* @__PURE__ */ jsxs("header", {
		className: "flex items-center justify-between gap-1 pb-2",
		children: [
			/* @__PURE__ */ jsx(Button, {
				slot: "previous",
				className: navButtonClass,
				children: /* @__PURE__ */ jsx(Chevron, { direction: "left" })
			}),
			viewSwitch ? /* @__PURE__ */ jsx(CalendarViewSwitch, { locale }) : /* @__PURE__ */ jsx("span", {
				className: "text-label font-medium text-fg-primary",
				children: /* @__PURE__ */ jsx(CalendarViewSwitchLabel, { locale })
			}),
			/* @__PURE__ */ jsx(Button, {
				slot: "next",
				className: navButtonClass,
				children: /* @__PURE__ */ jsx(Chevron, { direction: "right" })
			})
		]
	});
}
/** Static month label, for calendars that do not offer the jump. */
function CalendarViewSwitchLabel({ locale }) {
	const calendarState = useContext(CalendarStateContext);
	const rangeState = useContext(RangeCalendarStateContext);
	const state = calendarState ?? rangeState;
	if (!state) return null;
	return /* @__PURE__ */ jsx(Fragment, { children: formatMonthYear(state.visibleRange.start, { locale }) });
}
function DayGrid({ variant, offset, weekdayStyle = "short" }) {
	return /* @__PURE__ */ jsxs(CalendarGrid, {
		offset,
		weekdayStyle,
		className: "border-separate border-spacing-y-0.5",
		children: [/* @__PURE__ */ jsx(CalendarGridHeader, { children: (day) => /* @__PURE__ */ jsx(CalendarHeaderCell, {
			className: weekdayClass,
			children: day
		}) }), /* @__PURE__ */ jsx(CalendarGridBody, { children: (date) => /* @__PURE__ */ jsx(CalendarCell, {
			date,
			className: variant === "range" ? rangeCellClass : cellClass
		}) })]
	});
}
/**
* A single-date calendar. Compose it under a `Popover` for a DatePicker, or use
* it inline for a scheduling surface.
*/
function Calendar({ locale, viewSwitch = true, onValueChange, footer, className, ...props }) {
	return /* @__PURE__ */ jsx(LocaleProvider, {
		locale,
		children: /* @__PURE__ */ jsxs(Calendar$1, {
			...props,
			onChange: (next) => onValueChange?.(next),
			className: cn("flex w-fit flex-col rounded-lg border border-line-default bg-surface-overlay p-2.5 text-fg-primary luc-float", className),
			children: [
				/* @__PURE__ */ jsx(CalendarHeader, {
					locale,
					viewSwitch
				}),
				/* @__PURE__ */ jsx(DayGrid, { variant: "single" }),
				footer
			]
		})
	});
}
/**
* A date-range calendar. Both ends are inclusive; nothing is rounded to the end
* of a day, because a range of *dates* has no clock.
*/
function RangeCalendar({ locale, viewSwitch = true, months = 1, onValueChange, footer, className, ...props }) {
	const isMultiMonth = months > 1;
	return /* @__PURE__ */ jsx(LocaleProvider, {
		locale,
		children: /* @__PURE__ */ jsxs(RangeCalendar$1, {
			...props,
			visibleDuration: { months },
			onChange: (next) => onValueChange?.(next),
			className: cn("flex w-fit flex-col rounded-lg border border-line-default bg-surface-overlay p-2.5 text-fg-primary luc-float", className),
			children: [
				isMultiMonth ? /* @__PURE__ */ jsxs("header", {
					className: "flex items-center justify-between gap-1 pb-2",
					children: [
						/* @__PURE__ */ jsx(Button, {
							slot: "previous",
							className: navButtonClass,
							children: /* @__PURE__ */ jsx(Chevron, { direction: "left" })
						}),
						/* @__PURE__ */ jsx("span", {
							className: "text-label font-medium text-fg-primary",
							children: /* @__PURE__ */ jsx(MonthSpanLabel, { locale })
						}),
						/* @__PURE__ */ jsx(Button, {
							slot: "next",
							className: navButtonClass,
							children: /* @__PURE__ */ jsx(Chevron, { direction: "right" })
						})
					]
				}) : /* @__PURE__ */ jsx(CalendarHeader, {
					locale,
					viewSwitch
				}),
				/* @__PURE__ */ jsx("div", {
					className: cn("flex gap-6", !isMultiMonth && "flex-col"),
					children: Array.from({ length: months }, (_, index) => /* @__PURE__ */ jsx("div", {
						className: "flex flex-col",
						children: /* @__PURE__ */ jsx(DayGrid, {
							variant: "range",
							offset: index === 0 ? void 0 : { months: index }
						})
					}, index))
				}),
				footer
			]
		})
	});
}
/** One heading for a multi-month range: "September – October 2026". */
function MonthSpanLabel({ locale }) {
	const state = useContext(RangeCalendarStateContext);
	if (!state) return null;
	return /* @__PURE__ */ jsx(Fragment, { children: formatMonthSpan(state.visibleRange.start, state.visibleRange.end, { locale }) });
}
/** The action strip under a calendar grid. */
function CalendarFooter({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "calendar-footer",
		className: cn("mt-2 flex items-center justify-between gap-2 border-t border-line-subtle pt-2", className),
		...props
	});
}
/**
* A quiet action inside a calendar footer.
*
* It is a plain `<button>` on purpose: everything rendered inside `<Calendar>`
* shares React Aria's *calendar button slots* (`previous` / `next`), so a
* react-aria `Button` here would need a slot it does not have. A native button
* keeps the date semantics intact and still gets the dialog's focus handling.
*/
function CalendarActionButton({ className, type = "button", ...props }) {
	return /* @__PURE__ */ jsx("button", {
		"data-slot": "calendar-action",
		type,
		className: cn("rounded-xs px-1.5 py-1 text-caption text-fg-muted luc-transition luc-focus", "hover:bg-surface-interactive-hover hover:text-fg-primary", "disabled:pointer-events-none disabled:opacity-45", className),
		...props
	});
}
//#endregion
export { Calendar, CalendarActionButton, CalendarFooter, RangeCalendar };

//# sourceMappingURL=calendar.js.map