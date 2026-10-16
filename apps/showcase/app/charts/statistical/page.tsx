"use client";

import {
  CalibrationChart,
  ConfusionMatrixChart,
  EcdfChart,
  ErrorBarChart,
  QqPlotChart,
  ResidualChart,
  RocCurveChart,
  Section,
  ViolinChart,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import {
  calibrationBins,
  comparisonSamples,
  confusionLabels,
  confusionMatrix,
  errorBarPoints,
  qqPoints,
  residualPoints,
  rocCurves,
  violinGroups,
} from "@/lib/chart-packs-data";
import { useI18n } from "@/lib/i18n/provider";


export default function StatisticalChartsPage() {
  const { tc, tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader eyebrow={tcs("Charts")} title="Statistical charts" lead={tc("charts.statistical.lead")} />

      <Section title={tc("charts.statistical.how.title")} description={tc("charts.statistical.how.lead")}>
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartPanel
            title={tcs("Empirical CDF")}
            description={tc("charts.statistical.ecdf")}
            height={300}
            render={({ height }) => (
              <EcdfChart
                height={height}
                ariaLabel={tcs("Empirical CDF of daily returns")}
                series={[
                  { key: "baseline", label: "Baseline", points: comparisonSamples.baseline, tone: "neutral" },
                  { key: "candidate", label: "Candidate", points: comparisonSamples.candidate, tone: "accent" },
                ]}
                xFormat={{ kind: "percent", decimals: 1 }}
              />
            )}
          />
          <ChartPanel
            title={tcs("Q–Q plot")}
            description={tc("charts.statistical.qq")}
            height={300}
            render={({ height }) => (
              <QqPlotChart height={height} ariaLabel="Normal quantile-quantile plot" points={qqPoints} />
            )}
          />
        </div>
      </Section>

      <Section title={tc("charts.statistical.shape.title")} description={tc("charts.statistical.shape.lead")}>
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartPanel
            title={tcs("Violin")}
            description={tc("charts.statistical.violin")}
            height={300}
            render={({ height }) => (
              <ViolinChart height={height} ariaLabel={tcs("Density outline per strategy")} groups={violinGroups} />
            )}
          />
          <ChartPanel
            title={tcs("Intervals")}
            description={tc("charts.statistical.intervals")}
            height={300}
            render={({ height }) => (
              <ErrorBarChart
                height={height}
                ariaLabel={tcs("Factor exposures with 95 percent intervals")}
                points={errorBarPoints}
                intervalLabel="95% CI"
                format={{ kind: "number", decimals: 2, signed: true }}
              />
            )}
          />
        </div>
        <div className="mt-5">
          <ChartPanel
            title={tcs("Residuals")}
            description={tc("charts.statistical.residual")}
            height={300}
            render={({ height }) => (
              <ResidualChart height={height} ariaLabel={tcs("Residuals against fitted values")} points={residualPoints} />
            )}
          />
        </div>
      </Section>

      <Section title={tc("charts.statistical.classifier.title")} description={tc("charts.statistical.classifier.lead")}>
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartPanel
            title={tcs("ROC")}
            description={tc("charts.statistical.roc")}
            height={300}
            render={({ height }) => (
              <RocCurveChart height={height} ariaLabel={tcs("ROC curves for two models")} curves={rocCurves} />
            )}
          />
          <ChartPanel
            title={tcs("Calibration")}
            description={tc("charts.statistical.calibration")}
            height={300}
            render={({ height }) => (
              <CalibrationChart height={height} ariaLabel="Reliability diagram" bins={calibrationBins} />
            )}
          />
        </div>
        <div className="mt-5">
          <ChartPanel
            title={tcs("Confusion matrix")}
            description={tc("charts.statistical.confusion")}
            height={320}
            render={({ height }) => (
              <ConfusionMatrixChart
                height={height}
                ariaLabel={tcs("Confusion matrix, row normalised")}
                labels={confusionLabels}
                matrix={confusionMatrix}
                normalized
              />
            )}
          />
        </div>
      </Section>
    </DocPage>
  );
}
