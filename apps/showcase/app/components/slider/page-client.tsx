"use client";

/*
 * The body of the Slider page.
 *
 * Six examples, in the order a reader needs them: one value, a range, states and
 * orientation, a form, and the shape a real settings pane takes. They are the
 * page's coverage and they do not change; what changed around them is the
 * documentation shell — the compiled API in one area, and the advice in the
 * Guidelines section instead of a second "Rules" block beside a prose Props
 * table.
 */

import { useState, type ReactNode } from "react";
import {
  Button,
  Card,
  Field,
  Form,
  FormActions,
  FormErrorSummary,
  Panel,
  RangeSlider,
  Slider,
  SubmitButton,
  Switch,
  Text,
  toast,
  type FormErrorItem,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Example } from "@/components/docs/example";
import { EntryFooter } from "@/components/docs/entry-footer";
import { CodeBlock } from "@/components/docs/code-block";
import { ImportLine } from "@/components/docs/family-imports";
import { GuidanceCards } from "@/components/docs/guidance";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";

/*
 * No page-local room for the value bubble or the mark captions.
 *
 * This page used to add `mt-6` to every `showValue="always"` specimen and `mb-5`
 * under the marked one, because both decorations were painted outside the
 * slider's own box and landed on the field label above or the sentence below.
 * The room is the component's now (`slider.tsx` reserves a padding band only
 * when a decoration is configured), so the compensation is gone and the page
 * renders the primitive the way a product does.
 */

export function SliderPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const notes = ENTRY_NOTES.slider;
  const [confidence, setConfidence] = useState(0.72);
  const [band, setBand] = useState<[number, number]>([18, 64]);
  const [lookback, setLookback] = useState(180);
  const [errors, setErrors] = useState<FormErrorItem[]>([]);
  const [alerts, setAlerts] = useState(true);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components · Slider")}
        title="Slider"
        lead="A continuous numeric control for thresholds, lookbacks and weights: a small thumb, a much larger hit target, and a value shown only while it is being used."
      />

      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

      <Example
        title={tcs("One value")}
        description={tcs("Arrow keys step by step, Home and End jump to the bounds, and the value bubble appears on hover, focus and drag.")}
        layout="block"
        code={'<Slider value={confidence} onValueChange={setConfidence} min={0} max={1} step={0.01} />\n<Slider defaultValue={45} showValue="always" formatValue={(value) => `${value}%`} />'}
      >

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="flex flex-col gap-5 p-5">
            <Field label={tcs("Confidence threshold")} description={tcs("Signals below this score are dropped.")}>
              <Slider
                value={confidence}
                onValueChange={setConfidence}
                min={0}
                max={1}
                step={0.01}
                formatValue={(value) => value.toFixed(2)}
              />
            </Field>
            <Field label={tcs("Report weight")} description={tcs("Relative weight in the composite score.")}>
              <Slider defaultValue={45} showValue="always" formatValue={(value) => `${value}%`} />
            </Field>
          </Panel>
          <Panel className="flex flex-col gap-5 p-5">
            <Field label={tcs("Small")}>
              <Slider size="sm" defaultValue={30} label="Small slider" />
            </Field>
            <Field label={tcs("Default")}>
              <Slider defaultValue={55} label="Default slider" />
            </Field>
            <Field label={tcs("Large")}>
              <Slider size="lg" defaultValue={70} label="Large slider" />
            </Field>
          </Panel>
        </div>
      </Example>

      <Example
        title={tcs("A range")}
        description={tcs("RangeSlider is two thumbs over one inclusive pair. The value is always handed back sorted, so a consumer never re-orders it.")}
        layout="block"
        code={'<RangeSlider value={band} onValueChange={setBand} min={0} max={100} minStepsBetweenThumbs={5} />'}
      >

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="flex flex-col gap-4 p-5">
            <Field label={tcs("Position band")} description={tcs("Never closer than five points.")}>
              <RangeSlider
                value={band}
                onValueChange={setBand}
                min={0}
                max={100}
                minStepsBetweenThumbs={5}
                formatValue={(value) => `${value}`}
              />
            </Field>
            <Text variant="caption" tone="muted">
              {band[0]} to {band[1]}
            </Text>
          </Panel>
          <Panel className="flex flex-col gap-4 p-5">
            <Field label={tcs("Notional range")}>
              <RangeSlider
                defaultValue={[200, 800]}
                min={100}
                max={1000}
                step={50}
                showValue="always"
                label="Notional range"
                formatValue={(value) => `$${value}`}
              />
            </Field>
          </Panel>
        </div>
      </Example>

      <Example
        title={tcs("Compact, with nothing to reveal")}
        code={`{/* \`auto\` (the default) reserves the bubble's room: the value appears during
    the drag, and a row that grew mid-gesture would push the content under it.
    \`never\` opts out of the decoration entirely. */}

<Slider defaultValue={40} showValue="never" label="Opacity" />
<RangeSlider defaultValue={[25, 75]} showValue="never" label="Band" />
<Slider defaultValue={50} showValue="never" marks={[{ value: 0 }, { value: 100 }]} label="Ticks" />`}
        description={tcs(
          "`showValue=\"never\"` and ticks without captions reserve no room, so the root is the groove and the thumb — 20px at `md` rather than 38px. That is the shape a toolbar or a table cell wants, and it is the only configuration in which the slider does not grow.",
        )}
        layout="inline"
      >
        <div className="flex w-56 flex-col gap-3">
          <Slider defaultValue={40} showValue="never" label={tcs("Opacity")} />
          <RangeSlider defaultValue={[25, 75]} showValue="never" label={tcs("Band")} />
          <Slider
            defaultValue={50}
            showValue="never"
            marks={[{ value: 0 }, { value: 100 }]}
            label={tcs("Ticks")}
          />
        </div>
      </Example>

      <Example
        title={tcs("States and orientation")}
        code={`<Slider defaultValue={40} label="Disabled" disabled />
<Slider defaultValue={60} label="Invalid" invalid />
<Slider orientation="vertical" defaultValue={35} label="Vertical" className="h-40" />`}
        description={tcs("Disabled is expressed with colour, never with whole-component opacity, so the label and value stay readable. A vertical slider is sized by the consumer's box.")}
        layout="block"
      >

        <div className="grid gap-4 md:grid-cols-3">
          <Panel className="flex flex-col gap-5 p-5">
            <Slider defaultValue={40} label="Disabled" disabled />
            <Slider defaultValue={60} label="Invalid" invalid />
            <Text variant="caption" tone="muted">
              {tcs("Invalid swaps the accent for the negative tone and sets aria-invalid on the thumb.")}</Text>
          </Panel>
          <Panel className="flex items-center justify-center gap-8 p-5">
            <div className="flex flex-col items-center gap-2">
              <Slider orientation="vertical" defaultValue={35} label="Vertical" className="h-40" />
              <Text variant="caption" tone="muted">
                35
              </Text>
            </div>
            <div className="flex flex-col items-center gap-2">
              <RangeSlider orientation="vertical" defaultValue={[25, 75]} label="Vertical band" className="h-40" />
              <Text variant="caption" tone="muted">
                Range
              </Text>
            </div>
          </Panel>
          <Panel className="flex flex-col gap-4 p-5">
            <Field label={tcs("Lookback (bars)")} description={tcs("Marks are declared by the consumer, never generated.")}>
              <Slider
                value={lookback}
                onValueChange={setLookback}
                min={20}
                max={400}
                step={20}
                showValue="always"
                marks={[
                  { value: 20, label: "20" },
                  { value: 200, label: "200" },
                  { value: 400, label: "400" },
                ]}
              />
            </Field>
          </Panel>
        </div>
      </Example>

      <Example
        title={tcs("In a form")}
        code={`<Form errors={errors} onSubmit={save}>
  <FormErrorSummary />
  <Field label="Drawdown limit" description="Percent of peak equity before the run stops.">
    <Slider defaultValue={12} min={0} max={50} step={1} />
  </Field>
  <Button type="submit">Save limits</Button>
</Form>`}
        description={tcs("A slider is a control like any other: it takes its label, description and error from Field, and it submits through the form's own lifecycle.")}
        layout="block"
      >

        <Card className="p-5">
          <Form
            className="flex flex-col gap-5"
            errors={errors}
            onSubmit={async () => {
              setErrors([]);
              await new Promise((resolve) => setTimeout(resolve, 300));
              toast.success("Risk limits saved");
            }}
          >
            <FormErrorSummary />
            <Field label={tcs("Drawdown limit")} description={tcs("Percent of peak equity before the run stops.")}>
              <Slider
                defaultValue={12}
                min={0}
                max={50}
                showValue="always"
                label="Drawdown limit"
                formatValue={(value) => `${value}%`}
              />
            </Field>
            <Field label={tcs("Maximum position weight")} description={tcs("Cap per instrument.")}>
              <RangeSlider
                defaultValue={[2, 15]}
                min={0}
                max={25}
                showValue="always"
                label="Maximum position weight"
                formatValue={(value) => `${value}%`}
              />
            </Field>
            <FormActions>
              <Button variant="ghost" type="reset">
                Reset
              </Button>
              <SubmitButton>Save limits</SubmitButton>
            </FormActions>
          </Form>
        </Card>
      </Example>

      <Example
        title={tcs("Settings pattern")}
        code={`<Toggle pressed={alerting} onPressedChange={setAlerting} aria-label="Alert on drawdown">
  Alert on drawdown
</Toggle>

<Field label="Limit" description="Percent of peak equity.">
  <Slider value={limit} onValueChange={setLimit} min={0} max={50} showValue="always" />
</Field>`}
        description={tcs("The shape a real settings pane takes: a label, a live value, a switch for the on/off axis and a slider for the amount.")}
        layout="block"
      >

        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Text variant="label">Alert on drawdown</Text>
              <Text variant="caption" tone="muted">
                {tcs("Posts to the research channel when a run crosses the limit.")}</Text>
            </div>
            <Switch checked={alerts} onCheckedChange={setAlerts} aria-label={tcs("Alert on drawdown")} />
          </div>
          <Field label={tcs("Threshold")} description={tcs("Applied to the daily equity curve.")}>
            <Slider
              defaultValue={8}
              min={1}
              max={30}
              disabled={!alerts}
              showValue="always"
              label="Alert threshold"
              formatValue={(value) => `${value}%`}
            />
          </Field>
        </Card>
      </Example>

      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <h2 id="usage" className="text-title text-fg-primary">
          {tcs("Usage")}
        </h2>
        <ImportLine line={`import { RangeSlider, Slider } from "@luc/ui/slider";`} />
        {notes?.usage?.code ? (
          <CodeBlock code={notes.usage.code} label={tcs("Copy the minimal call")} />
        ) : null}
        {notes?.usage?.note ? (
          <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
            {tcs(notes.usage.note)}
          </Text>
        ) : null}
      </section>

      {apiSection}

      {/* ---------------------------------------------------------- guidelines */}
      <section className="flex flex-col gap-4">
        <h2 id="guidelines" className="text-title text-fg-primary">
          {tcs("Guidelines")}
        </h2>
        <GuidanceCards use={notes?.guidance?.use ?? []} avoid={notes?.guidance?.avoid ?? []} tcs={tcs} />
        <Panel className="flex flex-col gap-3 p-5">
          <Text variant="micro" tone="muted" as="p">
            {tcs("Two components, one shell")}
          </Text>
          <dl className="grid gap-3 text-caption sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="text-micro text-fg-accent uppercase">Slider</dt>
              <dd className="text-fg-muted">
                {tcs("One value: a threshold, a weight, a lookback. `value` is a number.")}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-micro text-fg-accent uppercase">RangeSlider</dt>
              <dd className="text-fg-muted">
                {tcs("Two ends of one band. The pair comes back sorted, and `minStepsBetweenThumbs` is the gap the thumbs keep.")}
              </dd>
            </div>
          </dl>
        </Panel>
        {notes?.accessibility?.detail ? (
          <div className="flex flex-col gap-1.5">
            <h3 className="text-title text-fg-primary">{tcs("Accessibility")}</h3>
            <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(notes.accessibility.detail)}
            </Text>
          </div>
        ) : null}
      </section>

      <EntryFooter entryId="slider" related={["number-input", "input", "rating"]} />
    </DocPage>
  );
}
