import type { Metadata } from "next";
import { Card, Code, Section, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { DataTable } from "@/components/docs/data-table";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Shadow" };

const levels = [
  {
    token: "shadow.none",
    utility: "shadow-none",
    className: "shadow-none",
    usage: "Flat surfaces, table rows, ghost cards.",
  },
  {
    token: "shadow.xs",
    utility: "shadow-xs",
    className: "shadow-xs",
    usage: "Inset wells and the smallest controls.",
  },
  {
    token: "shadow.sm",
    utility: "shadow-sm",
    className: "shadow-sm",
    usage: "Default card and button elevation.",
  },
  {
    token: "shadow.md",
    utility: "shadow-md",
    className: "shadow-md",
    usage: "Hovered cards, raised stat cards.",
  },
  {
    token: "shadow.lg",
    utility: "shadow-lg",
    className: "shadow-lg",
    usage: "Menus and large floating panels.",
  },
  {
    token: "shadow.overlay",
    utility: "shadow-overlay",
    className: "shadow-overlay",
    usage: "Dialogs, popovers, tooltips.",
  },
];

export default async function ShadowPage() {
  const { tcs } = await getServerCopy();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Foundations")}
        title="Shadow"
        lead="Shadows are supporting actors. In dark mode they mostly reinforce layering; the real depth cue is the surface luminance step. Nothing in LUC UI uses a large generic drop shadow."
      />

      <Section title={tcs("Levels")}>
        <div className="grid gap-6 rounded-lg border border-line-subtle bg-surface-canvas p-6 sm:grid-cols-2 lg:grid-cols-3">
          {levels.map((level) => (
            <div key={level.token} className="flex flex-col gap-3">
              <div
                className={`flex h-24 items-center justify-center rounded-lg border border-line-subtle bg-surface-raised ${level.className}`}
              >
                <span className="font-mono text-micro text-fg-muted">{level.token}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <Code>{level.utility}</Code>
                <Text variant="caption" tone="muted">
                  {tcs(level.usage)}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title={tcs("Dark mode detail")}
        description={tcs("Dark shadows need an inset top highlight or the surface reads as a hole. That highlight is part of the shadow token, not a component style.")}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Card variant="outline" className="gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              {tcs("Wrong — flat fill")}</Text>
            <div className="h-20 rounded-md border border-line-subtle bg-surface-raised" />
            <Text variant="caption" tone="muted">
              {tcs("Looks like a hole cut in the canvas.")}</Text>
          </Card>
          <Card variant="outline" className="gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              {tcs("Right — sm with inset highlight")}</Text>
            <div className="h-20 rounded-md border border-line-subtle bg-surface-raised shadow-sm" />
            <Text variant="caption" tone="muted">
              {tcs("Reads as a surface catching light from above.")}</Text>
          </Card>
          <Card variant="outline" className="gap-3 p-4">
            <Text variant="micro" tone="muted" as="p">
              {tcs("Too much — 24px blur")}</Text>
            <div className="h-20 rounded-md border border-line-subtle bg-surface-raised shadow-[0_18px_40px_-4px_oklch(0_0_0/0.9)]" />
            <Text variant="caption" tone="muted">
              {tcs("Reads as a floating sticker, not a panel.")}</Text>
          </Card>
        </div>
      </Section>

      <Section title={tcs("Reference")}>
        <DataTable
          caption={tcs("Shadow tokens")}
          columns={[
            { key: "token", header: "Token", render: (row: (typeof levels)[number]) => <code className="font-mono text-fg-primary">{row.token}</code> },
            { key: "utility", header: "Utility", render: (row: (typeof levels)[number]) => <code className="font-mono text-fg-accent">{row.utility}</code> },
            { key: "usage", header: "Use for", render: (row: (typeof levels)[number]) => tcs(row.usage) },
          ]}
          rows={levels}
        />
      </Section>

      <Section title={tcs("Rules")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="positive" as="p">
              Do
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Change elevation by one step on interaction, not two.")}</li>
              <li>{tcs("Combine elevation with a border colour change for a crisp hover.")}</li>
              <li>{tcs("Keep overlay shadows the only deep ones.")}</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              Don&apos;t
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Animate blur radius — it forces a repaint every frame.")}</li>
              <li>{tcs("Put a shadow on every card in a dashboard grid.")}</li>
              <li>Write a bespoke <Code>box-shadow</Code> in a component.</li>
            </ul>
          </Card>
        </div>
      </Section>
    </DocPage>
  );
}
