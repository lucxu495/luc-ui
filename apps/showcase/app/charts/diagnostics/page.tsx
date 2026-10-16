"use client";

import {
  AutocorrelationChart,
  FeatureImportanceChart,
  PrecisionRecallChart,
  Section,
  SurvivalCurveChart,
  Text,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { acfBand, acfPoints, featureImportances, pacfPoints, prCurves, survivalArms } from "@/lib/chart-packs-v5-data";
import { useI18n } from "@/lib/i18n/provider";


export default function DiagnosticsChartsPage() {
  const { tc, tcs } = useI18n();

  return (
    <DocPage>
      <PageHeader eyebrow={tcs("Charts")} title="Diagnostic charts" lead={tc("charts.diagnostics.lead")} />

      <Section title={tc("charts.diagnostics.time.title")} description={tc("charts.diagnostics.time.lead")}>
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartPanel
            title={tcs("Autocorrelation")}
            description={tc("charts.diagnostics.acf")}
            height={300}
            render={({ height }) => (
              <AutocorrelationChart
                height={height}
                ariaLabel={tcs("Sample autocorrelation with a significance band")}
                band={acfBand}
                bandLabel="±1.96/√n"
                series={[
                  { key: "acf", label: "ACF", kind: "acf", points: acfPoints },
                  { key: "pacf", label: "PACF", kind: "pacf", points: pacfPoints, tone: "accent" },
                ]}
              />
            )}
          />
          <ChartPanel
            title={tcs("Partial autocorrelation")}
            description={tc("charts.diagnostics.pacf")}
            height={300}
            render={({ height }) => (
              <AutocorrelationChart
                height={height}
                ariaLabel="Partial autocorrelation"
                band={acfBand}
                bandLabel="±1.96/√n"
                series={[{ key: "pacf", label: "PACF", kind: "pacf", points: pacfPoints }]}
              />
            )}
          />
        </div>
      </Section>

      <Section title={tc("charts.diagnostics.survival.title")} description={tc("charts.diagnostics.survival.lead")}>
        <ChartPanel
          title={tcs("Survival curves")}
          description={tc("charts.diagnostics.survival.note")}
          height={320}
          render={({ height }) => (
            <SurvivalCurveChart
              height={height}
              ariaLabel={tcs("Survival estimates for two arms")}
              xFormat={{ kind: "number", decimals: 0 }}
              series={survivalArms}
            />
          )}
        />
      </Section>

      <Section title={tc("charts.diagnostics.ranking.title")} description={tc("charts.diagnostics.ranking.lead")}>
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartPanel
            title={tcs("Precision–recall")}
            description={tc("charts.diagnostics.pr")}
            height={300}
            render={({ height }) => (
              <PrecisionRecallChart
                height={height}
                ariaLabel={tcs("Precision–recall curves for two models")}
                curves={prCurves}
                baseline={0.12}
              />
            )}
          />
          <ChartPanel
            title={tcs("Feature importance")}
            description={tc("charts.diagnostics.importance")}
            height={300}
            render={({ height }) => (
              <FeatureImportanceChart
                height={height}
                ariaLabel={tcs("Signed feature importances with intervals")}
                features={featureImportances}
                intervalLabel="90% CI"
                signed
                format={{ kind: "number", decimals: 2 }}
              />
            )}
          />
        </div>
      </Section>

      <Section title={tc("charts.diagnostics.rule.title")} description={tc("charts.diagnostics.rule.lead")}>
        <Text variant="caption" tone="muted">
          {tc("charts.diagnostics.rule.body")}
        </Text>
      </Section>
    </DocPage>
  );
}
