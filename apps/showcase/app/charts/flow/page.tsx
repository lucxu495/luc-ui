"use client";

import { Code, GraphChart, SankeyChart, Section } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { networkGraph, sankeyFlow } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const FLOW = sankeyFlow();
const NETWORK = networkGraph();

export default function FlowPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Charts · Flow")}
        title="Sankey and network"
        lead="Flow diagrams earn their space when the path matters more than the total. Links stay quiet, nodes carry the colour, and neither chart is used as decoration."
      />

      <Section
        title={tcs("Sankey")}
        description={tcs("Eight nodes, nine links. Link opacity is deliberately low so the nodes dominate.")}
      >
        <ChartPanel
          title={tcs("Acquisition to retention")}
          description={tcs("Prepared node and link lists — the chart does not aggregate anything.")}
          height={380}
          render={({ height }) => (
            <SankeyChart
              nodes={FLOW.nodes}
              links={FLOW.links}
              format={{ kind: "integer" }}
              height={height}
              ariaLabel={tcs("Sankey diagram from acquisition channels to retention")}
            />
          )}
        />
      </Section>

      <Section
        title={tcs("Network")}
        description={tcs("Force layout with a restrained repulsion so the labels stay legible instead of collapsing.")}
      >
        <ChartPanel
          title={tcs("Research pipeline graph")}
          description={tcs("Node size is proportional to the prepared weight; hover focuses the adjacency.")}
          height={400}
          render={({ height }) => (
            <GraphChart
              nodes={NETWORK.nodes}
              links={NETWORK.links}
              groups={NETWORK.groups}
              format={{ kind: "integer" }}
              height={height}
              ariaLabel={tcs("Network graph of the research pipeline")}
            />
          )}
        />
      </Section>

      <Section title={tcs("Usage")}>
        <Code block>{`<SankeyChart nodes={nodes} links={[{ source: "A", target: "B", value: 42 }]} />

<GraphChart
  nodes={[{ id: "a", name: "Ingest", value: 12, group: "Data" }]}
  links={[{ source: "a", target: "b", value: 3 }]}
  groups={["Data", "Research"]}
  layout="force"
/>`}</Code>
      </Section>
    </DocPage>
  );
}
