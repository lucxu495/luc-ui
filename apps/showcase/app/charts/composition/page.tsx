"use client";

import {
  Card,
  Code,
  FunnelChart,
  PieChart,
  Section,
  SunburstChart,
  Text,
  TreemapChart,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { compositionData, hierarchyData, sankeyFlow } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const COSTS = compositionData();
const HIERARCHY = hierarchyData();
const FUNNEL = sankeyFlow().links
  .filter((link) => ["Signup", "Trial", "Paid"].includes(link.target))
  .reduce<Array<{ name: string; value: number }>>((stages, link) => {
    const existing = stages.find((stage) => stage.name === link.target);
    if (existing) existing.value += link.value;
    else stages.push({ name: link.target, value: link.value });
    return stages;
  }, [{ name: "Visit", value: 980 }]);

export default function CompositionPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Charts · Composition")}
        title="Parts of a whole"
        lead="Composition charts are the easiest to misuse. A donut only works when the parts genuinely form a whole and there are few of them; a treemap or sunburst carries hierarchy; a funnel shows staged attrition."
      />

      <Section title={tcs("Donut")} description={tcs("Six slices, a centred total, and a chart that still reads at 320px wide.")}>
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Cost composition")}
            description={tcs("Donut — the default variant.")}
            height={320}
            render={({ height }) => (
              <PieChart
                data={COSTS}
                centerValue="1,152"
                centerLabel="Total"
                height={height}
                ariaLabel={tcs("Cost composition as a donut")}
              />
            )}
          />
          <ChartPanel
            title={tcs("Pie")}
            description={tcs("Available, but rarely the right call.")}
            height={320}
            render={({ height }) => (
              <PieChart data={COSTS} variant="pie" height={height} ariaLabel={tcs("Cost composition as a pie")} />
            )}
          />
        </div>
      </Section>

      <Section
        title={tcs("Hierarchy")}
        description={tcs("Treemap for area comparison inside a hierarchy; sunburst for depth.")}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Treemap")}
            description={tcs("Two levels: region, then product line.")}
            height={360}
            render={({ height }) => (
              <TreemapChart data={HIERARCHY} format={{ kind: "integer" }} height={height} />
            )}
          />
          <ChartPanel
            title={tcs("Sunburst")}
            description={tcs("Three levels, radial labels, no click-to-drill by default.")}
            height={360}
            render={({ height }) => (
              <SunburstChart data={HIERARCHY} format={{ kind: "integer" }} height={height} />
            )}
          />
        </div>
      </Section>

      <Section title={tcs("Funnel")} description={tcs("Staged attrition; each stage is labelled with its own share of the first.")}>
        <ChartPanel
          title={tcs("Acquisition funnel")}
          height={320}
          render={({ height }) => <FunnelChart data={FUNNEL} height={height} />}
        />
      </Section>

      <Section title={tcs("Chart selection rules")}>
        <div className="grid gap-3 md:grid-cols-3">
          <Card variant="outline" className="gap-1.5 p-4">
            <Text variant="label" as="p">
              Donut, when
            </Text>
            <Text variant="caption" tone="muted" as="p">
              {tcs("There is a genuine whole, six or fewer parts, and the reader only needs rank or rough share.")}</Text>
          </Card>
          <Card variant="outline" className="gap-1.5 p-4">
            <Text variant="label" as="p">
              Bar chart, when
            </Text>
            <Text variant="caption" tone="muted" as="p">
              {tcs("The categories do not sum to anything meaningful, or there are more than six of them.")}</Text>
          </Card>
          <Card variant="outline" className="gap-1.5 p-4">
            <Text variant="label" as="p">
              Never
            </Text>
            <Text variant="caption" tone="muted" as="p">
              {tcs("3D pies, exploded slices, or a donut used purely because the dashboard felt flat.")}</Text>
          </Card>
        </div>
        <Code block>{`<PieChart data={parts} variant="donut" centerValue="1,152" centerLabel="Total" />

// Beyond six slices the component says so in its own description.
<PieChart data={tooManyParts} />`}</Code>
      </Section>
    </DocPage>
  );
}
