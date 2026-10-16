import type { Metadata } from "next";
import { Badge, Button, Card, Code, Input, Panel, Section, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { DataTable } from "@/components/docs/data-table";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Radius" };

const radii = [
  { token: "radius.xs", variable: "--radius-xs", value: "4px", utility: "rounded-xs", usage: "Inline code, tiny chips" },
  { token: "radius.sm", variable: "--radius-sm", value: "6px", utility: "rounded-sm", usage: "Small controls, kbd, tags" },
  { token: "radius.md", variable: "--radius-md", value: "8px", utility: "rounded-md", usage: "Default control radius" },
  { token: "radius.lg", variable: "--radius-lg", value: "12px", utility: "rounded-lg", usage: "Cards, panels" },
  { token: "radius.xl", variable: "--radius-xl", value: "16px", utility: "rounded-xl", usage: "Dialogs, hero surfaces" },
  { token: "radius.2xl", variable: "--radius-2xl", value: "22px", utility: "rounded-2xl", usage: "Special showcase surfaces only" },
  { token: "radius.full", variable: "--radius-full", value: "9999px", utility: "rounded-full", usage: "Dots, avatars, switch track" },
];

export default async function RadiusPage() {
  const { tcs } = await getServerCopy();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Foundations")}
        title="Radius"
        lead="Seven steps, and each one maps to a role. Radius is what makes a system feel consistent — a stray 10px corner is more noticeable than a wrong colour."
      />

      <Section title={tcs("Scale")}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {radii.map((item) => (
            <div key={item.token} className="flex flex-col gap-2">
              <div
                className="h-16 w-full border border-line-default bg-surface-raised shadow-sm"
                style={{ borderRadius: `var(${item.variable})` }}
              />
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-caption text-fg-primary">{item.token}</span>
                <span className="font-mono text-micro text-fg-muted">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title={tcs("Applications")} description={tcs("Radius follows role, not taste. These are the only pairings you should need.")}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card variant="outline" className="gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              {tcs("radius.sm — small controls")}</Text>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">Small button</Button>
              <Badge size="sm" tone="accent">
                Tag
              </Badge>
            </div>
          </Card>
          <Card variant="outline" className="gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              {tcs("radius.md — default controls")}</Text>
            <div className="flex flex-col gap-2">
              <Input placeholder="Instrument or symbol" size="md" />
              <Button size="md" variant="secondary" block>
                Apply filter
              </Button>
            </div>
          </Card>
          <Card variant="outline" className="gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              {tcs("radius.lg / xl — surfaces")}</Text>
            <Panel className="p-3">
              <Text variant="caption" tone="muted">
                {tcs("Panels and cards use 12px. Dialogs lift to 16px because they float furthest from the canvas.")}</Text>
            </Panel>
          </Card>
        </div>
      </Section>

      <Section title={tcs("Reference")}>
        <DataTable
          caption={tcs("Radius tokens")}
          columns={[
            { key: "token", header: "Token", render: (row: (typeof radii)[number]) => <code className="font-mono text-fg-primary">{row.token}</code> },
            { key: "value", header: "Value", render: (row: (typeof radii)[number]) => <code className="font-mono text-fg-accent">{row.value}</code> },
            { key: "utility", header: "Utility", render: (row: (typeof radii)[number]) => <code className="font-mono text-fg-muted">{row.utility}</code> },
            { key: "usage", header: "Use for", render: (row: (typeof radii)[number]) => row.usage },
          ]}
          rows={radii}
        />
      </Section>

      <Section title={tcs("Rules")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="positive" as="p">
              Do
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Match a control's radius to its size.")}</li>
              <li>{tcs("Nest surfaces with an")}{" "}<Code>inherit</Code> {tcs("radius and one step of padding.")}</li>
              <li>{tcs("Keep the switch track and its thumb fully round.")}</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              Don&apos;t
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Default to pill-shaped buttons — they read as consumer, not analytical.")}</li>
              <li>{tcs("Mix two radii inside one component group.")}</li>
              <li>Use <Code>rounded-none</Code> {tcs("for “technical” unless the surface is a table edge.")}</li>
            </ul>
          </Card>
        </div>
      </Section>
    </DocPage>
  );
}
