import type { Metadata } from "next";
import { Card, Code, Inline, NumericText, Panel, Section, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Demo } from "@/components/docs/demo";
import { DataTable } from "@/components/docs/data-table";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Typography" };

interface ScaleRow {
  token: string;
  className: string;
  size: string;
  lineHeight: string;
  tracking: string;
  sample: string;
  usage: string;
}

const scale: ScaleRow[] = [
  { token: "display", className: "text-display font-display font-semibold", size: "40px", lineHeight: "1.06", tracking: "-0.030em", sample: "Volatility regime", usage: "One hero statement per view" },
  { token: "display-sm", className: "text-display-sm font-display font-semibold", size: "32px", lineHeight: "1.12", tracking: "-0.026em", sample: "Research overview", usage: "Page titles" },
  { token: "heading", className: "text-heading font-display font-semibold", size: "24px", lineHeight: "1.20", tracking: "-0.022em", sample: "Drawdown analysis", usage: "Section headings" },
  { token: "heading-sm", className: "text-heading-sm font-display font-semibold", size: "20px", lineHeight: "1.25", tracking: "-0.018em", sample: "Rolling correlation", usage: "Sub-section headings" },
  { token: "title", className: "text-title font-medium", size: "17px", lineHeight: "1.35", tracking: "-0.012em", sample: "Chart card title", usage: "Card and panel titles" },
  { token: "body-lg", className: "text-body-lg", size: "16px", lineHeight: "1.60", tracking: "-0.006em", sample: "Introductory paragraphs and leads.", usage: "Lead paragraphs" },
  { token: "body", className: "text-body", size: "14px", lineHeight: "1.55", tracking: "-0.002em", sample: "Default body copy for dense product surfaces.", usage: "Body text" },
  { token: "label", className: "text-label", size: "13px", lineHeight: "1.40", tracking: "0.002em", sample: "Form labels, buttons, table cells", usage: "Controls and dense rows" },
  { token: "caption", className: "text-caption", size: "12px", lineHeight: "1.45", tracking: "0.005em", sample: "Meta text, timestamps, deltas", usage: "Secondary meta" },
  { token: "micro", className: "text-micro uppercase", size: "11px", lineHeight: "1.40", tracking: "0.080em", sample: "metric label", usage: "Uppercase metric labels only" },
];

export default async function TypographyPage() {
  const { tcs } = await getServerCopy();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Foundations")}
        title="Typography"
        lead="Three families with one voice: Inter for the interface, Inter Tight for hierarchy, JetBrains Mono for code and numbers. Every role has a fixed size, line height and tracking."
      />

      <Section title={tcs("Families")} description={tcs("All three are open source (SIL OFL 1.1) and self-hosted in the app bundle — no third-party font CDN at runtime.")}>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              name: "Inter Variable",
              token: "--font-sans",
              utility: "font-sans",
              license: "SIL OFL 1.1",
              className: "font-sans",
              note: tcs("Interface text, controls, body copy. Optimised for small sizes on screens."),
              sample: "Precise, calm interface text",
            },
            {
              name: "Inter Tight Variable",
              token: "--font-display",
              utility: "font-display",
              license: "SIL OFL 1.1",
              className: "font-display",
              note: tcs("Headings and headline numbers. Same DNA as the UI face, tighter at large sizes."),
              sample: "Confident hierarchy",
            },
            {
              name: "JetBrains Mono Variable",
              token: "--font-mono",
              utility: "font-mono",
              license: "SIL OFL 1.1",
              className: "font-mono",
              note: tcs("Code, identifiers, log output. Also used for dense tabular numerals."),
              sample: "btc_1d_close = 109241",
            },
          ].map((family) => (
            <Card key={family.name} variant="outline" className="gap-3 p-4">
              <div className={`text-heading-sm ${family.className} text-fg-primary`}>{tcs(family.sample)}</div>
              <Inline gap="xs">
                <Code>{family.utility}</Code>
                <Text variant="micro" tone="muted" as="span">
                  {family.license}
                </Text>
              </Inline>
              <Text variant="caption" tone="muted">
                {tcs(family.note)}
              </Text>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={tcs("Scale")} description={tcs("Ten roles. If a size is missing, the answer is usually to use an existing role rather than invent a value.")}>
        <Panel className="divide-y divide-line-subtle">
          {scale.map((row) => (
            <div key={row.token} className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:gap-8">
              <div className="flex w-40 shrink-0 flex-col gap-0.5">
                <span className="font-mono text-caption text-fg-primary">{row.token}</span>
                <span className="text-micro text-fg-muted">
                  {row.size} / {row.lineHeight} / {row.tracking}
                </span>
              </div>
              <div className={`min-w-0 flex-1 ${row.className} truncate text-fg-primary`}>{tcs(row.sample)}</div>
              <span className="w-64 shrink-0 text-caption text-fg-muted">{tcs(row.usage)}</span>
            </div>
          ))}
        </Panel>
      </Section>

      <Section
        title={tcs("Numeric text")}
        description={tcs("Tabular figures are mandatory wherever a number can change. Digits occupy equal width, so values do not jitter when they update.")}
      >
        <Demo
          title={tcs("Tabular vs proportional")}
          description={tcs("Same string, two figures. Only the tabular version stays stable when the value changes.")}
          layout="grid"
          code={`<NumericText value={109241} kind="currency" />`}
        >
          <Card variant="outline" className="gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              {tcs("Proportional — never use for data")}</Text>
            <div className="flex flex-col gap-1 font-display text-heading-sm text-fg-secondary">
              <span>109,241.00</span>
              <span>108,977.00</span>
            </div>
          </Card>
          <Card variant="outline" className="gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              Tabular — luc-numeric
            </Text>
            <div className="luc-numeric flex flex-col gap-1 font-mono text-heading-sm text-fg-primary">
              <span>109,241.00</span>
              <span>108,977.00</span>
            </div>
          </Card>
          <Card variant="outline" className="gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              NumericText component
            </Text>
            <div className="flex flex-col gap-1 text-heading-sm text-fg-primary">
              <NumericText value={128431} kind="currency" />
              <NumericText value={12.4} kind="percent" signed />
              <NumericText value={48291004} kind="compact" />
            </div>
          </Card>
        </Demo>
      </Section>

      <Section title={tcs("Using text components")}>
        <DataTable
          caption={tcs("Text component API")}
          columns={[
            {
              key: "component",
              header: "Component",
              render: (row: { component: string; api: string; note: string }) => (
                <code className="font-mono text-fg-primary">{row.component}</code>
              ),
            },
            {
              key: "api",
              header: "API",
              render: (row: { component: string; api: string; note: string }) => (
                <code className="font-mono text-fg-accent">{row.api}</code>
              ),
            },
            {
              key: "note",
              header: "Notes",
              render: (row: { component: string; api: string; note: string }) => row.note,
            },
          ]}
          rows={[
            { component: "Heading", api: 'size="display" | "display-sm" | "heading" | "heading-sm" | "title"', note: tcs("Uses the display face and balanced wrapping.") },
            { component: "Text", api: 'variant="body-lg" | "body" | "label" | "caption" | "micro"', note: tcs("Plus tone: primary…disabled, accent, positive, negative.") },
            { component: "Code", api: "block", note: tcs("Inline by default; `block` renders a monospaced panel.") },
            { component: "NumericText", api: 'value, kind="number" | "decimal" | "percent" | "currency" | "compact"', note: tcs("Always tabular; `—` for missing values.") },
            { component: "Kbd", api: "children", note: tcs("Keyboard hints inside tooltips and docs.") },
          ]}
        />
      </Section>

      <Section title={tcs("Rules")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="positive" as="p">
              Do
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>Use one <Code>display</Code> heading per view.</li>
              <li>Reach for <Code>micro</Code> {tcs("only on short uppercase labels.")}</li>
              <li>Set numbers in <Code>luc-numeric</Code>{tcs(", including table cells.")}</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              Don&apos;t
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Introduce a fourth family or a one-off weight.")}</li>
              <li>{tcs("Use tracking overrides to squeeze text into a box.")}</li>
              <li>{tcs("Set long prose in the display face.")}</li>
            </ul>
          </Card>
        </div>
      </Section>
    </DocPage>
  );
}
