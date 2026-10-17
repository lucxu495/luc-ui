/*
 * Installation.
 *
 * Two verified distribution modes and the two framework recipes that the clean
 * consumer gate exercises. Commands and versions come from
 * `lib/docs/install.ts`, which is the only place they are written in the
 * Showcase.
 */

import type { Metadata } from "next";
import { Card, Heading, Inline, Stack, Text, Badge } from "@luc/ui";
import { CopyButton } from "@/components/docs/copy-button";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import {
  DISTRIBUTION_MODES,
  PACKAGE_MANAGERS,
  PEER_REQUIREMENTS,
  distributionSpec,
  installCommand,
  setupSnippets,
  type DistributionMode,
} from "@/lib/docs/install";
import { getServerCopy } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Installation — Luc UI",
  description: "Install @luc/ui, import its styles and mount one provider.",
};

const MODES: readonly DistributionMode[] = ["git", "tarball"];

function CodeSample({ title, description, code }: { title: string; description: string; code: string }) {
  return (
    <Card className="gap-2 p-4">
      <Heading size="title" as="h3">
        {title}
      </Heading>
      <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
        {description}
      </Text>
      <div className="relative rounded-sm border border-line-subtle bg-surface-sunken">
        <div className="absolute top-1.5 right-1.5">
          <CopyButton value={code} label={title} />
        </div>
        <pre
          tabIndex={0}
          className="luc-table-scroll overflow-x-auto px-3 py-2.5 font-mono text-caption leading-[1.7] text-fg-secondary"
        >
          <code>{code}</code>
        </pre>
      </div>
    </Card>
  );
}

export default async function InstallationPage() {
  const { tcs } = await getServerCopy();

  return (
    <DocPage intent="reading">
      <PageHeader
        eyebrow={tcs("Documentation")}
        title={tcs("Installation")}
        lead={tcs(
          "Install the built package from its public Git tag, set up Tailwind v4, then mount one provider. The Vite and Next.js recipes below are both verified in clean consumer projects.",
        )}
      />

      {MODES.map((mode) => {
        const info = DISTRIBUTION_MODES[mode];
        return (
          <Stack gap="md" key={mode}>
            <Heading size="title" as="h2" id={`mode-${mode}`}>
              {tcs(info.label)}
            </Heading>
            <Inline gap="sm" align="center" wrap>
              <Badge tone={info.available ? "positive" : "warning"} size="sm">
                {info.available ? tcs("Works today") : tcs("Not published yet")}
              </Badge>
            </Inline>
            <Text variant="body" tone="muted" as="p" className="max-w-[68ch]">
              {tcs(info.note)}
            </Text>
            <div className="flex flex-col gap-2">
              {PACKAGE_MANAGERS.map((manager) => {
                const command = installCommand(manager, distributionSpec(mode));
                return (
                  <div
                    key={manager}
                    className="flex items-center justify-between gap-3 rounded-sm border border-line-subtle bg-surface-sunken px-3 py-2"
                  >
                    <code className="font-mono text-caption text-fg-secondary">{command}</code>
                    <CopyButton value={command} label={manager} />
                  </div>
                );
              })}
            </div>
          </Stack>
        );
      })}

      <Stack gap="md">
        <Heading size="title" as="h2" id="setup">
          {tcs("Core setup")}
        </Heading>
        {setupSnippets("git").map((snippet) => (
          <CodeSample key={snippet.title} title={tcs(snippet.title)} description={tcs(snippet.description)} code={snippet.code} />
        ))}
      </Stack>

      <Stack gap="md">
        <Heading size="title" as="h2" id="vite">
          {tcs("React + Vite")}
        </Heading>
        <CodeSample
          title={tcs("Install Tailwind v4")}
          description={tcs("The Luc UI stylesheet is Tailwind CSS v4 source, so the consumer compiles it with the Vite plugin.")}
          code={'npm install -D tailwindcss@4 @tailwindcss/vite@4\n\n// vite.config.ts\nimport tailwindcss from "@tailwindcss/vite";\nimport react from "@vitejs/plugin-react";\nimport { defineConfig } from "vite";\n\nexport default defineConfig({ plugins: [react(), tailwindcss()] });'}
        />
        <CodeSample
          title={tcs("Render a component")}
          description={tcs("Import from the public package entry and wrap the application in LucProvider.")}
          code={'import { LucProvider, Button } from "@luc/ui";\n\nexport function App() {\n  return (\n    <LucProvider defaultTheme="dark">\n      <Button>Save view</Button>\n    </LucProvider>\n  );\n}'}
        />
      </Stack>

      <Stack gap="md">
        <Heading size="title" as="h2" id="nextjs">
          {tcs("Next.js App Router")}
        </Heading>
        <CodeSample
          title={tcs("Install the PostCSS adapter")}
          description={tcs("Next.js compiles the same Tailwind v4 stylesheet through its PostCSS pipeline.")}
          code={'npm install -D tailwindcss@4 @tailwindcss/postcss@4\n\n// postcss.config.mjs\nexport default { plugins: { "@tailwindcss/postcss": {} } };'}
        />
        <CodeSample
          title={tcs("Root layout")}
          description={tcs("Import global CSS once, run the theme init script before paint, and keep LucProvider as the client boundary.")}
          code={'import { LucProvider, lucThemeInitScript } from "@luc/ui";\nimport "./globals.css";\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en" suppressHydrationWarning>\n      <head>\n        <script dangerouslySetInnerHTML={{ __html: lucThemeInitScript({ defaultTheme: "dark" }) }} />\n      </head>\n      <body><LucProvider defaultTheme="dark">{children}</LucProvider></body>\n    </html>\n  );\n}'}
        />
      </Stack>

      <Stack gap="md">
        <Heading size="title" as="h2" id="charts">
          {tcs("Charts")}
        </Heading>
        <CodeSample
          title={tcs("Prepared series")}
          description={tcs("Charts receive data you prepared. The component supplies a height; use a client boundary in Next.js.")}
          code={'"use client";\nimport { LineChart } from "@luc/ui/charts";\n\nconst rows = [\n  { date: "2026-08-01", close: 94.2 },\n  { date: "2026-08-08", close: 95.1 },\n  { date: "2026-08-15", close: 96.4 },\n];\n\nexport function PriceChart() {\n  return (\n    <LineChart\n      data={rows}\n      xKey="date"\n      series={[{ key: "close", label: "Close", type: "line" }]}\n      height={240}\n      ariaLabel="Weekly closes"\n    />\n  );\n}'}
        />
      </Stack>

      <Stack gap="md">
        <Heading size="title" as="h2" id="tradingview">
          {tcs("TradingView")}
        </Heading>
        <CodeSample
          title={tcs("Provider widget")}
          description={tcs("The TradingView subpath loads a third-party provider widget. Market data and attribution belong to TradingView, not Luc UI.")}
          code={'"use client";\nimport { TradingViewMiniChart } from "@luc/ui/tradingview";\n\nexport function MarketCard() {\n  return <TradingViewMiniChart symbol="NASDAQ:AAPL" height={180} />;\n}'}
        />
      </Stack>

      <Stack gap="md">
        <Heading size="title" as="h2" id="troubleshooting">
          {tcs("Troubleshooting")}
        </Heading>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-body text-fg-secondary">
          <li>{tcs('If utilities are missing, confirm Tailwind v4 is configured and @luc/ui/styles.css is imported after @import "tailwindcss".')}</li>
          <li>{tcs("If an import fails, use a documented package subpath; do not import from src or dist.")}</li>
          <li>{tcs("If a chart has no width, give it a width-bearing parent; a chart needs a layout box even when height is set.")}</li>
          <li>{tcs("If a TradingView widget is unavailable, check the wrapper fallback and the network boundary before changing the page.")}</li>
        </ul>
      </Stack>

      <Stack gap="md">
        <Heading size="title" as="h2" id="requirements">
          {tcs("Requirements")}
        </Heading>
        <ul className="flex flex-col gap-1">
          {PEER_REQUIREMENTS.map((requirement) => (
            <li key={requirement} className="text-caption text-fg-muted">
              <code className="font-mono">{requirement}</code>
            </li>
          ))}
        </ul>
        <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
          {tcs(
            "Components are imported from their own subpath, which is what keeps a chart engine out of a bundle that only needed a button.",
          )}
        </Text>
      </Stack>
    </DocPage>
  );
}
