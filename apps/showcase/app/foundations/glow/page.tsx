import type { Metadata } from "next";
import { Card, Code, Inline, Section, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { DataTable } from "@/components/docs/data-table";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Glow" };

export default async function GlowPage() {
  const { tcs } = await getServerCopy();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Foundations")}
        title="Glow"
        lead="Glow is part of the LUC identity and it is strictly rationed. It marks focus and selection — never decoration, never a passive surface, never more than one element at a time."
      />

      <Section title={tcs("Levels")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { token: "glow.none", note: tcs("Passive surfaces at rest."), className: "", label: "Resting card" },
            { token: "glow.subtle", note: tcs("Hover on a primary action or selected card."), className: "shadow-[var(--elevation-sm),var(--glow-subtle)]", label: "Hover / selected" },
            { token: "glow.focus", note: tcs("Keyboard focus. Must stay ≥ 3:1 against its surface."), className: "shadow-[var(--glow-focus)]", label: "Focus" },
            { token: "glow.accent", note: tcs("One featured surface per view, at most."), className: "shadow-[var(--elevation-md),var(--glow-accent)]", label: "Featured" },
          ].map((item) => (
            <div key={item.token} className="flex flex-col gap-3">
              <div
                className={`flex h-24 items-center justify-center rounded-lg border ${
                  item.token === "glow.focus" ? "border-line-accent" : "border-line-subtle"
                } bg-surface-raised text-caption text-fg-secondary ${item.className}`}
              >
                {item.label}
              </div>
              <div className="flex flex-col gap-0.5">
                <Code>{item.token}</Code>
                <Text variant="caption" tone="muted">
                  {tcs(item.note)}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title={tcs("Where glow is allowed")}
        description={tcs("Four places. Anywhere else is a bug, not a style choice.")}
      >
        <DataTable
          caption={tcs("Glow usage")}
          columns={[
            { key: "where", header: "Where", render: (row: { where: string; token: string; rule: string }) => tcs(row.where) },
            { key: "token", header: "Token", render: (row: { where: string; token: string; rule: string }) => <code className="font-mono text-fg-accent">{row.token}</code> },
            { key: "rule", header: "Rule", render: (row: { where: string; token: string; rule: string }) => tcs(row.rule) },
          ]}
          rows={[
            { where: "Keyboard focus", token: "--glow-focus", rule: "Always present on interactive elements; contrast first, aesthetics second." },
            { where: "Primary action hover", token: "--glow-subtle", rule: "At most a whisper; the button must still read at rest." },
            { where: "Selected card / active tab", token: "--glow-subtle", rule: "Pairs with an accent border, never replaces it." },
            { where: "BorderGlow hover", token: "--glow-accent", rule: "Only where the surface is the subject of the view." },
          ]}
        />
      </Section>

      <Section title={tcs("Composition")} description={tcs("Glow follows a border, not a blob. It is drawn on a 1px ring and masked, so it never washes over content.")}>
        <Inline gap="md" className="flex-wrap">
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="positive" as="p">
              Right
            </Text>
            <Text variant="caption" tone="muted">
              {tcs("A masked 1px ring with an accent gradient, plus a low-alpha bloom outside the edge.")}</Text>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              Wrong
            </Text>
            <Text variant="caption" tone="muted">
              {tcs("A large radial highlight inside the card that reduces text contrast and reads as “AI generated”.")}</Text>
          </Card>
        </Inline>
      </Section>
    </DocPage>
  );
}
