"use client";

import { Badge, Card, Code, Section, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { useI18n } from "@/lib/i18n/provider";

/**
 * Packaging.
 *
 * The published package is compiled: ESM plus declarations, one module per
 * source module, with a curated export map. Importing a Button must not pull a
 * chart engine, and a product must not need to transpile our source or guess at
 * a stylesheet path.
 */

const entries = [
  { subpath: "@luc/ui", what: "The whole surface, for convenience" },
  { subpath: "@luc/ui/components/button", what: "One component, one import" },
  { subpath: "@luc/ui/app-shell", what: "Shell, sidebar, breadcrumbs, page header" },
  { subpath: "@luc/ui/workspace", what: "Panes, handles, inspector" },
  { subpath: "@luc/ui/url-state", what: "Codecs and parameter sets (no React)" },
  { subpath: "@luc/ui/data-table", what: "DataTable, columns, toolbar" },
  { subpath: "@luc/ui/charts", what: "Chart chrome and families" },
  { subpath: "@luc/ui/financial-chart", what: "Lightweight Charts adapter" },
  { subpath: "@luc/ui/forms", what: "Form primitives and inputs" },
  { subpath: "@luc/ui/forms/react-hook-form", what: "Optional adapter (never auto-loaded)" },
  { subpath: "@luc/ui/datetime", what: "Calendar, pickers, formatters" },
  { subpath: "@luc/ui/styles.css", what: "Tokens, base, utilities, chart and toast CSS" },
];

/*
 * The numbers `pnpm --filter @luc/ui test:consumer` printed, transcribed.
 *
 * They are a snapshot and the section says so, because the alternative is worse:
 * this table used to carry figures from an earlier phase that had drifted to
 * roughly half the real value, which is exactly the kind of unverifiable claim a
 * documentation page must not make. Names match the consumer scenarios exactly,
 * so a reader can re-run one and compare.
 */
const MEASURED_ON = "2026-10-09";
const measurements = [
  { name: "button-only", raw: "10.9 KB", gzip: "3.6 KB" },
  { name: "date-picker", raw: "28.8 KB", gzip: "8.4 KB" },
  { name: "app-shell", raw: "30.8 KB", gzip: "9.1 KB" },
  { name: "charts", raw: "59.6 KB", gzip: "18.2 KB" },
];

export function PackagingPage({ apiSection }: { apiSection?: React.ReactNode }) {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Application")}
        title="Packaging"
        lead="A real package, not a folder of TypeScript. Compiled ESM, generated declarations, curated subpath exports, one public stylesheet, and a consumer smoke test that proves a Button import stays a Button import."
      />

      <Section
        title={tcs("Public entry points")}
        description={tcs("The export map is curated by hand so internal adapter files are never reachable, and a verification script fails the build if a declared path does not exist in dist.")}
      >
        <div className="flex flex-col gap-1.5">
          {entries.map((entry) => (
            <div
              key={entry.subpath}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-sm border border-line-subtle bg-surface-default px-3 py-2"
            >
              <code className="font-mono text-caption text-fg-primary">{entry.subpath}</code>
              <span className="text-caption text-fg-muted">{tcs(entry.what)}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title={tcs("How a product consumes it")}
        description={tcs("Two imports and one stylesheet. Tailwind is a consumer requirement, and it is stated rather than hidden: the package ships CSS-first tokens that your Tailwind build compiles.")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card variant="raised" className="flex flex-col gap-3">
            <Text variant="label">app/globals.css</Text>
            <Code block>{`@import "tailwindcss";
@import "@luc/ui/styles.css";

/* The package styles itself: Tailwind scans its compiled modules. */`}</Code>
            <Text variant="caption" tone="muted">
              {tcs("The stylesheet carries tokens, base layer, utilities, chart styles and the toast skin. There is no second CSS file to remember and no source-scanning requirement pointing into another package's TypeScript.")}</Text>
          </Card>
          <Card variant="raised" className="flex flex-col gap-3">
            <Text variant="label">a page component</Text>
            <Code block>{`import { Button } from "@luc/ui/components/button";
import { AppShell } from "@luc/ui/app-shell";
import { Workspace } from "@luc/ui/workspace";
import { useI18n } from "@/lib/i18n/provider";

// Compiles to the buttons, the shell and the panes: no ECharts,
// no Lightweight Charts, no date system.`}</Code>
            <Text variant="caption" tone="muted">
              {tcs("Declarations ship beside the code, client directives are preserved for React Server Components, and React stays a peer dependency.")}</Text>
          </Card>
        </div>
      </Section>

      <Section
        title={tcs("Measured")}
        description={tcs(
          "From the consumer smoke test: each scenario is bundled with every third-party module external, so the numbers describe LUC UI's own graph rather than React's. The figures are a snapshot taken on {date}; re-run the command to reproduce them on your machine.",
        ).replace("{date}", MEASURED_ON)}
        actions={
          <Badge size="sm" tone="neutral">
            pnpm test:consumer
          </Badge>
        }
      >
        <div className="flex flex-col gap-1.5">
          {measurements.map((row) => (
            <div
              key={row.name}
              className="flex items-baseline justify-between gap-3 rounded-sm border border-line-subtle bg-surface-default px-3 py-2"
            >
              <span className="text-label text-fg-secondary">{row.name}</span>
              <span className="luc-numeric text-caption text-fg-muted">
                {row.raw} raw · {row.gzip} gzip
              </span>
            </div>
          ))}
        </div>
        <Text variant="caption" tone="muted">
          {tcs("The assertions are the contract: a button-only bundle that contains an engine or the date library fails the test. Chart engines stay dynamically imported, so they never sit on a page that does not draw one.")}</Text>
      </Section>

      <Section
        title={tcs("Validation")}
        description={tcs("The gates run in pnpm verify, and none of them trust the repository manifest — they check the artifact that would be published.")}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Card variant="default" className="flex flex-col gap-2">
            <Text variant="label">build:package</Text>
            <Text variant="caption" tone="muted">
              {tcs("ESM plus declarations, one module per source module, then the CSS is copied and the source-scan path is re-pointed at the compiled output.")}</Text>
          </Card>
          <Card variant="default" className="flex flex-col gap-2">
            <Text variant="label">verify:package</Text>
            <Text variant="caption" tone="muted">
              {tcs("Every declared path exists in source and in dist, the two maps declare the same subpaths, publint lints the packed tarball, and the tarball contains dist and no source.")}</Text>
          </Card>
          <Card variant="default" className="flex flex-col gap-2">
            <Text variant="label">test:consumer</Text>
            <Text variant="caption" tone="muted">
              {tcs("Five entries — button, date picker, app shell, charts, barrel — bundled against the built package through the public subpaths only.")}</Text>
          </Card>
          <Card variant="default" className="flex flex-col gap-2">
            <Text variant="label">pnpm verify</Text>
            <Text variant="caption" tone="muted">
              {tcs("Typecheck, lint, unit tests, the Showcase production build, and then the package gates above. Nothing is published by any of it.")}</Text>
          </Card>
        </div>
      </Section>

      {apiSection}
    </DocPage>
  );
}
