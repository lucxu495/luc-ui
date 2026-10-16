"use client";

import { ChordChart, DendrogramChart, Section, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { chordLabels, chordMatrix, dendrogramLeaves, dendrogramMerges } from "@/lib/chart-packs-v5-data";
import { useI18n } from "@/lib/i18n/provider";


export default function NetworkChartsPage() {
  const { tc, tcs } = useI18n();

  return (
    <DocPage>
      <PageHeader eyebrow={tcs("Charts")} title="Network and hierarchy charts" lead={tc("charts.networks.lead")} />

      <Section title={tc("charts.networks.chord.title")} description={tc("charts.networks.chord.lead")}>
        <ChartPanel
          title={tcs("Chord diagram")}
          description={tc("charts.networks.chord.note")}
          height={440}
          render={({ height }) => (
            <ChordChart
              height={height}
              ariaLabel={tcs("Cross-holdings between five asset classes")}
              labels={chordLabels}
              values={chordMatrix}
            />
          )}
        />
      </Section>

      <Section title={tc("charts.networks.dendrogram.title")} description={tc("charts.networks.dendrogram.lead")}>
        <ChartPanel
          title={tcs("Dendrogram")}
          description={tc("charts.networks.dendrogram.note")}
          height={340}
          render={({ height }) => (
            <DendrogramChart
              height={height}
              ariaLabel={tcs("Hierarchical clustering of six factors")}
              leaves={dendrogramLeaves}
              merges={dendrogramMerges}
              format={{ kind: "number", decimals: 2 }}
            />
          )}
        />
      </Section>

      <Section title={tc("charts.networks.rule.title")} description={tc("charts.networks.rule.lead")}>
        <Text variant="caption" tone="muted">
          {tc("charts.networks.rule.body")}
        </Text>
      </Section>
    </DocPage>
  );
}
