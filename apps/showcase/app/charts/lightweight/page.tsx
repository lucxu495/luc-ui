import Link from "next/link";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { lightweightExamples } from "@/lib/charts/lightweight-examples";

const future = [
  ["Published upstream plugin integrations", "Not wrapped yet"],
  ["Markers, watermark & session shading adapters", "Planned"],
  ["Trendline, rectangle & volume profile tools", "Planned"],
  ["Saved layouts, persistent drawings & undo", "Planned"],
] as const;

export default function LightweightGallery() {
  return (
    <DocPage intent="wide">
      <PageHeader eyebrow="Charts · TradingView engine" title="Lightweight Charts Gallery"
        lead="Every listed live example uses Luc UI's actual FinancialChart implementation. Native engine primitives and existing ECharts quantitative charts live in separate categories." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {lightweightExamples.map(({ id, title, zh, description }) => (
          <Link key={id} href={`/charts/lightweight/${id}`}
            className="rounded-xl border border-line-subtle bg-surface-raised p-5 transition-colors hover:border-fg-accent focus-visible:outline-2 focus-visible:outline-fg-accent">
            <p className="font-semibold text-fg-primary">{title}</p>
            <p className="mt-1 text-sm text-fg-secondary">{zh}</p>
            <p className="mt-3 text-sm text-fg-muted">{description}</p>
            <p className="mt-4 text-xs text-fg-accent">Live example · 已实现</p>
          </Link>
        ))}
      </div>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-title-lg font-semibold">Roadmap · 后续扩展</h2>
          <Link className="text-sm text-fg-accent underline" href="/charts/lightweight/plugins">
            Official Plugins Roadmap · 19 packages
          </Link>
        </div>
        <p className="text-sm text-fg-secondary">
          These are not released components. They will receive individual working example routes
          only after implementation and verification. 目前尚未封装，不会以静态假图冒充演示。
        </p>
        <div className="grid gap-2">
          {future.map(([name, status]) => (
            <div key={name} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line-subtle px-4 py-3">
              <span className="text-sm text-fg-primary">{name}</span>
              <span className="text-xs text-fg-muted">{status}</span>
            </div>
          ))}
        </div>
        <Link className="text-sm text-fg-accent underline" href="/charts/financial">
          Financial & quantitative — existing chart overview
        </Link>
      </section>
    </DocPage>
  );
}
