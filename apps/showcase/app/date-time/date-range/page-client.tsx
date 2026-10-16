"use client";

import { useState, type ReactNode } from "react";
import {
  Button,
  CalendarDate,
  Card,
  DateRangePicker,
  Field,
  FieldGroup,
  Text,
  type DateRange,
  type DateRangePreset,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ImportLine } from "@/components/docs/family-imports";
import { CodeBlock } from "@/components/docs/code-block";
import { Example } from "@/components/docs/example";
import { GuidanceCards } from "@/components/docs/guidance";
import { StateGrid } from "@/components/docs/state-grid";
import { DEMO_RANGE, DEMO_TODAY, MONTH_PRESETS, RANGE_PRESETS } from "@/lib/form-data";
import { useI18n } from "@/lib/i18n/provider";

/*
 * The DateRange page, in the canonical Components V2 shape.
 *
 * This route is not a registry entry — `DateRangePicker` is a second component
 * from the `date-picker` module — so it follows the composition-page
 * convention: the same sections in the same order, `EntryApiSection` pointed at
 * the module its props are compiled from rather than a page-local props table,
 * and `EntryFooter` without an id (the footer resolves the entry from the URL's
 * own registry row, and this page has none, so it renders nothing rather than
 * guessing).
 *
 * The two loose pieces this revision folded in: the "Sizes and states" `Section`
 * is now an example like every other capability, and the guidance that used to
 * be implied by the prose — presets are yours, not the component's — is stated
 * once in Guidelines.
 */
export function DateRangePage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const [range, setRange] = useState<DateRange | null>(DEMO_RANGE);
  const [invoiced, setInvoiced] = useState<DateRange | null>(null);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Date & time")}
        title="Date range"
        lead="Two dates, inclusive at both ends, with consumer-defined presets beside the calendar. LUC hard-codes no business windows: “last 7 days” is a preset you pass in, not a feature of the component."
      />

      {/* ------------------------------------------------------------ examples */}
      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

        <Example
          title={tcs("Presets and a calendar")}
          code={`<Field label="Reporting period" description="Choose a preset, type the dates, or pick a range in the calendar.">
  <DateRangePicker
    value={range}
    onValueChange={setRange}
    todayValue={DEMO_TODAY}
    presets={RANGE_PRESETS}
    locale="en-US"
    months={2}
  />
</Field>`}
          description={tcs(
            "Presets are a typed list of label plus value (or a factory that receives today). The active preset is derived from the value — never a second piece of state that can drift.",
          )}
          layout="block"
        >
          <FieldGroup columns={1}>
            <Field
              label={tcs("Reporting period")}
              description={tcs("Choose a preset, type the dates, or pick a range in the calendar.")}
            >
              <DateRangePicker
                value={range}
                onValueChange={setRange}
                todayValue={DEMO_TODAY}
                presets={RANGE_PRESETS}
                locale="en-US"
                months={2}
              />
            </Field>
          </FieldGroup>
          <Text variant="caption" tone="muted">
            value:{" "}
            <code className="text-fg-secondary">
              {range ? `${range.start.toString()} → ${range.end.toString()}` : "null"}
            </code>
          </Text>
        </Example>

        <Example
          title={tcs("A range for a record, not a filter")}
          code={`<DateRangePicker
  value={invoiced}
  onValueChange={setInvoiced}
  todayValue={DEMO_TODAY}
  months={1}
  showTodayAction={false}
  locale="en-US"
/>`}
          description={tcs(
            "No presets, no Today action, one visible month. A booking or a reporting period is a decision, not a browsing aid.",
          )}
          layout="block"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label={tcs("Invoicing period")}
              description={tcs("Billing runs on the first working day after the end date.")}
            >
              <DateRangePicker
                value={invoiced}
                onValueChange={setInvoiced}
                todayValue={DEMO_TODAY}
                months={1}
                showTodayAction={false}
                locale="en-US"
              />
            </Field>
            <Field
              label={tcs("Blocked window")}
              description={tcs("A same-day range is allowed; 21–24 September is not.")}
            >
              <DateRangePicker
                presets={MONTH_PRESETS.slice(0, 2)}
                months={1}
                locale="en-US"
                defaultValue={{ start: new CalendarDate(2026, 9, 1), end: new CalendarDate(2026, 9, 18) }}
                isDateUnavailable={(value) => value.day >= 21 && value.day <= 24}
              />
            </Field>
          </div>
        </Example>

        <Example
          title={tcs("Sizes and states")}
          code={`<DateRangePicker aria-label="Default range" locale="en-US" months={1} defaultValue={DEMO_RANGE} />
<DateRangePicker aria-label="Empty range" locale="en-US" months={1} />
<Field label="Period" error="Overlaps the locked audit window">
  <DateRangePicker locale="en-US" months={1} defaultValue={DEMO_RANGE} />
</Field>
<DateRangePicker aria-label="Disabled range" locale="en-US" months={1} disabled defaultValue={DEMO_RANGE} />
<DateRangePicker aria-label="Small range" locale="en-US" months={1} size="sm" defaultValue={DEMO_RANGE} />`}
          description={tcs(
            "The same shell as every other control: hover steps one border, focus draws the ring, invalid is negative without a red banner.",
          )}
          layout="stage"
        >
          {/*
           * Two columns, not three.
           *
           * A range field holds two complete dates and the dash between them, so
           * it has a real minimum width — roughly `mm/dd/yyyy – mm/dd/yyyy`. In a
           * three-across specimen grid each field was ~290 px wide, which is
           * narrower than its own content, and the year segment was clipped by
           * the field's overflow. That is a visibly wrong date, and it also made
           * the year a partially obscured touch target. The grid gives way.
           */}
          <StateGrid
            columns={2}
            states={[
              {
                label: tcs("Default"),
                render: (
                  <DateRangePicker
                    aria-label="Default range"
                    locale="en-US"
                    months={1}
                    defaultValue={DEMO_RANGE}
                    className="w-full"
                  />
                ),
              },
              {
                label: tcs("Empty"),
                render: (
                  <DateRangePicker aria-label="Empty range" locale="en-US" months={1} className="w-full" />
                ),
              },
              {
                label: tcs("Invalid"),
                render: (
                  <Field label={tcs("Period")} error={tcs("Overlaps the locked audit window")}>
                    <DateRangePicker locale="en-US" months={1} defaultValue={DEMO_RANGE} />
                  </Field>
                ),
              },
              {
                label: tcs("Disabled"),
                render: (
                  <DateRangePicker
                    aria-label="Disabled range"
                    locale="en-US"
                    months={1}
                    disabled
                    defaultValue={DEMO_RANGE}
                    className="w-full"
                  />
                ),
              },
              {
                label: tcs("Small"),
                render: (
                  <DateRangePicker
                    aria-label="Small range"
                    locale="en-US"
                    months={1}
                    size="sm"
                    defaultValue={DEMO_RANGE}
                    className="w-full"
                  />
                ),
              },
              {
                label: tcs("One month"),
                note: tcs("the mobile layout"),
                render: (
                  <DateRangePicker
                    aria-label="One month range"
                    locale="en-US"
                    months={1}
                    defaultValue={DEMO_RANGE}
                    className="w-full"
                  />
                ),
              },
            ]}
          />
        </Example>

        <Example
          title={tcs("Any preset shape, no business logic")}
          code={`const presets = [
  { id: "trailing", label: "Trailing 90 days", range: ({ today }) => ({ start: today.subtract({ days: 89 }), end: today }) },
];

<DateRangePicker value={range} onValueChange={setRange} presets={presets} todayValue={DEMO_TODAY} />`}
          description={tcs(
            "A preset can be a fixed range or a factory. This one shows what a consumer-owned “rolling” window looks like — the calculation lives in the page, not in the component.",
          )}
          layout="block"
        >
          <Card className="flex flex-col gap-3 p-5 md:flex-row md:items-end">
            <RollingRange />
          </Card>
        </Example>
      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <h2 id="usage" className="text-title text-fg-primary">
          {tcs("Usage")}
        </h2>
        <ImportLine line={'import { DateRangePicker } from "@luc/ui";'} />
        <CodeBlock
          code={`<DateRangePicker
  aria-label="Reporting period"
  value={range}
  onValueChange={setRange}
  todayValue={today}
  months={2}
/>`}
          label={tcs("Copy the minimal call")}
        />
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "`value` is `{ start, end }` with both ends inclusive, or `null` when either end is missing. Pass `todayValue` so a screenshot, a test or a server render does not change meaning at midnight.",
          )}
        </Text>
      </section>

      {apiSection}

      {/* ---------------------------------------------------------- guidelines */}
      <section className="flex flex-col gap-4">
        <h2 id="guidelines" className="text-title text-fg-primary">
          {tcs("Guidelines")}
        </h2>
        <GuidanceCards
          tcs={tcs}
          use={[
            tcs("Pass the business windows in as `presets`. A range component that knew what “quarter to date” meant would have to know what a quarter is, which is the consumer's domain."),
            tcs("Read the selected range from `value` rather than mirroring it in a second state — an active preset is derived from the range, and two copies of the same fact drift."),
            tcs("Use `DateRangePicker` when the two ends belong to one decision (a reporting period, a booking); use two `DatePicker`s when they are independent fields."),
          ]}
          avoid={[
            tcs("Sending a range to a query as two instants. `09-01 → 09-18` is a pair of dates; whether the end day includes its last second is a query decision, and `.endOf(\"day\")` belongs at the boundary, not in the control."),
            tcs("Showing a range picker where a single date is what the user is choosing — two calendars for one decision is four times the surface and the same answer."),
          ]}
        />
        <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "Accessibility: the two ends are one field group with a labelled start and end segment, so a keyboard user moves through six segments in reading order and a screen reader announces which end is focused; `isDateUnavailable` keeps blocked days focusable and announced rather than removing them from the grid.",
          )}
        </Text>
      </section>

      <EntryFooter />
    </DocPage>
  );
}

/** A consumer-owned rolling window, expressed as a preset factory. */
function RollingRange() {
  const { tcs } = useI18n();
  const [value, setValue] = useState<DateRange | null>(null);
  const presets: DateRangePreset[] = [
    {
      id: "trailing-quarter",
      label: "Trailing 90 days",
      range: ({ today }) => ({ start: today.subtract({ days: 89 }), end: today }),
    },
    {
      id: "previous-quarter",
      label: "Previous calendar quarter",
      range: ({ today }) => {
        const quarter = Math.floor((today.month - 1) / 3);
        const startMonth = quarter === 0 ? 10 : quarter * 3 - 2;
        const startYear = quarter === 0 ? today.year - 1 : today.year;
        const start = new CalendarDate(startYear, startMonth, 1);
        return { start, end: start.add({ months: 3 }).subtract({ days: 1 }) };
      },
    },
  ];

  return (
    <>
      <Field
        label={tcs("Window")}
        className="min-w-0 flex-1"
        description={tcs("Both presets are computed in the page from the injected today.")}
      >
        <DateRangePicker
          value={value}
          onValueChange={setValue}
          presets={presets}
          todayValue={DEMO_TODAY}
          months={1}
          locale="en-US"
        />
      </Field>
      <Button variant="ghost" onClick={() => setValue(null)} disabled={!value}>
        {tcs("Clear")}
      </Button>
    </>
  );
}
