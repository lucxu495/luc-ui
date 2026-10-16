"use client";

import { useState, type ReactNode } from "react";
import {
  Calendar,
  CalendarActionButton,
  CalendarDate,
  CalendarFooter,
  Card,
  Field,
  LocaleProvider,
  MonthPicker,
  RangeCalendar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  YearPicker,
  formatDateOnly,
  formatDateRange,
  formatMonthYear,
  type DateRange,
  type DateValue,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ImportLine } from "@/components/docs/family-imports";
import { CodeBlock } from "@/components/docs/code-block";
import { Example } from "@/components/docs/example";
import { GuidanceCards } from "@/components/docs/guidance";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { DEMO_TODAY } from "@/lib/form-data";
import { useI18n } from "@/lib/i18n/provider";

/** A fixed block of unavailable days, so the demo is stable. */
const BLACKOUT_START = new CalendarDate(2026, 9, 21);
const BLACKOUT_END = new CalendarDate(2026, 9, 24);
const isBlackout = (date: DateValue) =>
  date.compare(BLACKOUT_START) >= 0 && date.compare(BLACKOUT_END) <= 0;

/*
 * The Calendar page, in the canonical Components V2 shape
 * (`docs/COMPONENTS_V2.md` §5): title → one sentence → Examples → Usage → API →
 * Guidelines → related navigation. The Date & Time family had the examples but
 * not the frame around them — no `Examples` heading, no Usage section, no
 * Guidelines — so a reader arriving from search met a column of specimens with
 * no "here is how you write one" and no statement of when this control is the
 * right one rather than `DatePicker`.
 */
export function CalendarPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES.calendar;
  const [date, setDate] = useState<CalendarDate | null>(new CalendarDate(2026, 9, 18));
  const [range, setRange] = useState<DateRange | null>({
    start: new CalendarDate(2026, 9, 8),
    end: new CalendarDate(2026, 9, 18),
  });
  const [locale, setLocale] = useState("en-US");
  const [month, setMonth] = useState<CalendarDate | null>(new CalendarDate(2026, 5, 1));
  const [year, setYear] = useState<CalendarDate | null>(new CalendarDate(2024, 1, 1));

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Date & time")}
        title="Calendar"
        lead="A date grid is deceptively hard: keyword navigation, locale week starts, unavailable days that stay focusable, and year jumps that do not require 120 clicks. React Aria owns the grid semantics; LUC owns every pixel of it."
      />

      {/* ------------------------------------------------------------ examples */}
      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

        <Example
          title={tcs("Single date")}
          code={`<Calendar
  aria-label="Review date"
  locale={locale}
  value={date}
  onValueChange={setDate}
  footer={
    <CalendarFooter>
      <Text variant="caption" tone="muted">{formatDateOnly(date, { locale })}</Text>
      <CalendarActionButton onClick={() => setDate(DEMO_TODAY)}>Today</CalendarActionButton>
    </CalendarFooter>
  }
/>`}
          description={tcs(
            "Values are `CalendarDate` — a calendar date with no clock and no time zone, so 2026-09-18 is that day everywhere.",
          )}
          layout="block"
        >
          <div className="flex flex-wrap items-start gap-6">
            <Calendar
              aria-label="Review date"
              locale={locale}
              value={date}
              onValueChange={setDate}
              footer={
                <CalendarFooter>
                  <Text variant="caption" tone="muted">
                    {date ? formatDateOnly(date, { locale }) : "No date selected"}
                  </Text>
                  <div className="flex items-center gap-2">
                    <CalendarActionButton onClick={() => setDate(DEMO_TODAY)}>Today</CalendarActionButton>
                    <CalendarActionButton onClick={() => setDate(null)}>Clear</CalendarActionButton>
                  </div>
                </CalendarFooter>
              }
            />
            <Card className="flex max-w-sm flex-col gap-3 p-5">
              <Field
                label={tcs("Locale")}
                description={tcs("Week starts, weekday names and month names follow it.")}
              >
                <Select value={locale} onValueChange={setLocale}>
                  <SelectTrigger aria-label="Locale">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">{tcs("English (US) — Sunday first")}</SelectItem>
                    <SelectItem value="en-GB">{tcs("English (UK) — Monday first")}</SelectItem>
                    <SelectItem value="de-DE">{tcs("Deutsch — Montag zuerst")}</SelectItem>
                    <SelectItem value="ja-JP">日本語</SelectItem>
                    <SelectItem value="ar-EG">{tcs("العربية (RTL, Arabic-Indic digits)")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Text variant="caption" tone="muted">
                {tcs(
                  "The heading, weekday row, segment order and numerals all come from the locale — nothing about the month grid is hard-coded to Sunday-start or to Latin digits.",
                )}
              </Text>
            </Card>
          </div>
        </Example>

        <Example
          title={tcs("Date range")}
          code={`<RangeCalendar aria-label="Review period" locale={locale} value={range} onValueChange={setRange} />
<RangeCalendar aria-label="Wide review period" locale={locale} months={2} value={range} onValueChange={setRange} />`}
          description={tcs(
            "One month on narrow screens, two on desktop. Both ends are inclusive, and the band is a continuous span rather than a row of pills.",
          )}
          layout="block"
        >
          <div className="flex flex-wrap items-start gap-6">
            <RangeCalendar
              aria-label="Review period"
              locale={locale}
              months={1}
              value={range}
              onValueChange={setRange}
            />
            <RangeCalendar
              aria-label={tcs("Wide review period")}
              locale={locale}
              months={2}
              value={range}
              onValueChange={setRange}
              className="hidden md:flex"
            />
          </div>
          <Text variant="caption" tone="muted">
            {range ? formatDateRange(range, { locale }) : "No range selected"}
          </Text>
        </Example>

        <Example
          title={tcs("Unavailable dates")}
          /* Two months side by side are 472px wide — wider than a phone. The stage
           * scrolls them rather than letting the page grow, the same way the code
           * block below scrolls rather than wrapping. */
          stageClassName="overflow-x-auto"
          code={`<RangeCalendar
  aria-label="Period with a blackout"
  locale="en-US"
  months={2}
  value={range}
  onValueChange={setRange}
  isDateUnavailable={isBlackout}
  footer={<CalendarFooter>21–24 September is a blackout window.</CalendarFooter>}
/>`}
          description={tcs(
            "A blocked day stays focusable and stays readable — it is struck through and underlined by a diagonal line, not just dimmed. Selection skips it rather than trapping the user.",
          )}
          layout="block"
        >
          <RangeCalendar
            aria-label={tcs("Period with a blackout")}
            locale="en-US"
            months={2}
            value={range}
            onValueChange={setRange}
            isDateUnavailable={isBlackout}
            footer={
              <CalendarFooter>
                <Text variant="caption" tone="muted">
                  {tcs("21–24 September is a blackout window in this demo.")}
                </Text>
              </CalendarFooter>
            }
          />
        </Example>

        <Example
          title={tcs("Month and year selection")}
          code={`<MonthPicker aria-label="Reporting month" locale={locale} value={month} onValueChange={setMonth} maxValue={DEMO_TODAY} />
<YearPicker aria-label="Reporting year" locale={locale} value={year} onValueChange={setYear} />`}
          description={tcs(
            "Both are ARIA grids with roving focus: arrow keys move, Home/End jump within a row, Enter selects. Years page by decade, so 1998 is four clicks away from 2026.",
          )}
          layout="block"
        >
          <div className="flex flex-wrap items-start gap-6">
            <div className="flex flex-col gap-2">
              <Text variant="caption" tone="muted">
                MonthPicker
              </Text>
              <Card className="p-3">
                <MonthPicker
                  aria-label="Reporting month"
                  locale={locale}
                  value={month}
                  onValueChange={setMonth}
                  maxValue={DEMO_TODAY}
                />
              </Card>
            </div>
            <div className="flex flex-col gap-2">
              <Text variant="caption" tone="muted">
                YearPicker
              </Text>
              <Card className="p-3">
                <YearPicker
                  aria-label="Reporting year"
                  locale={locale}
                  value={year}
                  onValueChange={setYear}
                  minValue={new CalendarDate(2018, 1, 1)}
                  maxValue={new CalendarDate(2026, 12, 31)}
                />
              </Card>
            </div>
            <Card className="flex max-w-sm flex-col gap-2 p-5">
              <Text variant="label">{tcs("Selected month and year")}</Text>
              <Text variant="body" tone="secondary">
                month: <code className="text-fg-primary">{month ? formatMonthYear(month, { locale }) : "—"}</code>
                <br />
                year: <code className="text-fg-primary">{year ? year.year : "—"}</code>
              </Text>
              <Text variant="caption" tone="muted">
                {tcs(
                  "The same two components power the calendar header's month/year jump — the component you use is the component the header uses.",
                )}
              </Text>
            </Card>
          </div>
        </Example>

        <Example
          title={tcs("Inside a locale provider")}
          code={`<LocaleProvider locale="de-DE">
  <Calendar aria-label="Kalender" value={date} onValueChange={setDate} />
</LocaleProvider>`}
          description={tcs(
            "`LocaleProvider` sets the locale for every date and number control underneath, which is also how a server-rendered app avoids a hydration mismatch: pass the locale explicitly instead of relying on `navigator.language`.",
          )}
          layout="block"
        >
          <LocaleProvider locale="de-DE">
            <div className="flex flex-wrap items-start gap-4">
              <Calendar aria-label="Kalender" value={date} onValueChange={setDate} />
              <Card className="p-4">
                <Text variant="body" tone="secondary">
                  Formatted: {date ? formatDateOnly(date, { locale: "de-DE" }) : "—"}
                </Text>
              </Card>
            </div>
          </LocaleProvider>
        </Example>
      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <h2 id="usage" className="text-title text-fg-primary">
          {tcs("Usage")}
        </h2>
        <ImportLine line={'import { Calendar } from "@luc/ui";'} />
        <CodeBlock
          code={`<Calendar aria-label="Review date" value={date} onValueChange={setDate} />`}
          label={tcs("Copy the minimal call")}
        />
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "The value is a `CalendarDate` and `onValueChange` reports one or `null`. A calendar with no popover of its own is what you want inside a page section; wrap `DatePicker` around the same grid when the field should be a form control.",
          )}
        </Text>
      </section>

      {apiSection}

      {/* ---------------------------------------------------------- guidelines */}
      <section className="flex flex-col gap-4">
        <h2 id="guidelines" className="text-title text-fg-primary">
          {tcs("Guidelines")}
        </h2>
        <GuidanceCards use={notes?.guidance?.use ?? []} avoid={notes?.guidance?.avoid ?? []} tcs={tcs} />
        {notes?.accessibility?.detail ? (
          <div className="flex flex-col gap-1.5">
            <h3 className="text-title text-fg-primary">{tcs("Accessibility")}</h3>
            <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(notes.accessibility.detail)}
            </Text>
          </div>
        ) : null}
      </section>

      <EntryFooter entryId="calendar" related={["date-picker", "time-picker"]} />
    </DocPage>
  );
}
