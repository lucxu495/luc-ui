"use client";

/*
 * The body of the `field` page.
 *
 * `/components/field-parts` is the canonical URL for the `Field` entry, so the
 * page has to answer for `Field` first: what it owns (the id, the description,
 * the message, the invalid state) and what changes when a control is *not*
 * wrapped in one. The parts a form is assembled from — `InputGroup`, `Label`,
 * `Kbd`, `NativeSelect`, `HoverCard` — stay on the page as composition, because
 * that is where a reader sees how they fit together, and each of them also has
 * its own page in the sidebar.
 *
 * The API half is the server component beside this file: the compiler's tables
 * are ~666 KB and must not reach the browser, so they arrive as a node.
 */

import type { ReactNode } from "react";
import {
  Avatar,
  Badge,
  Button,
  Field,
  FieldGroup,
  Fieldset,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupSeparator,
  Kbd,
  KbdGroup,
  Label,
  NativeSelect,
  Panel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@luc/ui";
import { RiSearchLine, RiUserLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ImportLine } from "@/components/docs/family-imports";
import { CodeBlock } from "@/components/docs/code-block";
import { Example } from "@/components/docs/example";
import { GuidanceCards } from "@/components/docs/guidance";
import { ENTRY_NOTES } from "@/lib/docs/curation/notes";
import { useI18n } from "@/lib/i18n/provider";
import { EntryFooter } from "@/components/docs/entry-footer";

export function FieldPartsPage({ apiSection }: { apiSection?: ReactNode }) {
  const { tc, tcs } = useI18n();
  const notes = ENTRY_NOTES.field;
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Components · Field")}
        title="Field"
        lead={tc("components.fieldParts.lead")}
      />

      <ImportLine line={'import {\n  Field,\n  FieldGroup,\n  Fieldset,\n} from "@luc/ui/forms";'} />

      <section className="flex flex-col gap-5">
        <h2 id="examples" className="text-title text-fg-primary">
          {tcs("Examples")}
        </h2>

      <Example
        title={tcs("What Field owns — and what a bare Label costs you")}
        description={tcs("Both fields below look alike. Only the left one has a generated id, an `aria-describedby` relationship and `aria-invalid` when the value is rejected; the right one leaves all three to you.")}
        layout="block"
        code={`<Field label="Lookback" description="Bars used to warm up indicators." required>
  <Input defaultValue="200" />
</Field>

<div className="flex flex-col gap-1.5">
  <Label htmlFor="hand-rolled">Lookback</Label>
  <Input id="hand-rolled" defaultValue="200" aria-describedby="hand-rolled-hint" />
  <Text variant="caption" tone="muted" id="hand-rolled-hint">
    Bars used to warm up indicators.
  </Text>
</div>`}
      >

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={tcs("Lookback")} description={tcs("Bars used to warm up indicators.")} required>
            <Input defaultValue="200" />
          </Field>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hand-rolled-lookback">{tcs("Lookback")}</Label>
            <Input id="hand-rolled-lookback" defaultValue="200" aria-describedby="hand-rolled-lookback-hint" />
            <Text variant="caption" tone="muted" as="p" id="hand-rolled-lookback-hint">
              {tcs("Bars used to warm up indicators — and the wiring is yours.")}
            </Text>
          </div>
        </div>
        <Text variant="caption" tone="muted">
          {tc("components.fieldParts.labelNote")}
        </Text>
      </Example>

      <Example
        title={tcs("Fieldset names a question, FieldGroup is the grid")}
        description={tcs("A `<fieldset>` with a legend is announced with every control inside it, which a heading over a grid is not. `FieldGroup` adds no semantics at all — it is only the columns.")}
        layout="block"
        code={`<Fieldset legend="Delivery" description="Where the daily report is sent.">
  <FieldGroup columns={2}>
    <Field label="Channel">
      <Select defaultValue="email">…</Select>
    </Field>
    <Field label="Address">
      <Input placeholder="research@acme.dev" />
    </Field>
  </FieldGroup>
</Fieldset>`}
      >

        <Panel className="p-5">
          <Fieldset legend={tcs("Delivery")} description={tcs("Where the daily report is sent.")}>
            <FieldGroup columns={2}>
              <Field label={tcs("Channel")}>
                <Select defaultValue="email">
                  <SelectTrigger aria-label={tcs("Channel")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={tcs("Address")} description={tcs("One recipient per line.")}>
                <Input placeholder="research@acme.dev" />
              </Field>
            </FieldGroup>
          </Fieldset>
        </Panel>
      </Example>

      <Example
        title={tcs("One message slot")}
        description={tcs("Description, pending check, confirmation and error share one row: only the most specific one renders, so a field never stacks four lines of text.")}
        layout="grid"
        code={`<Field label="Handle" description="Lowercase, no spaces.">
  <Input defaultValue="acme" />
</Field>
<Field label="Handle" validating>
  <Input defaultValue="acme" />
</Field>
<Field label="Handle" success="Handle is available">
  <Input defaultValue="acme-research" />
</Field>
<Field label="Handle" error="Already taken">
  <Input defaultValue="acme" />
</Field>`}
      >

        <Field label={tcs("Handle")} description={tcs("Lowercase, no spaces.")}>
          <Input defaultValue="acme" />
        </Field>
        <Field label={tcs("Handle")} validating>
          <Input defaultValue="acme" />
        </Field>
        <Field label={tcs("Handle")} success={tcs("Handle is available")}>
          <Input defaultValue="acme-research" />
        </Field>
        <Field label={tcs("Handle")} error={tcs("Already taken")}>
          <Input defaultValue="acme" />
        </Field>
      </Example>

      <Example
        title={tc("components.fieldParts.group.title")}
        description={tc("components.fieldParts.group.lead")}
        layout="grid"
        code={'<InputGroup>\n  <InputGroupAddon>https://</InputGroupAddon>\n  <InputGroupInput placeholder="example.com" />\n</InputGroup>'}
      >

        <InputGroup>
          <InputGroupAddon>https://</InputGroupAddon>
          <InputGroupSeparator />
          <InputGroupInput aria-label="Host" placeholder="api.example.com" />
        </InputGroup>
        <InputGroup>
          <InputGroupAddon>
            <RiSearchLine />
          </InputGroupAddon>
          <InputGroupInput aria-label="Search datasets" defaultValue="btc" />
          <InputGroupAddon align="end" interactive>
            <Kbd size="sm">⌘</Kbd>
            <Kbd size="sm">K</Kbd>
          </InputGroupAddon>
        </InputGroup>
        <InputGroup invalid>
          <InputGroupAddon>
            <RiUserLine />
          </InputGroupAddon>
          <InputGroupInput aria-label="Owner" defaultValue="not a slug" />
        </InputGroup>
      </Example>

      <Example
        title={tc("components.fieldParts.label.title")}
        description={tc("components.fieldParts.label.lead")}
        layout="inline"
        code={`<Label htmlFor="workspace-name">Workspace name</Label>
<Label htmlFor="slug" required>Slug</Label>
<Kbd variant="raised" size="sm">Esc</Kbd>
<KbdGroup keys={["⌘", "K"]} />`}
      >

        <Label htmlFor="workspace-name">Workspace name</Label>
        <Label htmlFor="slug" required>
          Slug
        </Label>
        <Label size="sm" aria-disabled="true">
          {tcs("Archived")}
        </Label>
        <Kbd>{"/"}</Kbd>
        <Kbd variant="raised" size="sm">
          Esc
        </Kbd>
        <KbdGroup keys={["⌘", "K"]} />
      </Example>

      <Example
        title={tc("components.fieldParts.native.title")}
        code={`<NativeSelect
  aria-label="Timezone"
  defaultValue="utc"
  options={[
    { value: "utc", label: "UTC" },
    { value: "sg", label: "Asia/Singapore" },
  ]}
/>

<NativeSelect aria-label="Granularity" defaultValue="" placeholder="Choose a granularity" size="lg">
  <option value="1h">1 hour</option>
  <option value="1d">1 day</option>
</NativeSelect>`}
        description={tc("components.fieldParts.native.lead")}
        layout="grid"
      >

        <NativeSelect
          aria-label="Timezone"
          defaultValue="utc"
          options={[
            { value: "utc", label: "UTC" },
            { value: "sg", label: "Asia/Singapore" },
            { value: "ny", label: "America/New_York" },
          ]}
        />
        <NativeSelect aria-label="Granularity" defaultValue="" placeholder="Choose a granularity" size="lg">
          <option value="1h">1 hour</option>
          <option value="1d">1 day</option>
        </NativeSelect>
      </Example>

      <Example
        title={tc("components.fieldParts.hover.title")}
        code={`<HoverCard openDelay={300}>
  <HoverCardTrigger asChild>
    <Button variant="ghost">@ada</Button>
  </HoverCardTrigger>
  <HoverCardContent width="md">
    <Avatar name="Ada Lovelace" status="online" />
    <Text variant="label">Ada Lovelace</Text>
    <Text variant="caption" tone="muted">Research · Singapore</Text>
  </HoverCardContent>
</HoverCard>`}
        description={tc("components.fieldParts.hover.lead")}
        layout="inline"
      >

        <HoverCard openDelay={300}>
          <HoverCardTrigger asChild>
            <Button variant="ghost">@ada</Button>
          </HoverCardTrigger>
          <HoverCardContent width="md">
            <div className="flex items-start gap-3">
              <Avatar name="Ada Lovelace" status="online" />
              <div className="flex flex-col gap-1">
                <Text variant="label">Ada Lovelace</Text>
                <Text variant="caption" tone="muted">
                  Research · Singapore
                </Text>
                <Text variant="caption" tone="secondary">
                  {tcs("Owns the analytics validation suite. Every threshold in the pipeline traces back to a test in this repository.")}
                </Text>
                <span className="flex gap-2 pt-1">
                  <Badge tone="accent" size="sm">
                    12 studies
                  </Badge>
                  <Badge tone="neutral" size="sm">
                    reviewer
                  </Badge>
                </span>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
        <Text variant="caption" tone="muted">
          {tc("components.fieldParts.hoverNote")}
        </Text>
      </Example>

      </section>

      {/* --------------------------------------------------------------- usage */}
      <section className="flex flex-col gap-3">
        <h2 id="usage" className="text-title text-fg-primary">
          {tcs("Usage")}
        </h2>
        <ImportLine line={`import { Field, FieldGroup, Fieldset } from "@luc/ui/forms";`} />
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
        {notes?.accessibility?.detail ? (
          <div className="flex flex-col gap-1.5">
            <h3 className="text-title text-fg-primary">{tcs("Accessibility")}</h3>
            <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(notes.accessibility.detail)}
            </Text>
          </div>
        ) : null}
      </section>

      <EntryFooter entryId="field" related={["label", "input", "form"]} />
    </DocPage>
  );
}
