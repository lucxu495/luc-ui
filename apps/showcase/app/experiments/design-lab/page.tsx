import Link from "next/link";
import { AppShellContent, Callout, Code, Panel, Section, Text } from "@luc/ui";
import { getServerCopy } from "@/lib/i18n/server";

const routes = [
  ["Precision Instrument", "Calibrated hierarchy and instrument-like surfaces", "precision-instrument"],
  ["Editorial Research", "Reading flow with the chart as evidence", "editorial-research"],
  ["Focused Workspace", "Linked selection, chart and inspector", "focused-workspace"],
] as const;

export default async function DesignLabIndex() {
  const { tcs, href } = await getServerCopy();
  return (
    <AppShellContent width="content" className="min-h-screen px-4 py-8 sm:px-8">
      <p className="text-micro font-semibold uppercase tracking-widest text-fg-muted">{tcs("LUC UI / experiment 01")}</p>
      <h1 className="mt-3 font-display text-display-sm font-semibold text-fg-primary">{tcs("Design Lab")}</h1>
      <p className="mt-3 max-w-2xl text-body text-fg-secondary">{tcs("Three treatments of the same prepared observations and the same table-to-chart-to-inspector interaction. Use the Showcase theme and motion controls to compare states.")}</p>
      <div className="mt-8 grid gap-3 md:grid-cols-3">
        {routes.map(([title, description, slug], index) => (
          <Link key={slug} href={href(`/experiments/design-lab/${slug}`)} className="luc-focus luc-transition group rounded-lg border border-line-default bg-surface-default p-5 no-underline shadow-xs hover:border-line-strong hover:bg-surface-raised">
            <span className="font-mono text-caption text-fg-accent">0{index + 1}</span>
            <h2 className="mt-4 text-heading-sm font-semibold text-fg-primary">{tcs(title)}</h2>
            <p className="mt-2 text-caption text-fg-secondary">{tcs(description)}</p>
            <span className="mt-6 inline-block text-caption text-fg-accent">{tcs("Open treatment →")}</span>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <Section
          title={tcs("Promoted recipe: linked data selection")}
          description={tcs("The experiment's one reusable outcome. Three treatments disagreed about layout and agreed about behaviour, which is the signal that the behaviour — not a visual — is what the library should document. No new component or hook was added: the whole flow is three controlled props on primitives that already exist.")}
        >
          <Panel className="flex flex-col gap-4 p-4">
            <Code block>{`const [selectedId, setSelectedId] = useState<string | null>(null);
const selected = rows.find((row) => row.id === selectedId) ?? null;

<ChartInspectionProvider
  groupId="transactions"
  pinned={selected?.time.getTime() ?? null}
  onPinnedChange={(time) =>
    setSelectedId(rows.find((row) => row.time.getTime() === time)?.id ?? null)
  }
>
  {/* 1. the table owns selection… */}
  <DataTable
    data={rows}
    columns={columns}
    getRowId={(row) => row.id}
    rowSelection={{ [selectedId ?? ""]: true }}
    onRowSelectionChange={/* …map ids to one identity… */}
    enableRowSelection="single"
    ariaLabel="Observations"
  />
  {/* 2. …the chart reads the same identity as a pinned point… */}
  <LineChart spec={spec} />
  {/* 3. …and the inspector shows the detail behind it. */}
  <InspectorPane open={Boolean(selected)} title={selected?.sample}>
    <InspectorRow label="Observed" value={\`\${selected?.responseMs} ms\`} />
  </InspectorPane>
</ChartInspectionProvider>`}</Code>
            <ul className="flex flex-col gap-1.5 text-body text-fg-secondary">
              <li>
                <Code>ChartInspectionProvider</Code> {tcs("— one identity shared by chart and inspector, controlled or uncontrolled.")}</li>
              <li>
                <Code>DataTable</Code> — <Code>rowSelection</Code> + <Code>onRowSelectionChange</Code>{tcs("; the row is the source of the identity.")}</li>
              <li>
                <Code>InspectorPane</Code> {tcs("— detail for the current identity, not a copy of the row.")}</li>
            </ul>
            <Callout tone="info" title={tcs("Why this is a recipe and not an API")}>
              {tcs("The three treatments place the same three pieces differently — stacked, side by side, or in a workspace — and a single component would have had to pick one. A recipe keeps the layout the product's decision and the behaviour the library's. If a fourth product repeats it verbatim, that is the signal to extract a component, not before.")}</Callout>
            <Text variant="caption" tone="muted">
              {tcs("Promoted from screenshots to a gate as well: these four routes are now first-class entries in the Showcase's QA registry (")}<Code>qa/routes.mjs</Code>, group <Code>experiments</Code>{tcs(", so the standard sweep — axe, light/dark, 1440/390 — covers them like any other page.")}</Text>
          </Panel>
        </Section>
      </div>
    </AppShellContent>
  );
}
