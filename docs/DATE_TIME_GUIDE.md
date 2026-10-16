# LUC UI — date & time guide

Dates are where UI systems quietly break: a day shifts across a time zone, a
"date" becomes a timestamp, a report for 1 January covers 31 December. LUC UI
removes that class of bug by keeping four *different kinds of value* different —
in the types, in the components and in the public API.

## 1. The four value kinds

| Kind | Type (`@internationalized/date`) | Example | Has a clock? | Has a zone? |
| --- | --- | --- | --- | --- |
| Calendar date | `CalendarDate` | `2026-09-27` | no | no |
| Time of day | `Time` | `14:05` | yes | no |
| Local date + time | `CalendarDateTime` | `2026-09-27T09:30` | yes | no |
| Zoned date + time | `ZonedDateTime` | `2026-09-27T09:30[Europe/Berlin]` | yes | yes, in the value |

A JavaScript `Date` is an **absolute instant**. It appears in exactly one place
in the public API: `dateOnlyFromInstant(instant, timeZone)`, where the zone is a
required argument.

## 2. The rule that matters most

```ts
// Never do this.
new Date("2026-09-27");
// The language parses a date-only string as *UTC midnight*, so west of
// Greenwich this reads back as 2026-09-26. Half the world's bugs.

// Do this.
parseDateOnly("2026-09-27");        // → CalendarDate, no zone involved
toDateOnlyString(date);             // → "2026-09-27", calendar fields only
dateOnlyFromInstant(instant, "Asia/Tokyo"); // the zone is explicit
```

`parseDateOnly` is strict: `"2026-2-3"`, `"27/09/2026"` and `"2026-02-30"` all
return `null` instead of guessing.

## 3. Timezone policy

LUC UI has no timezone policy. It has a rule about where the decision is made.

- **Date-only controls** have no time zone and never need one.
- **Time-only controls** have no date and never imply one.
- **`DateTimePicker`** edits a wall clock. Two people in different zones see the
  same 09:30 — which is what a market session or a meeting time actually means.
- **`ZonedDateTimePicker`** edits a value that carries its own zone identifier.
  The zone lives in the value, so it survives serialisation and DST. When the
  field is empty, pass a zoned `defaultValue`/`placeholderValue` so the segments
  can show an abbreviation.
- Converting between kinds (`toZoned`, `toTimeZone`, `toCalendarDate`,
  `getLocalTimeZone`, `now`) is available and explicit. Nothing converts
  silently.

Ranges of dates are **inclusive at both ends** and are never nudged to
`23:59:59`. Whether "1–31 January" covers the whole of 31 January in a given
zone is the query layer's decision.

## 4. Locale policy

Nothing about the calendars is hard-coded to Sunday-start, `MM/DD/YYYY` or Latin
digits. The locale drives the segment order, weekday and month names, the first
day of the week, the 12/24-hour clock, the numerals and the range separators.

```tsx
<LocaleProvider locale="de-DE">
  <DatePicker locale="de-DE" … />
</LocaleProvider>
```

Pass a locale explicitly in a server-rendered app. Without it, React Aria falls
back to `navigator.language` on the client and `en-US` on the server, which is
both a locale surprise and a hydration mismatch waiting to happen. Every LUC
date component accepts `locale` and wraps itself in a `LocaleProvider`, so one
prop is enough.

## 5. The components

| Component | Value | Use it for |
| --- | --- | --- |
| `Calendar` | `CalendarDate \| null` | An inline month grid (scheduling, a panel). |
| `RangeCalendar` | `{ start, end } \| null` | An inline range, 1 or 2 months. |
| `DateField` | `CalendarDate`/`CalendarDateTime` | A dense filter bar with no popover. |
| `DatePicker` | `CalendarDate \| null` | One date, typed or picked. |
| `DateRangePicker` | `{ start, end } \| null` | A period, with optional presets. |
| `MonthPicker` | `CalendarDate \| null` | A reporting or billing month. |
| `YearPicker` | `CalendarDate \| null` | A year, paged by decade. |
| `TimePicker` | `Time \| null` | A wall clock, with `minuteStep`. |
| `DateTimePicker` | `CalendarDateTime \| null` | A local date and time. |
| `ZonedDateTimePicker` | `ZonedDateTime \| null` | A date and time in a named zone. |
| `LocaleProvider` | — | Sets the locale for everything underneath. |

Every one of them:

- takes `locale`, `disabled`, `readOnly`, `required`, `invalid`, `minValue`,
  `maxValue`, `isDateUnavailable` where it makes sense;
- wires itself to the surrounding `Field` (label, description, error, busy);
- is keyboard complete — segments are spinbuttons, the grid has roving focus,
  `PageUp`/`PageDown`/`Home`/`End` work, `Escape` closes the popover;
- respects `prefers-reduced-motion`.

### Range presets

Presets are consumer data, never built-in business logic:

```tsx
const presets: DateRangePreset[] = [
  { id: "7d", label: "Last 7 days", range: ({ today }) => ({ start: today.subtract({ days: 6 }), end: today }) },
  { id: "q3", label: "Q3 2026", range: { start: new CalendarDate(2026, 7, 1), end: new CalendarDate(2026, 9, 30) } },
];

<DateRangePicker presets={presets} todayValue={TODAY} … />
```

The active preset is *derived* from the value — never a second piece of state
that can drift. `todayValue` injects the day the factories see, which is how the
Showcase and the tests stay deterministic.

## 6. Formatting

All formatting lives in `@luc/ui`'s `datetime/format.ts`. Do not call
`toLocaleDateString` in a page.

| Helper | Output |
| --- | --- |
| `formatDateOnly(date, { locale, style, showYear })` | `Sep 27, 2026`, `27/09/2026`, `27. September` |
| `formatDateRange(range, { locale })` | `Sep 27 – Oct 3, 2026` |
| `formatMonthYear(date)` | `September 2026` |
| `formatMonthName(date)` | `September` |
| `formatMonthSpan(start, end)` | `September – October 2026` |
| `formatTimeValue(time, { locale, hourCycle, granularity })` | `14:05`, `02:05 PM` |
| `formatDateTimeValue(value, options)` | `Sep 27, 2026, 14:05` |

Two implementation notes that are load-bearing:

1. A `CalendarDate` is formatted by anchoring it at **UTC noon** and giving the
   formatter `timeZone: "UTC"`, so the day cannot move.
2. Range and span helpers build their string from two single-value formats rather
   than `Intl.DateTimeFormat.formatRange`. Node's ICU and the browser's produce
   different separators for ranges (a thin space versus a regular one), which
   turns every server-rendered range into a hydration mismatch.

## 7. Server rendering and hydration

- Pass `locale` explicitly (see §4).
- Inject `todayValue` in demos and tests: a screenshot should not change at
  midnight.
- Do not render a live clock during SSR. The server's "now" and the browser's are
  different instants by definition; read a clock in an effect, or render a fixed
  example.
- A date-only value is safe to render on the server: it has no zone to disagree
  about.

## 8. Testing dates

The V0.4 suite covers the cases that actually break:

- round-tripping `YYYY-MM-DD` without a `Date` in the path;
- rejecting `2026-2-3`, `27/09/2026` and `2026-02-30`;
- leap days (`2028-02-29` valid, `2027-02-29` not);
- adding days across a DST boundary (2026-03-29 in Europe/Berlin) and across
  month/year ends;
- converting one instant to two different zones and getting two different dates,
  on purpose;
- range selection including a same-day range, a cross-month range, a disabled
  day inside the range, and min/max;
- locale-dependent segment order (en-US vs en-GB) and 12/24-hour clocks.

## 9. Common mistakes

| Mistake | What happens | Do instead |
| --- | --- | --- |
| `new Date("2026-09-27")` | UTC midnight → the previous day west of Greenwich | `parseDateOnly` |
| Storing a date as epoch ms | Every render depends on the viewer's zone | Store `YYYY-MM-DD` or a `CalendarDate` |
| A time field with a hidden zone | "09:30" means something different tomorrow | Use `ZonedDateTimePicker` when a zone matters |
| Adding 24 hours to "add a day" | Wrong on a DST change | `addDays`, which uses calendar arithmetic |
| Formatting inline with `toLocaleDateString` | Inconsistent output and no tests | `formatDateOnly` and friends |
| Rendering "now" during SSR | Hydration mismatch | Inject the value, or read it in an effect |
| Hard-coding `MM/DD/YYYY` | Wrong for most of the world | Let the locale decide; it is free |
| Assuming `Intl.formatRange` is stable | Different whitespace on the server | Use the LUC range helpers |
