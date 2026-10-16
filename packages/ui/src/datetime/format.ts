"use client";

import {
  CalendarDate,
  CalendarDateTime,
  DateFormatter,
  Time,
  ZonedDateTime,
  createCalendar,
  fromDate,
  getDayOfWeek,
  getLocalTimeZone,
  isWeekend,
  now,
  parseDate,
  parseAbsolute,
  parseDateTime,
  parseTime,
  parseZonedDateTime,
  startOfMonth,
  toCalendarDate,
  toCalendar,
  toTimeZone,
  toZoned,
  today,
  type AnyTime,
  type DateValue,
} from "@internationalized/date";

/*
 * LUC date and time formatting.
 *
 * Four value kinds are kept apart on purpose, and the type is the documentation:
 *
 *   CalendarDate      "2026-09-27"        a calendar date: no clock, no zone
 *   CalendarDateTime  "2026-09-27T09:30"  a local wall clock, no zone
 *   ZonedDateTime     "…[Europe/Berlin]"  a wall clock in a named zone
 *   Date / epoch ms                       an absolute instant
 *
 * A CalendarDate is never a `Date`. The language parses `new Date("2026-09-27")`
 * as UTC midnight, so west of Greenwich it reads back as 2026-09-26 — which is
 * why nothing here builds a `Date` from a date-only string. A `Date` only enters
 * at the edges, through an explicitly named time zone.
 * See docs/DATE_TIME_GUIDE.md.
 */

export { CalendarDate, CalendarDateTime, Time, ZonedDateTime, startOfMonth, today };
export {
  getDayOfWeek,
  getLocalTimeZone,
  isWeekend,
  now,
  parseAbsolute,
  parseDate,
  parseDateTime,
  parseTime,
  parseZonedDateTime,
  toTimeZone,
  toZoned,
};
export type { DateValue };

/** Any value that carries a clock time: `Time`, `CalendarDateTime` or `ZonedDateTime`. */
export type TimeValue = AnyTime;

/** An inclusive range of calendar dates: both `start` and `end` are selected. */
export interface DateRange<T extends DateValue = CalendarDate> {
  start: T;
  end: T;
}

const ISO_DATE_ONLY = /^(\d{4,6})-(\d{2})-(\d{2})$/;

/*
 * Parses a strict YYYY-MM-DD string into a calendar date.
 *
 * Strict means strict: "2026-2-3" returns null rather than guessing, and so does
 * an impossible day like 2026-02-30. Ambiguity here is how a form silently books
 * the wrong day.
 */
export function parseDateOnly(input: string | null | undefined): CalendarDate | null {
  if (!input) return null;
  if (!ISO_DATE_ONLY.test(input.trim())) return null;
  try {
    return parseDate(input.trim());
  } catch {
    return null;
  }
}

/** Serialises a calendar date back to YYYY-MM-DD, using its own calendar fields. */
export function toDateOnlyString(value: DateValue | null | undefined): string | null {
  if (!value) return null;
  const pad = (input: number, length = 2) => String(Math.abs(input)).padStart(length, "0");
  const isBce = value.era !== undefined && value.era !== "AD" && value.era !== "CE";
  return `${isBce ? "-" : ""}${pad(value.year, 4)}-${pad(value.month)}-${pad(value.day)}`;
}

/*
 * Converts an absolute instant into a calendar date in a named zone.
 *
 * The time zone is required: "what day is this timestamp?" has no answer without
 * one, and defaulting to the machine's zone is how a report for 1 January turns
 * into 31 December.
 */
export function dateOnlyFromInstant(instant: Date | number | string, timeZone: string): CalendarDate {
  const date = instant instanceof Date ? instant : new Date(instant);
  return toCalendarDate(fromDate(date, timeZone));
}

export interface DateFormatOptions {
  /** BCP-47 locale. Defaults to `en-US` for stable Showcase output. */
  locale?: string;
  style?: "short" | "medium" | "long" | "full";
  /** Show the year. Default `true`; disable where the context states it. */
  showYear?: boolean;
  /** Only used to anchor the formatter; the value itself is timezone-free. */
  timeZone?: string;
}

const STYLE_OPTIONS: Record<NonNullable<DateFormatOptions["style"]>, Intl.DateTimeFormatOptions> = {
  short: { day: "numeric", month: "numeric" },
  medium: { day: "numeric", month: "short" },
  long: { day: "numeric", month: "long" },
  full: { day: "numeric", month: "long", weekday: "long" },
};

/*
 * Formats a calendar date without rebuilding it from a `Date`: the value is
 * anchored at UTC noon and the formatter is given the same UTC zone, so the day
 * cannot move, on any machine, in any season.
 */
export function formatDateOnly(value: DateValue | null | undefined, options: DateFormatOptions = {}): string {
  if (!value) return "—";
  const { locale = "en-US", style = "medium", showYear = true, timeZone = "UTC" } = options;
  const gregorian =
    value.calendar.identifier === "gregory" ? value : toCalendar(value, createCalendar("gregory"));
  const date = new Date(Date.UTC(gregorian.year, gregorian.month - 1, gregorian.day, 12));
  const formatter = new DateFormatter(locale, {
    ...(STYLE_OPTIONS[style] ?? STYLE_OPTIONS.medium),
    ...(showYear ? { year: "numeric" as const } : {}),
    timeZone,
  });
  return formatter.format(date);
}

/*
 * Formats a range: "Sep 27 – Oct 3, 2026".
 *
 * Deliberately *not* `Intl.DateTimeFormat.formatRange`: Node's ICU and the
 * browser's produce different range separators (thin space vs regular, or a
 * different dash), which turns every server-rendered range into a hydration
 * mismatch. Each end is formatted on its own and joined with an en dash, and a
 * shared year is printed once — the same output everywhere, in every runtime.
 */
export function formatDateRange(range: DateRange | null | undefined, options: DateFormatOptions = {}): string {
  if (!range) return "—";
  const { locale = "en-US", style = "medium", timeZone = "UTC" } = options;
  const sameYear = range.start.year === range.end.year;
  const start = formatDateOnly(range.start, { locale, style, showYear: !sameYear, timeZone });
  const end = formatDateOnly(range.end, { locale, style, showYear: true, timeZone });
  return `${start} – ${end}`;
}

export interface TimeFormatOptions {
  locale?: string;
  /** 12- or 24-hour clock. Omit to follow the locale's habit. */
  hourCycle?: 12 | 24;
  /** `minute` (default) renders 14:05; `second` renders 14:05:09. */
  granularity?: "minute" | "second";
}

/** Formats a time-only value. No date and no time zone — it is a wall clock. */
export function formatTimeValue(value: TimeValue | null | undefined, options: TimeFormatOptions = {}): string {
  if (!value) return "—";
  const { locale = "en-US", hourCycle, granularity = "minute" } = options;
  const seconds = "second" in value ? (value.second ?? 0) : 0;
  const date = new Date(Date.UTC(2000, 0, 1, value.hour, value.minute, seconds));
  return new DateFormatter(locale, {
    hour: "2-digit",
    minute: "2-digit",
    ...(granularity === "second" ? { second: "2-digit" as const } : {}),
    ...(hourCycle ? { hour12: hourCycle === 12 } : {}),
    timeZone: "UTC",
  }).format(date);
}

/** "September 2026" — the calendar header and the month picker's label. */
export function formatMonthYear(value: DateValue | null | undefined, options: DateFormatOptions = {}): string {
  if (!value) return "—";
  const { locale = "en-US", timeZone = "UTC" } = options;
  const gregorian =
    value.calendar.identifier === "gregory" ? value : toCalendar(value, createCalendar("gregory"));
  const date = new Date(Date.UTC(gregorian.year, gregorian.month - 1, gregorian.day, 12));
  return new DateFormatter(locale, { month: "long", year: "numeric", timeZone }).format(date);
}

/** "September" — a month name on its own, for a month grid. */
export function formatMonthName(value: DateValue | null | undefined, options: DateFormatOptions = {}): string {
  if (!value) return "—";
  const { locale = "en-US", timeZone = "UTC" } = options;
  const gregorian =
    value.calendar.identifier === "gregory" ? value : toCalendar(value, createCalendar("gregory"));
  const date = new Date(Date.UTC(gregorian.year, gregorian.month - 1, gregorian.day, 12));
  return new DateFormatter(locale, { month: "long", timeZone }).format(date);
}

/** "September – October 2026" — a header that spans more than one month. */
export function formatMonthSpan(
  start: DateValue,
  end: DateValue,
  options: DateFormatOptions = {},
): string {
  const { locale = "en-US", timeZone = "UTC" } = options;
  const sameYear = start.year === end.year;
  if (sameYear) {
    return `${formatMonthName(start, { locale, timeZone })} – ${formatMonthYear(end, { locale, timeZone })}`;
  }
  return `${formatMonthYear(start, { locale, timeZone })} – ${formatMonthYear(end, { locale, timeZone })}`;
}

/** A date with an optional clock time, formatted for display. */
export function formatDateTimeValue(
  value: DateValue | null | undefined,
  options: TimeFormatOptions & { showYear?: boolean } = {},
): string {
  if (!value) return "—";
  const date = formatDateOnly(value, { locale: options.locale, showYear: options.showYear });
  if (!("hour" in value)) return date;
  return `${date}, ${formatTimeValue(value as TimeValue, options)}`;
}

/** Inclusive containment test for a date-only range. */
export function isDateInRange(value: DateValue, range: DateRange | null | undefined): boolean {
  if (!range) return false;
  return value.compare(range.start) >= 0 && value.compare(range.end) <= 0;
}

/** Whole days between two calendar dates, ignoring any clock time. */
export function daysBetween(start: DateValue, end: DateValue): number {
  const toUtc = (value: DateValue) => Date.UTC(value.year, value.month - 1, value.day);
  return Math.round((toUtc(end) - toUtc(start)) / 86_400_000);
}

/** A calendar date `days` later, safe across month ends and leap days. */
export function addDays(value: CalendarDate, days: number): CalendarDate {
  return value.add({ days });
}

export function addMonths(value: CalendarDate, months: number): CalendarDate {
  return value.add({ months });
}

export function isSameCalendarDate(a: DateValue | null, b: DateValue | null): boolean {
  if (!a || !b) return false;
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** True when the value sits inside `min`/`max` inclusive. */
export function isWithinBounds(
  value: DateValue,
  min: DateValue | null | undefined,
  max: DateValue | null | undefined,
): boolean {
  if (min && value.compare(min) < 0) return false;
  if (max && value.compare(max) > 0) return false;
  return true;
}
