import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { LightweightLiveExample } from "@/components/charts/lightweight-live-example";
import { lightweightExample, lightweightExampleIds } from "@/lib/charts/lightweight-examples";

const exampleCode: Record<string, string> = {
  candles: `import { FinancialChart } from "@luc/ui/financial-chart";

<FinancialChart
  candles={preparedOhlc}
  volume={preparedVolume}
  showVolume
  overlays={preparedSmaOverlays}
  height={440}
/>`,
  line: `import { FinancialChart } from "@luc/ui/financial-chart";

<FinancialChart
  series={[{ id: "close", kind: "line", data: preparedClose }]}
  height={440}
/>`,
  area: `import { FinancialChart } from "@luc/ui/financial-chart";

<FinancialChart
  series={[{ id: "area", kind: "area", data: preparedClose }]}
  height={440}
/>`,
  comparison: `import { FinancialChart } from "@luc/ui/financial-chart";

<FinancialChart
  series={[preparedPortfolio, preparedBenchmark]}
  height={440}
/>`,
  panes: `import { FinancialChart } from "@luc/ui/financial-chart";

<FinancialChart
  candles={preparedOhlc}
  volume={preparedVolume}
  showVolume
  indicators={[preparedVolatilityPane]}
  height={440}
/>`,
  sharpe: `import { FinancialChart } from "@luc/ui/financial-chart";

// Compute Sharpe outside Luc UI; pass time/value rows.
<FinancialChart
  series={[preparedCloseSeries, preparedBenchmarkSeries]}
  indicators={[preparedSharpePane]}
  height={440}
/>`,
};

export const dynamicParams = false;

export function generateStaticParams() {
  return lightweightExampleIds.map((example) => ({ example }));
}

export async function generateMetadata({ params }: { params: Promise<{ example: string }> }): Promise<Metadata> {
  const { example } = await params;
  const entry = lightweightExample(example);
  return entry ? { title: `${entry.title} — Luc UI`, description: entry.description } : {};
}

export default async function LightweightExamplePage({ params }: { params: Promise<{ example: string }> }) {
  const { example } = await params;
  const entry = lightweightExample(example);
  if (!entry) return notFound();
  return (
    <DocPage intent="wide">
      <PageHeader eyebrow="Charts · Lightweight Charts" title={entry.title} lead={entry.description} />
      <p className="text-sm text-fg-muted">
        {entry.zh} · Real canvas / prepared synthetic data · React API: <code>@luc/ui/financial-chart</code>
      </p>
      <LightweightLiveExample example={entry.id} />
      <section className="space-y-3">
        <h2 className="font-display text-title-lg font-semibold">React API · 使用示例</h2>
        <p className="text-sm text-fg-secondary">
          Data arrays are prepared by the caller; Luc UI renders the values without computing indicators.
        </p>
        <pre className="overflow-x-auto rounded-xl border border-line-subtle bg-surface-raised p-4 text-xs leading-relaxed text-fg-secondary">
          <code>{exampleCode[entry.id]}</code>
        </pre>
      </section>
      <div className="flex flex-wrap gap-5 text-sm">
        <Link className="text-fg-accent underline" href="/charts/lightweight">All Lightweight Charts examples</Link>
        <Link className="text-fg-accent underline" href="/charts/financial">Financial & quantitative overview</Link>
      </div>
    </DocPage>
  );
}
