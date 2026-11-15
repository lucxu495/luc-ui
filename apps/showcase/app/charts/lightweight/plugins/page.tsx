import Link from "next/link";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import {
  officialLightweightPlugins,
  officialPluginPackage,
} from "@/lib/charts/lightweight-plugins";

const phases = [
  { label: "01 · Core React API", copy: "Controller parity, lifecycle contracts, typed plugin adapters, series/pane/time-scale commands." },
  { label: "02 · Published upstream plugins", copy: "Nineteen independently imported official packages; each requires a working example and lifecycle test." },
  { label: "03 · Drawing & research tools", copy: "Trendlines, rectangles, volume profile, price alerts, export and persisted workspace state." },
  { label: "04 · Release gates", copy: "Desktop and mobile browser QA, accessibility, isolated consumer bundles and release-artifact review." },
] as const;

export default function LightweightPluginRoadmap() {
  return (
    <DocPage intent="wide">
      <PageHeader eyebrow="Charts · Lightweight Charts" title="Official Plugins Roadmap"
        lead="Upstream plugin inventory is separate from Luc UI implementation. All listed packages are published upstream, but none is currently wrapped as a public Luc UI plugin component." />
      <section className="space-y-3">
        <h2 className="font-display text-title-lg font-semibold">Published upstream · 尚未集成</h2>
        <p className="text-sm text-fg-secondary">
          Each plugin will get a real canvas demo and a sidebar route after implementation.
          A published TradingView package is not a shipped Luc UI component.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {officialLightweightPlugins.map((plugin) => (
            <div key={plugin.id} id={plugin.id} data-plugin-id={plugin.id} className="scroll-mt-24 rounded-lg border border-line-subtle bg-surface-raised p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-fg-primary">{plugin.name}</h3>
                <span className="rounded-md border border-line-subtle px-2 py-0.5 text-xs text-fg-muted">Not integrated · 尚未集成</span>
              </div>
              <p className="mt-2 text-xs text-fg-secondary">{plugin.family}</p>
              <code className="mt-3 block break-all text-xs text-fg-muted">{officialPluginPackage(plugin.id)}</code>
            </div>
          ))}
        </div>
        <p className="text-xs text-fg-secondary">
          Source: <a className="text-fg-accent underline" href="https://tradingview.github.io/lightweight-charts/plugin-examples/" target="_blank" rel="noopener noreferrer">TradingView Plugin Examples</a>.
          Listed packages are verified separately from earlier unpublished examples.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-title-lg font-semibold">Implementation order · 开发顺序</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {phases.map(({ label, copy }) => (
            <div key={label} className="rounded-lg border border-line-subtle p-4">
              <h3 className="font-semibold text-fg-primary">{label}</h3>
              <p className="mt-2 text-sm text-fg-secondary">{copy}</p>
            </div>
          ))}
        </div>
      </section>
      <Link className="text-sm text-fg-accent underline" href="/charts/lightweight">
        Return to live Lightweight Charts examples
      </Link>
    </DocPage>
  );
}
