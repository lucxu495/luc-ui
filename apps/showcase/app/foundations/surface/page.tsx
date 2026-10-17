import type { Metadata } from "next";
import { Card, Code, Heading, Inline, Panel, Section, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { DataTable } from "@/components/docs/data-table";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Surface" };

export default async function SurfacePage() {
  const { tcs } = await getServerCopy();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Foundations")}
        title="Surface"
        lead="Depth in Luc UI is a luminance step plus a hairline. The stack is ordered, and components occupy a defined level rather than picking a grey at random."
      />

      <Section
        title={tcs("The stack")}
        description={tcs("Each level is a real component in this page — hover the nested cards to see how hairlines behave between levels.")}
      >
        <div className="rounded-xl border border-line-subtle bg-surface-canvas p-6">
          <Inline justify="between" className="mb-4 w-full">
            <Text variant="micro" tone="muted" as="p">
              surface.canvas
            </Text>
            <Text variant="micro" tone="muted" as="p">
              level 0
            </Text>
          </Inline>

          <Card variant="default" className="gap-4 p-5">
            <Inline justify="between" className="w-full">
              <Heading size="title" as="h3">
                Card on canvas
              </Heading>
              <Code>surface-default</Code>
            </Inline>
            <Text variant="caption" tone="muted">
              {tcs("One hairline, a small shadow, one luminance step above the canvas.")}</Text>

            <Panel tone="sunken" className="p-4">
              <Inline justify="between" className="w-full">
                <Text variant="label" tone="secondary" as="p">
                  Nested well
                </Text>
                <Code>surface-sunken</Code>
              </Inline>
              <Text variant="caption" tone="muted" className="mt-1.5">
                {tcs("Inputs and code sit *below* their container. Never go deeper than this.")}</Text>
            </Panel>

            <Panel tone="raised" className="p-4">
              <Inline justify="between" className="w-full">
                <Text variant="label" tone="secondary" as="p">
                  Raised region
                </Text>
                <Code>surface-raised</Code>
              </Inline>
              <Text variant="caption" tone="muted" className="mt-1.5">
                {tcs("Used by stat cards, popovers and anything that must clearly sit on top.")}</Text>
            </Panel>
          </Card>

          <Inline gap="sm" className="mt-4">
            <span className="rounded-md border border-line-default bg-surface-overlay px-3 py-2 text-caption text-fg-secondary shadow-overlay">
              {tcs("surface.overlay — dialogs & tooltips")}</span>
            <span className="rounded-md border border-line-subtle bg-surface-interactive px-3 py-2 text-caption text-fg-secondary">
              surface.interactive — controls
            </span>
          </Inline>
        </div>
      </Section>

      <Section title={tcs("Reference")}>
        <DataTable
          caption={tcs("Surface tokens")}
          columns={[
            { key: "token", header: "Token", render: (row: { token: string; utility: string; usage: string }) => <code className="font-mono text-fg-primary">{row.token}</code> },
            { key: "utility", header: "Utility", render: (row: { token: string; utility: string; usage: string }) => <code className="font-mono text-fg-accent">{row.utility}</code> },
            { key: "usage", header: "Use for", render: (row: { token: string; utility: string; usage: string }) => row.usage },
          ]}
          rows={[
            { token: "surface.canvas", utility: "bg-surface-canvas", usage: tcs("Page background. One per view.") },
            { token: "surface.sunken", utility: "bg-surface-sunken", usage: tcs("Inputs, code blocks, inset wells.") },
            { token: "surface.default", utility: "bg-surface-default", usage: tcs("Cards and panels resting on the canvas.") },
            { token: "surface.raised", utility: "bg-surface-raised", usage: tcs("Stat cards, popovers, active segments.") },
            { token: "surface.overlay", utility: "bg-surface-overlay", usage: tcs("Dialogs, tooltips, floating menus.") },
            { token: "surface.interactive", utility: "bg-surface-interactive", usage: tcs("Buttons, hoverable rows, segmented tracks.") },
            { token: "surface.inverse", utility: "bg-surface-inverse", usage: tcs("Inverted chips and counters.") },
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
              <li>{tcs("Stop at three nested levels: canvas → card → well.")}</li>
              <li>{tcs("Use a hairline (")}<Code>border-line-subtle</Code>{tcs(" when two levels are close in luminance.")}</li>
              <li>{tcs("Let overlays use the deepest shadow in the system.")}</li>
            </ul>
          </Card>
          <Card variant="outline" className="gap-2 p-4">
            <Text variant="micro" tone="negative" as="p">
              Don&apos;t
            </Text>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-label text-fg-secondary">
              <li>{tcs("Add a fourth nesting level — flatten the content instead.")}</li>
              <li>{tcs("Put an overlay surface inline in a page.")}</li>
              <li>{tcs("Rely on a big shadow to separate two surfaces in dark mode.")}</li>
            </ul>
          </Card>
        </div>
      </Section>
    </DocPage>
  );
}
