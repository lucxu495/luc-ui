"use client";
import { CalendarDate as CalendarDate$1, CalendarDateTime as CalendarDateTime$1, DateFormatter, Time as Time$1, ZonedDateTime as ZonedDateTime$1, createCalendar, fromDate, getDayOfWeek, getLocalTimeZone as getLocalTimeZone$1, isWeekend, now as now$1, parseAbsolute, parseDate as parseDate$1, parseDateTime, parseTime, parseZonedDateTime, startOfMonth, toCalendar, toCalendarDate, toTimeZone, toZoned as toZoned$1, today as today$1 } from "@internationalized/date";
//#region src/datetime/format.ts
const ISO_DATE_ONLY = /^(\d{4,6})-(\d{2})-(\d{2})$/;
function parseDateOnly(input) {
	if (!input) return null;
	if (!ISO_DATE_ONLY.test(input.trim())) return null;
	try {
		return parseDate$1(input.trim());
	} catch {
		return null;
	}
}
/** Serialises a calendar date back to YYYY-MM-DD, using its own calendar fields. */
function toDateOnlyString(value) {
	if (!value) return null;
	const pad = (input, length = 2) => String(Math.abs(input)).padStart(length, "0");
	return `${value.era !== void 0 && value.era !== "AD" && value.era !== "CE" ? "-" : ""}${pad(value.year, 4)}-${pad(value.month)}-${pad(value.day)}`;
}
function dateOnlyFromInstant(instant, timeZone) {
	const date = instant instanceof Date ? instant : new Date(instant);
	return toCalendarDate(fromDate(date, timeZone));
}
const STYLE_OPTIONS = {
	short: {
		day: "numeric",
		month: "numeric"
	},
	medium: {
		day: "numeric",
		month: "short"
	},
	long: {
		day: "numeric",
		month: "long"
	},
	full: {
		day: "numeric",
		month: "long",
		weekday: "long"
	}
};
function formatDateOnly(value, options = {}) {
	if (!value) return "—";
	const { locale = "en-US", style = "medium", showYear = true, timeZone = "UTC" } = options;
	const gregorian = value.calendar.identifier === "gregory" ? value : toCalendar(value, createCalendar("gregory"));
	const date = new Date(Date.UTC(gregorian.year, gregorian.month - 1, gregorian.day, 12));
	return new DateFormatter(locale, {
		...STYLE_OPTIONS[style] ?? STYLE_OPTIONS.medium,
		...showYear ? { year: "numeric" } : {},
		timeZone
	}).format(date);
}
function formatDateRange(range, options = {}) {
	if (!range) return "—";
	const { locale = "en-US", style = "medium", timeZone = "UTC" } = options;
	const sameYear = range.start.year === range.end.year;
	return `${formatDateOnly(range.start, {
		locale,
		style,
		showYear: !sameYear,
		timeZone
	})} – ${formatDateOnly(range.end, {
		locale,
		style,
		showYear: true,
		timeZone
	})}`;
}
/** Formats a time-only value. No date and no time zone — it is a wall clock. */
function formatTimeValue(value, options = {}) {
	if (!value) return "—";
	const { locale = "en-US", hourCycle, granularity = "minute" } = options;
	const seconds = "second" in value ? value.second ?? 0 : 0;
	const date = new Date(Date.UTC(2e3, 0, 1, value.hour, value.minute, seconds));
	return new DateFormatter(locale, {
		hour: "2-digit",
		minute: "2-digit",
		...granularity === "second" ? { second: "2-digit" } : {},
		...hourCycle ? { hour12: hourCycle === 12 } : {},
		timeZone: "UTC"
	}).format(date);
}
/** "September 2026" — the calendar header and the month picker's label. */
function formatMonthYear(value, options = {}) {
	if (!value) return "—";
	const { locale = "en-US", timeZone = "UTC" } = options;
	const gregorian = value.calendar.identifier === "gregory" ? value : toCalendar(value, createCalendar("gregory"));
	const date = new Date(Date.UTC(gregorian.year, gregorian.month - 1, gregorian.day, 12));
	return new DateFormatter(locale, {
		month: "long",
		year: "numeric",
		timeZone
	}).format(date);
}
/** "September" — a month name on its own, for a month grid. */
function formatMonthName(value, options = {}) {
	if (!value) return "—";
	const { locale = "en-US", timeZone = "UTC" } = options;
	const gregorian = value.calendar.identifier === "gregory" ? value : toCalendar(value, createCalendar("gregory"));
	const date = new Date(Date.UTC(gregorian.year, gregorian.month - 1, gregorian.day, 12));
	return new DateFormatter(locale, {
		month: "long",
		timeZone
	}).format(date);
}
/** "September – October 2026" — a header that spans more than one month. */
function formatMonthSpan(start, end, options = {}) {
	const { locale = "en-US", timeZone = "UTC" } = options;
	if (start.year === end.year) return `${formatMonthName(start, {
		locale,
		timeZone
	})} – ${formatMonthYear(end, {
		locale,
		timeZone
	})}`;
	return `${formatMonthYear(start, {
		locale,
		timeZone
	})} – ${formatMonthYear(end, {
		locale,
		timeZone
	})}`;
}
/** A date with an optional clock time, formatted for display. */
function formatDateTimeValue(value, options = {}) {
	if (!value) return "—";
	const date = formatDateOnly(value, {
		locale: options.locale,
		showYear: options.showYear
	});
	if (!("hour" in value)) return date;
	return `${date}, ${formatTimeValue(value, options)}`;
}
/** Inclusive containment test for a date-only range. */
function isDateInRange(value, range) {
	if (!range) return false;
	return value.compare(range.start) >= 0 && value.compare(range.end) <= 0;
}
/** Whole days between two calendar dates, ignoring any clock time. */
function daysBetween(start, end) {
	const toUtc = (value) => Date.UTC(value.year, value.month - 1, value.day);
	return Math.round((toUtc(end) - toUtc(start)) / 864e5);
}
/** A calendar date `days` later, safe across month ends and leap days. */
function addDays(value, days) {
	return value.add({ days });
}
function addMonths(value, months) {
	return value.add({ months });
}
function isSameCalendarDate(a, b) {
	if (!a || !b) return false;
	return a.year === b.year && a.month === b.month && a.day === b.day;
}
/** True when the value sits inside `min`/`max` inclusive. */
function isWithinBounds(value, min, max) {
	if (min && value.compare(min) < 0) return false;
	if (max && value.compare(max) > 0) return false;
	return true;
}
//#endregion
export { CalendarDate$1 as CalendarDate, CalendarDateTime$1 as CalendarDateTime, Time$1 as Time, ZonedDateTime$1 as ZonedDateTime, addDays, addMonths, dateOnlyFromInstant, daysBetween, formatDateOnly, formatDateRange, formatDateTimeValue, formatMonthName, formatMonthSpan, formatMonthYear, formatTimeValue, getDayOfWeek, getLocalTimeZone$1 as getLocalTimeZone, isDateInRange, isSameCalendarDate, isWeekend, isWithinBounds, now$1 as now, parseAbsolute, parseDate$1 as parseDate, parseDateOnly, parseDateTime, parseTime, parseZonedDateTime, startOfMonth, toDateOnlyString, toTimeZone, toZoned$1 as toZoned, today$1 as today };

//# sourceMappingURL=format.js.map