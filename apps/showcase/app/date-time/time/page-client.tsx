"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import {
  Card,
  Field,
  FieldGroup,
  Text,
  Time,
  TimePicker,
  formatTimeValue,
  getLocalTimeZone,
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
import { useI18n } from "@/lib/i18n/provider";

/**
 * The zone never changes while a page is open, so the store has nothing to
 * subscribe to — this exists only to give `useSyncExternalStore` its shape.
 */
const SUBSCRIBE_TO_NOTHING = () => () => {};

/*
 * The TimePicker page, in the canonical Components V2 shape.
 *
 * `docs/COMPONENTS_V2.md` §5: title → one sentence → Examples → Usage → API →
 * Guidelines → related navigation. The examples, including the hydration-safe
 * "this machine" zone card, are the ones this page already had; what is new is
 * the frame — an `Examples` heading, a Usage section with the minimal call, a
 * Guidelines section that states the one rule this control exists to keep, and
 * the states grid promoted from a loose `Section` to an example like the rest.
 */
export function TimePickerPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES["time-picker"];
  const [time, setTime] = useState<Time | null>(new Time(14, 30));
  const [precise, setPrecise] = useState<Time | null>(new Time(9, 45, 30));
  /*
   * The zone is a fact about the *reader's* machine, so it must not be rendered
   * during server rendering — and `useSyncExternalStore` is the API built for
   * exactly that: the server snapshot is `null`, so the server HTML and the
   * first client render agree, and React re-reads the real value on the client
   * pass.
   *
   * `getLocalTimeZone()` answers from whatever runtime evaluates it: "UTC" on a
   * server, the visitor's city in the browser. Emitting it in the server HTML
   * therefore produced two different texts for the same node, and React caught
   * it as a hydration mismatch (error #418) — reproducibly, whenever the
   * server's zone differs from the reader's, which is the normal case for the
   * review container (TZ=UTC) and for any hosted deployment. Keeping the value
   * out of the server render keeps the sentence true on both sides instead of
   * suppressing the warning.
   */
  const zone = useSyncExternalStore(SUBSCRIBE_TO_NOTHING, getLocalTimeZone, () => null);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Date & time")}
        title="Time"
        lead="A time of day is a wall clock: no date, no time zone. 14:30 is 14:30 wherever it is read — which is why this control has no zone picker and no conversion."
      />

      {/* ------------------------------------------------------------ examples */}
      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

        <Example
          title={tcs("Segmented field, coarse popover")}
          code={`<FieldGroup columns={3}>
  <Field label="Session close" description="24-hour, 15-minute grid.">
    <TimePicker value={time} onValueChange={setTime} hourCycle={24} minuteStep={15} locale="en-US" />
  </Field>
  <Field label="With seconds" description="Second granularity, on a five-second grid.">
    <TimePicker value={precise} onValueChange={setPrecise} hourCycle={24} granularity="second" secondStep={5} />
  </Field>
</FieldGroup>`}
          description={tcs(
            "The segments give exact keyboard editing; the popover gives a stepped grid. Both write the same Time value, and the step only ever constrains the grid — typing 14:07 is still allowed.",
          )}
          layout="block"
        >
          <FieldGroup columns={3}>
            <Field label={tcs("Session close")} description={tcs("24-hour, 15-minute grid.")}>
              <TimePicker
                value={time}
                onValueChange={setTime}
                hourCycle={24}
                minuteStep={15}
                locale="en-US"
              />
            </Field>
            <Field label={tcs("With seconds")} description={tcs('granularity="second", 5-second grid.')}>
              <TimePicker
                value={precise}
                onValueChange={setPrecise}
                hourCycle={24}
                granularity="second"
                secondStep={5}
                locale="en-US"
              />
            </Field>
            <Field
              label={tcs("Locale clock")}
              description={tcs("No hourCycle — the locale decides (this is 12-hour for en-US).")}
            >
              <TimePicker defaultValue={new Time(9, 30)} locale="en-US" />
            </Field>
          </FieldGroup>
          <Text variant="caption" tone="muted">
            canonical values: <code className="text-fg-secondary">{time ? time.toString() : "—"}</code>,{" "}
            <code className="text-fg-secondary">{precise ? precise.toString() : "—"}</code> · rendered as{" "}
            {time ? formatTimeValue(time, { locale: "en-US", hourCycle: 24 }) : "—"}
          </Text>
        </Example>

        <Example
          title={tcs("A bounded window")}
          code={`<Field label="Trading session" description="Opens at 09:30 and closes at 16:00.">
  <TimePicker
    value={time}
    onValueChange={setTime}
    hourCycle={24}
    minuteStep={5}
    minValue={new Time(9, 30)}
    maxValue={new Time(16, 0)}
    locale="en-US"
  />
</Field>`}
          description={tcs(
            "`minValue` and `maxValue` bound the popover and validate the typed segments. They are a constraint on the value, not a substitution for one: the control never nudges an out-of-range entry into range behind the user's back.",
          )}
          layout="block"
        >
          <FieldGroup columns={2}>
            <Field label={tcs("Trading session")} description={tcs("Opens at 09:30 and closes at 16:00.")}>
              <TimePicker
                value={time}
                onValueChange={setTime}
                hourCycle={24}
                minuteStep={5}
                minValue={new Time(9, 30)}
                maxValue={new Time(16, 0)}
                locale="en-US"
              />
            </Field>
            <Field
              label={tcs("Settlement cut-off")}
              description={tcs("The same bound, twelve-hour display.")}
            >
              <TimePicker
                hourCycle={12}
                minValue={new Time(9, 30)}
                maxValue={new Time(16, 0)}
                defaultValue={new Time(11, 0)}
                locale="en-US"
              />
            </Field>
          </FieldGroup>
        </Example>

        <Example
          title={tcs("Clocks are not time zones")}
          code={`// A wall clock: no zone, no DST, no date.
<TimePicker value={time} onValueChange={setTime} hourCycle={24} />

// "14:30 in Berlin" is a zoned value, and a different control.
<ZonedDateTimePicker value={zoned} onValueChange={setZoned} timeZone="Europe/Berlin" />`}
          description={tcs(
            "If a product needs “14:30 in Berlin”, that is a zoned value — `DateTimePicker` or `ZonedDateTimePicker`. A time-only control that silently attached a zone would be lying about what it stores.",
          )}
          layout="block"
        >
          <div className="flex flex-wrap gap-4">
            <Card className="flex min-w-[16rem] flex-1 flex-col gap-2 p-5">
              <Text variant="label">Time (this control)</Text>
              <Text variant="body" tone="secondary">
                {tcs("14:30 — a wall clock. No zone, no DST, no date.")}
              </Text>
            </Card>
            <Card className="flex min-w-[16rem] flex-1 flex-col gap-2 p-5">
              <Text variant="label">ZonedDateTime</Text>
              <Text variant="body" tone="secondary">
                {tcs("2026-09-18T14:30[Europe/Berlin] — an instant with a rule attached.")}
              </Text>
            </Card>
            <Card className="flex min-w-[16rem] flex-1 flex-col gap-2 p-5">
              <Text variant="label">This machine</Text>
              <Text variant="body" tone="secondary">
                {zone === null ? (
                  tcs("The zone is read in the browser once the page is interactive.")
                ) : (
                  <>
                    Local zone <code className="text-fg-primary">{zone}</code>
                    {tcs(". The controls above store wall clocks; they never consult this machine's clock or zone.")}
                  </>
                )}
              </Text>
            </Card>
          </div>
        </Example>

        <Example
          title={tcs("States")}
          code={`<TimePicker aria-label="Empty time" hourCycle={24} locale="en-US" />
<TimePicker aria-label="Filled time" hourCycle={24} locale="en-US" defaultValue={new Time(9, 30)} />
<Field label="Cut-off" error="Cut-off must be before 16:00">
  <TimePicker hourCycle={24} locale="en-US" defaultValue={new Time(18, 0)} />
</Field>
<TimePicker aria-label="Disabled time" hourCycle={24} locale="en-US" disabled />
<TimePicker aria-label="Read-only time" hourCycle={24} locale="en-US" readOnly defaultValue={new Time(9, 30)} />
<TimePicker aria-label="Small time" hourCycle={24} locale="en-US" size="sm" defaultValue={new Time(9, 30)} />`}
          description={tcs(
            "The same shell and the same states as every other control: hover steps one border, focus draws the ring, invalid is negative and points at its message, disabled leaves the tab order.",
          )}
          layout="stage"
        >
          <StateGrid
            columns={3}
            states={[
              {
                label: tcs("Empty"),
                render: <TimePicker aria-label="Empty time" hourCycle={24} locale="en-US" className="w-full" />,
              },
              {
                label: tcs("Filled"),
                render: (
                  <TimePicker
                    aria-label="Filled time"
                    hourCycle={24}
                    locale="en-US"
                    defaultValue={new Time(9, 30)}
                    className="w-full"
                  />
                ),
              },
              {
                label: tcs("Invalid"),
                render: (
                  <Field label={tcs("Cut-off")} error={tcs("Cut-off must be before 16:00")}>
                    <TimePicker hourCycle={24} locale="en-US" defaultValue={new Time(18, 0)} />
                  </Field>
                ),
              },
              {
                label: tcs("Disabled"),
                render: (
                  <TimePicker aria-label="Disabled time" hourCycle={24} locale="en-US" disabled className="w-full" />
                ),
              },
              {
                label: tcs("Read-only"),
                render: (
                  <TimePicker
                    aria-label="Read-only time"
                    hourCycle={24}
                    locale="en-US"
                    readOnly
                    defaultValue={new Time(9, 30)}
                    className="w-full"
                  />
                ),
              },
              {
                label: tcs("Small"),
                render: (
                  <TimePicker
                    aria-label="Small time"
                    hourCycle={24}
                    locale="en-US"
                    size="sm"
                    defaultValue={new Time(9, 30)}
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
        <ImportLine line={'import { Time, TimePicker } from "@luc/ui";'} />
        <CodeBlock
          code={`<TimePicker aria-label="Session close" value={time} onValueChange={setTime} hourCycle={24} />`}
          label={tcs("Copy the minimal call")}
        />
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "The value is a `Time` — hours, minutes and optionally seconds with no zone. `hourCycle` is the only display decision; leave it off and the locale decides, which is what a product with more than one region should do.",
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

      <EntryFooter entryId="time-picker" related={["date-picker", "calendar"]} />
    </DocPage>
  );
}
