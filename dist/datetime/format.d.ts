import { AnyTime, CalendarDate as CalendarDate$1, CalendarDateTime as CalendarDateTime$1, DateValue as DateValue$1, Time as Time$1, ZonedDateTime as ZonedDateTime$1, getDayOfWeek, getLocalTimeZone as getLocalTimeZone$1, isWeekend, now as now$1, parseAbsolute, parseDate as parseDate$1, parseDateTime, parseTime, parseZonedDateTime, startOfMonth, toTimeZone, toZoned as toZoned$1, today as today$1 } from "@internationalized/date";
//#region src/datetime/format.d.ts
/** Any value that carries a clock time: `Time`, `CalendarDateTime` or `ZonedDateTime`. */
export type TimeValue = AnyTime;
/** An inclusive range of calendar dates: both `start` and `end` are selected. */
export interface DateRange<T extends DateValue$1 = CalendarDate$1> {
  start: T;
  end: T;
}
export declare function parseDateOnly(input: string | null | undefined): CalendarDate$1 | null;
/** Serialises a calendar date back to YYYY-MM-DD, using its own calendar fields. */
export declare function toDateOnlyString(value: DateValue$1 | null | undefined): string | null;
export declare function dateOnlyFromInstant(instant: Date | number | string, timeZone: string): CalendarDate$1;
export interface DateFormatOptions {
  /** BCP-47 locale. Defaults to `en-US` for stable Showcase output. */
  locale?: string;
  style?: "short" | "medium" | "long" | "full";
  /** Show the year. Default `true`; disable where the context states it. */
  showYear?: boolean;
  /** Only used to anchor the formatter; the value itself is timezone-free. */
  timeZone?: string;
}
export declare function formatDateOnly(value: DateValue$1 | null | undefined, options?: DateFormatOptions): string;
export declare function formatDateRange(range: DateRange | null | undefined, options?: DateFormatOptions): string;
export interface TimeFormatOptions {
  locale?: string;
  /** 12- or 24-hour clock. Omit to follow the locale's habit. */
  hourCycle?: 12 | 24;
  /** `minute` (default) renders 14:05; `second` renders 14:05:09. */
  granularity?: "minute" | "second";
}
/** Formats a time-only value. No date and no time zone — it is a wall clock. */
export declare function formatTimeValue(value: TimeValue | null | undefined, options?: TimeFormatOptions): string;
/** "September 2026" — the calendar header and the month picker's label. */
export declare function formatMonthYear(value: DateValue$1 | null | undefined, options?: DateFormatOptions): string;
/** "September" — a month name on its own, for a month grid. */
export declare function formatMonthName(value: DateValue$1 | null | undefined, options?: DateFormatOptions): string;
/** "September – October 2026" — a header that spans more than one month. */
export declare function formatMonthSpan(start: DateValue$1, end: DateValue$1, options?: DateFormatOptions): string;
/** A date with an optional clock time, formatted for display. */
export declare function formatDateTimeValue(value: DateValue$1 | null | undefined, options?: TimeFormatOptions & {
  showYear?: boolean;
}): string;
/** Inclusive containment test for a date-only range. */
export declare function isDateInRange(value: DateValue$1, range: DateRange | null | undefined): boolean;
/** Whole days between two calendar dates, ignoring any clock time. */
export declare function daysBetween(start: DateValue$1, end: DateValue$1): number;
/** A calendar date `days` later, safe across month ends and leap days. */
export declare function addDays(value: CalendarDate$1, days: number): CalendarDate$1;
export declare function addMonths(value: CalendarDate$1, months: number): CalendarDate$1;
export declare function isSameCalendarDate(a: DateValue$1 | null, b: DateValue$1 | null): boolean;
/** True when the value sits inside `min`/`max` inclusive. */
export declare function isWithinBounds(value: DateValue$1, min: DateValue$1 | null | undefined, max: DateValue$1 | null | undefined): boolean;
//#endregion
export { CalendarDate$1 as CalendarDate, CalendarDateTime$1 as CalendarDateTime, type DateValue$1 as DateValue, Time$1 as Time, ZonedDateTime$1 as ZonedDateTime, getDayOfWeek, getLocalTimeZone$1 as getLocalTimeZone, isWeekend, now$1 as now, parseAbsolute, parseDate$1 as parseDate, parseDateTime, parseTime, parseZonedDateTime, startOfMonth, toTimeZone, toZoned$1 as toZoned, today$1 as today };
//# sourceMappingURL=format.d.ts.map