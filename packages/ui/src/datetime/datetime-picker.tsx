"use client";

import type { CalendarDateTime, ZonedDateTime } from "@internationalized/date";
import { DatePicker, type DatePickerProps } from "./date-picker";

// LUC DateTimePicker — two components, because "date and time" means two
// different things and a single `value` prop cannot say which one:
//
//   DateTimePicker       value: CalendarDateTime   a wall clock with no zone
//   ZonedDateTimePicker  value: ZonedDateTime      a wall clock in a named zone
//
// Neither converts anything. A local time stays local; a zoned time keeps its
// zone identifier (and its DST rule). Turning one into an instant is the
// consumer's decision, made with `toZoned` / `toDate`. See
// docs/DATE_TIME_GUIDE.md.

export type DateTimePickerProps = Omit<DatePickerProps<CalendarDateTime>, "granularity"> & {
  /** `minute` (default) or `second`. */
  granularity?: "minute" | "second";
};

/**
 * A local date and time: "2026-09-27 09:30", no time zone attached. Two people
 * in different zones see the same wall clock, which is exactly what a local
 * schedule (a market session, a meeting time) means.
 */
export function DateTimePicker({ granularity = "minute", ...props }: DateTimePickerProps) {
  return <DatePicker<CalendarDateTime> {...props} granularity={granularity} />;
}

export interface ZonedDateTimePickerProps
  extends Omit<DatePickerProps<ZonedDateTime>, "granularity"> {
  granularity?: "minute" | "second";
}

/*
 * A zoned date and time. The zone lives in the value (`ZonedDateTime` carries
 * its identifier), never in a hidden default: `parseZonedDateTime` or
 * `toZoned(date, "Europe/Berlin")` decides it once, at the edge of the app.
 *
 * When the field is empty, pass a zoned `defaultValue` or `placeholderValue` so
 * the segments can show a zone abbreviation — otherwise React Aria falls back to
 * the browser's zone for display only, and the first selection carries the
 * consumer's own zone.
 */
export function ZonedDateTimePicker({ granularity = "minute", ...props }: ZonedDateTimePickerProps) {
  return <DatePicker<ZonedDateTime> {...props} granularity={granularity} />;
}
