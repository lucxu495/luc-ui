import { CalendarDate, type DateRangePreset } from "@luc/ui";

/*
 * Showcase form and date fixtures.
 *
 * `DEMO_TODAY` is deliberately frozen: a screenshot or a test that changes
 * meaning every midnight is not a screenshot or a test. Real products use the
 * real clock — every date control accepts `todayValue` for exactly this reason,
 * and its default is `today(getLocalTimeZone())`.
 */
export const DEMO_TODAY = new CalendarDate(2026, 9, 26);

export const DEMO_RANGE = {
  start: new CalendarDate(2026, 9, 1),
  end: new CalendarDate(2026, 9, 26),
};

/** Generic research windows. LUC ships the shape, not the policy. */
export const RANGE_PRESETS: DateRangePreset[] = [
  {
    id: "7d",
    label: "Last 7 days",
    range: ({ today }) => ({ start: today.subtract({ days: 6 }), end: today }),
  },
  {
    id: "30d",
    label: "Last 30 days",
    range: ({ today }) => ({ start: today.subtract({ days: 29 }), end: today }),
  },
  {
    id: "mtd",
    label: "This month",
    range: ({ today }) => ({ start: today.set({ day: 1 }), end: today }),
  },
  {
    id: "prev-month",
    label: "Previous month",
    range: ({ today }) => {
      const start = today.set({ day: 1 }).subtract({ months: 1 });
      return { start, end: start.add({ months: 1 }).subtract({ days: 1 }) };
    },
  },
  {
    id: "ytd",
    label: "Year to date",
    range: ({ today }) => ({ start: new CalendarDate(today.year, 1, 1), end: today }),
  },
  {
    id: "last-year",
    label: "Last year",
    range: ({ today }) => ({
      start: new CalendarDate(today.year - 1, 1, 1),
      end: new CalendarDate(today.year - 1, 12, 31),
    }),
  },
];

/** A single-month window, used by date-filter demos. */
export const MONTH_PRESETS: DateRangePreset[] = [
  {
    id: "aug",
    label: "August 2026",
    range: { start: new CalendarDate(2026, 8, 1), end: new CalendarDate(2026, 8, 31) },
  },
  {
    id: "sep",
    label: "September 2026",
    range: { start: new CalendarDate(2026, 9, 1), end: new CalendarDate(2026, 9, 30) },
  },
  ...RANGE_PRESETS,
];

/** Timezones used in the date/time demos. */
export const DEMO_TIME_ZONES = ["UTC", "Europe/Berlin", "America/New_York", "Asia/Tokyo"] as const;
