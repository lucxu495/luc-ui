"use client";

import { useState } from "react";
import { Card, Checkbox, Code, Field, Inline, Kbd, Panel, Radio, RadioGroup, Switch, Text } from "@luc/ui";
import { RiFilter3Line } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { CodeBlock } from "@/components/docs/code-block";
import { RelatedApi } from "@/components/docs/related-api";
import { useI18n } from "@/lib/i18n/provider";

export default function SelectionPage() {
  const { tcs } = useI18n();
  const [pending, setPending] = useState(true);
  const [alerts, setAlerts] = useState(false);
  const [universe, setUniverse] = useState("top25");
  /*
   * The mixed-state box is a **tri-state control**, not a picture of one.
   *
   * It was `checked="indeterminate"` with no handler, so a reader could press it
   * and nothing happened — the page that says "each state change is animated"
   * had one control that could not change state at all. Starting mixed and
   * resolving on press is also the pattern the mixed state exists for: a "select
   * all" for a set whose members disagree.
   */
  const [domains, setDomains] = useState<boolean | "indeterminate">("indeterminate");

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components")}
        title="Selection"
        lead="Checkbox, radio and switch are the components users read most often in a dense screen. Each state change is animated once, quickly, and only for the part that actually changed."
      />

      <ImportLine line={'import { Checkbox, Field, Kbd, Radio, RadioGroup, Switch } from "@luc/ui";'} />

      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

      <Example
        title={tcs("Checkbox")}
        description={tcs("The box fills, then the tick draws itself. Indeterminate is a first-class state, not a third colour.")}
        layout="block"
        code={`<Checkbox defaultChecked label="Include delisted instruments" />
<Checkbox checked={domains} onCheckedChange={setDomains} label="All analytics domains" />
<Checkbox disabled label="Locked by policy" />`}
      >

        <div className="grid gap-4 md:grid-cols-3">
          <Panel className="flex flex-col gap-4 p-4">
            <Checkbox defaultChecked label={tcs("Include delisted instruments")} />
            <Checkbox label={tcs("Notify on completion")} />
            <Checkbox checked={domains} onCheckedChange={setDomains} label={tcs("All analytics domains")} />
            <Checkbox disabled defaultChecked label={tcs("Locked by policy")} />
          </Panel>
          <Panel className="flex flex-col gap-4 p-4">
            <Checkbox
              defaultChecked
              label={tcs("Include warm-up period")}
              description={tcs("Keeps the first 200 bars in the equity curve.")}
            />
            <Checkbox
              label={tcs("Export machine artifacts")}
              description={tcs("Writes Evaluation and Robustness JSON to luc-data/research.")}
            />
          </Panel>
          <Panel className="flex flex-col gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              Keyboard
            </Text>
            <Text variant="caption" tone="muted">
              <Kbd>Space</Kbd> {tcs("toggles the focused box. The label is clickable and part of the same hit target.")}</Text>
          </Panel>
        </div>
      </Example>

      <Example
        title={tcs("Radio")}
        description={tcs("Single choice inside a group. Arrow keys move between options; the dot scales in with a slight emphasis curve.")}
        layout="block"
        code={`<RadioGroup value={universe} onValueChange={setUniverse}>
  <Radio value="top25" label="Top 25 by volume" />
  <Radio value="majors" label="Majors only" />
</RadioGroup>`}
      >

        <div className="grid gap-4 md:grid-cols-2">
          <Panel className="p-4">
            <RadioGroup value={universe} onValueChange={setUniverse} className="flex flex-col gap-4">
              <Radio value="top25" label={tcs("Top 25 by volume")} description={tcs("Liquid, but noisy.")} />
              <Radio value="majors" label={tcs("Majors only")} description={tcs("BTC, ETH and stable pairs.")} />
              <Radio value="all" label={tcs("Everything tracked")} />
              <Radio value="locked" label={tcs("Custom watchlist (locked)")} disabled />
            </RadioGroup>
          </Panel>
          <Panel className="flex flex-col gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              Field composition
            </Text>
            <Field label={tcs("Cost model")} description={tcs("Applied to every fill in the backtest.")}>
              <RadioGroup defaultValue="bps" className="flex flex-col gap-3">
                <Radio value="bps" label={tcs("Fixed basis points")} />
                <Radio value="spread" label={tcs("Half spread + slippage")} />
                <Radio value="impact" label={tcs("Square-root market impact")} />
              </RadioGroup>
            </Field>
          </Panel>
        </div>
      </Example>

      <Example
        title={tcs("Switch")}
        description={tcs("Switch changes something immediately. If a confirmation follows, use a checkbox instead.")}
        layout="block"
        code={`<Switch checked={pending} onCheckedChange={setPending} label="Show pending runs" />
<Switch size="sm" label="Compact switch" />`}
      >

        <div className="grid gap-4 md:grid-cols-3">
          <Panel className="flex flex-col gap-4 p-4">
            <Switch
              checked={pending}
              onCheckedChange={setPending}
              label={tcs("Show pending runs")}
              description={tcs("Includes runs still writing artifacts.")}
            />
            <Switch
              checked={alerts}
              onCheckedChange={setAlerts}
              label={tcs("Alert on drawdown > 12%")}
              description={tcs("Posts to the Lark channel.")}
            />
            <Switch size="sm" defaultChecked label={tcs("Small size (dense toolbars)")} />
            <Switch disabled label={tcs("Locked by workspace policy")} />
          </Panel>
          <Panel className="flex flex-col gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              State
            </Text>
            <Inline gap="sm">
              <Switch defaultChecked aria-label={tcs("On")} />
              <Switch aria-label={tcs("Off")} />
            </Inline>
            <Text variant="caption" tone="muted">
              {tcs("The thumb slides with a single confident motion and squishes slightly while pressed. Press and hold to feel it.")}</Text>
          </Panel>
          <Panel className="flex flex-col gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              Filter row
            </Text>
            <Inline gap="sm" className="rounded-md border border-line-subtle bg-surface-sunken px-3 py-2">
              <RiFilter3Line className="size-4 text-fg-muted" />
              <Text variant="caption" tone="secondary">
                Signals
              </Text>
              <Switch size="sm" defaultChecked aria-label={tcs("Filter by signals")} />
            </Inline>
          </Panel>
        </div>
      </Example>

      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <h2 id="usage" className="text-title text-fg-primary">
          {tcs("Usage")}
        </h2>
        <ImportLine line={'import { Checkbox, Radio, RadioGroup, Switch } from "@luc/ui";'} />
        <CodeBlock
          code={`<Checkbox label="Include delisted instruments" />`}
          label={tcs("Copy the minimal call")}
        />
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs("Four controls, one question each: a checkbox answers a form, a switch applies at once, a radio picks one of a few, and a segmented control shows those few side by side.")}
        </Text>
      </section>

      {/*
        * The props live on the four entries, not here.
        *
        * This page compared the controls with a hand-written `PropsTable` of five
        * rows — `label`, `checked`, `invalid`, `Switch size`, `RadioGroup` — each
        * of which is a partial restatement of a table the compiler already
        * produces on the component's own page. A comparison page's API section is
        * the way to those tables (`components/docs/related-api.tsx`), which is
        * also the shape `/forms/validation` and `/forms/async` use.
        */}
      <RelatedApi ids={["checkbox", "radio-group", "switch", "segmented-control"]} />

      {/* ---------------------------------------------------------- guidelines */}
      <section className="flex flex-col gap-4">
        <h2 id="guidelines" className="text-title text-fg-primary">
          {tcs("Guidelines")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="positive" as="p">
              {tcs("Do")}
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Use a switch for immediate effect, a checkbox for deferred choice.")}</li>
              <li>{tcs("Give every control a visible label — never rely on a tooltip.")}</li>
              <li>{tcs("Keep the hit target at least 18px plus its label.")}</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              {tcs("Don't")}
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Use a checkbox as a switch or vice versa.")}</li>
              <li>{tcs("Colour a checkbox red to mean “delete” — use a danger button.")}</li>
              <li>Leave a <Code>RadioGroup</Code> {tcs("without a default when a choice is required.")}</li>
            </ul>
          </Card>
        </div>
      </section>
          <EntryFooter />
    </DocPage>
  );
}
