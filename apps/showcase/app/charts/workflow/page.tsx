"use client";

import {
  BumpChart,
  BulletChart,
  DumbbellChart,
  GanttChart,
  LollipopChart,
  MekkoChart,
  Section,
  SlopeChart,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import {
  bumpPeriods,
  bumpSeries,
  bulletRows,
  dumbbellRows,
  ganttTasks,
  lollipopData,
  mekkoColumns,
  slopeRows,
} from "@/lib/chart-packs-data";
import { useI18n } from "@/lib/i18n/provider";


export default function WorkflowChartsPage() {
  const { tc, tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader eyebrow={tcs("Charts")} title="Workflow charts" lead={tc("charts.workflow.lead")} />

      <Section title={tc("charts.workflow.schedule.title")} description={tc("charts.workflow.schedule.lead")}>
        <ChartPanel
          title={tcs("Gantt")}
          description={tc("charts.workflow.gantt")}
          height={340}
          render={({ height }) => (
            <GanttChart
              height={height}
              ariaLabel="Daily pipeline schedule"
              tasks={ganttTasks}
              axisLabel="Scheduled"
            />
          )}
        />
      </Section>

      <Section title={tc("charts.workflow.compare.title")} description={tc("charts.workflow.compare.lead")}>
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartPanel
            title={tcs("Dumbbell")}
            description={tc("charts.workflow.dumbbell")}
            height={320}
            render={({ height }) => (
              <DumbbellChart
                height={height}
                ariaLabel={tcs("Metric start against end")}
                rows={dumbbellRows}
                labels={["Start", "End"]}
                format={{ kind: "number", decimals: 2, signed: true }}
              />
            )}
          />
          <ChartPanel
            title={tcs("Slope")}
            description={tc("charts.workflow.slope")}
            height={320}
            render={({ height }) => (
              <SlopeChart
                height={height}
                ariaLabel={tcs("Weight change between two reviews")}
                rows={slopeRows}
                periods={["Review 1", "Review 2"]}
                format={{ kind: "percent", decimals: 0 }}
              />
            )}
          />
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <ChartPanel
            title={tcs("Bullet")}
            description={tc("charts.workflow.bullet")}
            height={320}
            render={({ height }) => (
              <BulletChart
                height={height}
                ariaLabel={tcs("Operational health against targets")}
                rows={bulletRows}
                format={{ kind: "number", decimals: 0, suffix: "%" }}
              />
            )}
          />
          <ChartPanel
            title={tcs("Lollipop")}
            description={tc("charts.workflow.lollipop")}
            height={320}
            render={({ height }) => (
              <LollipopChart
                height={height}
                ariaLabel="Ranked factor scores"
                data={lollipopData}
                format={{ kind: "number", decimals: 2, signed: true }}
              />
            )}
          />
        </div>
      </Section>

      <Section title={tc("charts.workflow.rank.title")} description={tc("charts.workflow.rank.lead")}>
        <ChartPanel
          title={tcs("Bump")}
          description={tc("charts.workflow.bump")}
          height={340}
          render={({ height }) => (
            <BumpChart
              height={height}
              ariaLabel={tcs("Factor rank by quarter")}
              periods={bumpPeriods}
              series={bumpSeries}
              rankLabel="Rank"
            />
          )}
        />
        <div className="mt-5">
          <ChartPanel
            title={tcs("Mekko")}
            description={tc("charts.workflow.mekko")}
            height={320}
            render={({ height }) => (
              <MekkoChart
                height={height}
                ariaLabel={tcs("Revenue mix by channel, width weighted by size")}
                columns={mekkoColumns}
                format={{ kind: "compact", suffix: "" }}
              />
            )}
          />
        </div>
      </Section>
    </DocPage>
  );
}
