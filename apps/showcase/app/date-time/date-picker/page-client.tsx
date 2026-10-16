"use client";

import { useState, type ReactNode } from "react";
import {
  CalendarDate,
  CalendarDateTime,
  DateField,
  DatePicker,
  DateTimePicker,
  Field,
  FieldGroup,
  Text,
  ZonedDateTimePicker,
  formatDateOnly,
  formatDateTimeValue,
  isWeekend,
  parseZonedDateTime,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ImportLine } from "@/components/docs/family-imports";
import { CodeBlock } from "@/components/docs/code-block";
import { Example } from "@/components/docs/example";
import { GuidanceCards } from "@/components/docs/guidance";
import { StateGrid } from "@/components/docs/state-grid";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { DEMO_TODAY } from "@/lib/form-data";
import { useI18n } from "@/lib/i18n/provider";

const QUARTER_END = new CalendarDate(2026, 9, 30);

/*
 * The DatePicker page, in the canonical Components V2 shape.
 *
 * This route documents four components — `DateField`, `DatePicker`,
 * `DateTimePicker` and `ZonedDateTimePicker` — because they are one module and
 * one idea: a segmented field whose value type is the contract.
 * `DateTimePicker` and `MonthPicker`/`YearPicker` are registry rows with
 * `referenceOnly: true` pointing here, so nothing is documented twice and
 * nothing is missing.
 *
 * What changed in this revision: the two loose `Section` blocks (a states grid
 * and a page rule) became, respectively, an example like every other capability
 * and two Guidelines rows — the rule belongs in the advice, not in a section of
 * its own that only this page had. Usage and Guidelines are new, and the
 * `ImportLine` moved from the top of the page into Usage, where a reader looks
 * for it.
 */
export function DatePickerPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES["date-picker"];
  const [date, setDate] = useState<CalendarDate | null>(new CalendarDate(2026, 9, 18));
  const [local, setLocal] = useState<CalendarDateTime | null>(new CalendarDateTime(2026, 9, 18, 9, 30));
  const [zoned, setZoned] = useState(parseZonedDateTime("2026-09-18T09:30[Europe/Berlin]"));

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Date & time")}
        title="Date picker"
        lead="A segmented field with a calendar attached. Every segment is a labelled spinbutton, so the whole value is editable from the keyboard — and there is no ambiguous “2/3/4” to parse, because the order comes from the locale."
      />

      {/* ------------------------------------------------------------ examples */}
      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

        <Example
          title={tcs("Single date")}
          code={`<DatePicker value={date} onValueChange={setDate} todayValue={DEMO_TODAY} locale="en-US" />

<DatePicker
  locale="en-US"
  minValue={new CalendarDate(2026, 7, 1)}
  maxValue={new CalendarDate(2026, 9, 30)}
  value={quarterEnd}
  onValueChange={setQuarterEnd}
/>`}
          description={tcs(
            "`onValueChange` reports a CalendarDate or null. The footer actions are per instance: a filter bar wants Today, a record form usually does not.",
          )}
          layout="block"
        >
          <FieldGroup columns={2}>
            <Field
              label={tcs("Review date")}
              description={tcs("Required, and typeable in the segments or pickable from the calendar.")}
              required
            >
              <DatePicker value={date} onValueChange={setDate} todayValue={DEMO_TODAY} locale="en-US" />
            </Field>
            <Field
              label={tcs("Quarter end")}
              description={tcs("Bound to the quarter; anything after 30 September is unreachable.")}
            >
              <DatePicker
                locale="en-US"
                minValue={new CalendarDate(2026, 7, 1)}
                maxValue={QUARTER_END}
                defaultValue={new CalendarDate(2026, 8, 14)}
                todayValue={DEMO_TODAY}
              />
            </Field>
          </FieldGroup>
          <Text variant="caption" tone="muted">
            canonical value: <code className="text-fg-secondary">{date ? date.toString() : "—"}</code> · displayed as{" "}
            {date ? formatDateOnly(date, { locale: "en-US" }) : "—"}
          </Text>
        </Example>

        <Example
          title={tcs("Dates you cannot book")}
          code={`<DatePicker
  locale="en-US"
  todayValue={DEMO_TODAY}
  defaultValue={new CalendarDate(2026, 9, 18)}
  isDateUnavailable={(value) => isWeekend(value, "en-US") || (value.day >= 21 && value.day <= 24)}
/>`}
          description={tcs(
            "`isDateUnavailable` keeps a day in the grid — focusable and announced — but refuses to select it. A quiet, honest refusal beats a date that silently disappears.",
          )}
          layout="block"
        >
          <Field label={tcs("Settlement")} description={tcs("Weekends and 21–24 September are unavailable.")}>
            <DatePicker
              locale="en-US"
              todayValue={DEMO_TODAY}
              defaultValue={new CalendarDate(2026, 9, 18)}
              isDateUnavailable={(value) => isWeekend(value, "en-US") || (value.day >= 21 && value.day <= 24)}
            />
          </Field>
        </Example>

        <Example
          title={tcs("Local date and time")}
          code={`<DateTimePicker
  locale="en-US"
  hourCycle={24}
  value={local}
  onValueChange={setLocal}
  todayValue={DEMO_TODAY}
/>`}
          description={tcs(
            "`DateTimePicker` edits a CalendarDateTime: a wall clock with no zone. Two people in different zones see the same 09:30, which is what a market session or a meeting time actually means.",
          )}
          layout="block"
        >
          <FieldGroup columns={2}>
            <Field label={tcs("Session start")} description={tcs("Local wall clock, no zone attached.")}>
              <DateTimePicker
                locale="en-US"
                hourCycle={24}
                value={local}
                onValueChange={setLocal}
                todayValue={DEMO_TODAY}
              />
            </Field>
            <Field
              label={tcs("With seconds")}
              description={tcs("The field gains a seconds segment, so the value is exact to the second.")}
            >
              <DateTimePicker
                locale="en-US"
                hourCycle={24}
                granularity="second"
                defaultValue={new CalendarDateTime(2026, 9, 18, 9, 30, 15)}
                todayValue={DEMO_TODAY}
              />
            </Field>
          </FieldGroup>
          <Text variant="caption" tone="muted">
            canonical value:{" "}
            <code className="text-fg-secondary">{local ? formatDateTimeValue(local, { locale: "en-US" }) : "—"}</code>
          </Text>
        </Example>

        <Example
          title={tcs("Zoned date and time")}
          code={`<ZonedDateTimePicker
  locale="en-US"
  hourCycle={24}
  value={zoned}
  onValueChange={setZoned}
  todayValue={DEMO_TODAY}
/>`}
          description={tcs(
            "A ZonedDateTime carries its own identifier. The component never converts it, never guesses a zone and never drops the offset — “09:30 Berlin” stays 09:30 Berlin.",
          )}
          layout="block"
        >
          <FieldGroup columns={2}>
            <Field
              label={tcs("Market open")}
              description={tcs("Europe/Berlin; DST is the zone's business, not the field's.")}
            >
              <ZonedDateTimePicker
                locale="en-US"
                hourCycle={24}
                value={zoned}
                onValueChange={(next) => next && setZoned(next)}
                todayValue={DEMO_TODAY}
              />
            </Field>
            <Field
              label={tcs("Same clock, Tokyo")}
              description={tcs("A different zone is a different value, on purpose.")}
            >
              <ZonedDateTimePicker
                locale="en-US"
                hourCycle={24}
                defaultValue={parseZonedDateTime("2026-09-18T09:30[Asia/Tokyo]")}
              />
            </Field>
          </FieldGroup>
          <Text variant="caption" tone="muted">
            serialised: <code className="text-fg-secondary">{zoned.toString()}</code> · absolute:{" "}
            <code className="text-fg-secondary">{zoned.toAbsoluteString()}</code>
          </Text>
        </Example>

        <Example
          title={tcs("A field with no calendar")}
          code={`<FieldGroup columns={3}>
  <Field label="From">
    <DateField locale="en-GB" defaultValue={new CalendarDate(2026, 9, 1)} />
  </Field>
  <Field label="To">
    <DateField locale="en-GB" defaultValue={new CalendarDate(2026, 9, 26)} />
  </Field>
  <Field label="Locale order" description="The same value, US ordering.">
    <DateField locale="en-US" defaultValue={new CalendarDate(2026, 9, 26)} />
  </Field>
</FieldGroup>`}
          description={tcs(
            "`DateField` is the same segmented control without the popover — for a dense filter bar where a month grid would be too much surface.",
          )}
          layout="block"
        >
          <FieldGroup columns={3}>
            <Field label={tcs("From")}>
              <DateField locale="en-GB" defaultValue={new CalendarDate(2026, 9, 1)} />
            </Field>
            <Field label={tcs("To")}>
              <DateField locale="en-GB" defaultValue={new CalendarDate(2026, 9, 26)} />
            </Field>
            <Field label={tcs("Locale order")} description={tcs("The same value, US ordering.")}>
              <DateField locale="en-US" defaultValue={new CalendarDate(2026, 9, 26)} />
            </Field>
          </FieldGroup>
        </Example>

        <Example
          title={tcs("States")}
          code={`<DatePicker aria-label="Empty date" locale="en-US" />
<DatePicker aria-label="Filled date" locale="en-US" defaultValue={new CalendarDate(2026, 9, 18)} />
<Field label="Settlement" error="That date is a holiday">
  <DatePicker locale="en-US" defaultValue={new CalendarDate(2026, 9, 18)} />
</Field>
<DatePicker aria-label="Disabled" locale="en-US" disabled />
<DatePicker aria-label="Read-only" locale="en-US" readOnly defaultValue={new CalendarDate(2026, 9, 18)} />
<DatePicker aria-label="Small date" locale="en-US" size="sm" defaultValue={new CalendarDate(2026, 9, 18)} />`}
          description={tcs(
            "One shell, five states plus the size scale — the same shell every other control in the library uses, so a date field never looks like a different product.",
          )}
          layout="stage"
        >
          <StateGrid
            columns={3}
            states={[
              {
                label: tcs("Empty"),
                render: <DatePicker aria-label="Empty date" locale="en-US" className="w-full" />,
              },
              {
                label: tcs("Filled"),
                render: (
                  <DatePicker
                    aria-label="Filled date"
                    locale="en-US"
                    defaultValue={new CalendarDate(2026, 9, 18)}
                    className="w-full"
                  />
                ),
              },
              {
                label: tcs("Invalid"),
                render: (
                  <Field label={tcs("Settlement")} error={tcs("That date is a holiday")}>
                    <DatePicker locale="en-US" defaultValue={new CalendarDate(2026, 9, 18)} />
                  </Field>
                ),
              },
              {
                label: tcs("Disabled"),
                render: <DatePicker aria-label="Disabled" locale="en-US" disabled className="w-full" />,
              },
              {
                label: tcs("Read-only"),
                render: (
                  <DatePicker
                    aria-label="Read-only"
                    locale="en-US"
                    readOnly
                    defaultValue={new CalendarDate(2026, 9, 18)}
                    className="w-full"
                  />
                ),
              },
              {
                label: tcs("Small"),
                render: (
                  <DatePicker
                    aria-label="Small date"
                    locale="en-US"
                    size="sm"
                    defaultValue={new CalendarDate(2026, 9, 18)}
                    className="w-full"
                  />
                ),
              },
            ]}
          />
        </Example>
      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <h2 id="usage" className="text-title text-fg-primary">
          {tcs("Usage")}
        </h2>
        <ImportLine line={'import { DateField, DatePicker, DateTimePicker } from "@luc/ui";'} />
        <CodeBlock
          code={`<DatePicker aria-label="Settlement" value={date} onValueChange={setDate} />`}
          label={tcs("Copy the minimal call")}
        />
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "Choose the component by the value it stores, not by how it looks: `DateField` and `DatePicker` edit a `CalendarDate`, `DateTimePicker` a `CalendarDateTime`, `ZonedDateTimePicker` a `ZonedDateTime`. Nothing is converted for you, because converting an instant into a date is a decision the product has to make.",
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

      <EntryFooter entryId="date-picker" related={["calendar", "time-picker"]} />
    </DocPage>
  );
}
