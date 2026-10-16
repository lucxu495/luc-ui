/**
 * @luc/ui consumer smoke test.
 *
 * A real consumer does not import source files: it imports `@luc/ui/…` and lets
 * its bundler decide what to include. This script simulates that — a clean
 * entry file per scenario, bundled with Vite against the *built* package, with
 * every third-party module marked external so the numbers describe LUC UI's own
 * graph rather than React's.
 *
 * The assertions are the ones the packaging brief asks for:
 *   - Button-only must not pull ECharts, Lightweight Charts or the date system;
 *   - DatePicker must not pull a chart engine;
 *   - the full application shell must not pull a chart engine either;
   - the TradingView integration must stay out of every other entry point, and
     must only reach the provider through the loader's dynamic import.
 */

import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgDir = path.resolve(here, "..");
const distDir = path.join(pkgDir, "dist");
const baselinePath = path.join(pkgDir, "bundle-baseline.json");

/**
 * Bundle budget.
 *
 * Per-entry baselines, not one global number: the whole point of the subpath
 * split is that a button-only consumer does not pay for a chart engine. A
 * regression fails only when it is *meaningful* — 8% or 1 KB over the recorded
 * size, whichever is larger — so a refactor that moves a few hundred bytes does
 * not turn the build red.
 */
const TOLERANCE_RELATIVE = 0.08;
const TOLERANCE_ABSOLUTE = 1024;
const updateBaseline = process.env.LUC_UPDATE_BASELINE === "1";

const scenarios = [
  {
    name: "button-only",
    imports: [
      'import { Button } from "@luc/ui/components/button";',
      'export const ui = Button;',
    ],
    // A button-only consumer must not even carry the integration's strings: the
    // provider hosts are the marker that the TradingView entry leaked in.
    forbidden: [
      "echarts",
      "lightweight-charts",
      "react-aria-components",
      "@internationalized",
      "tradingview-widget.com",
      "s3.tradingview.com",
    ],
  },
  {
    name: "date-picker",
    imports: [
      'import { DatePicker } from "@luc/ui/date-picker";',
      'import { Calendar } from "@luc/ui/calendar";',
      "export const ui = [DatePicker, Calendar];",
    ],
    forbidden: ["echarts", "lightweight-charts", "tradingview-widget.com", "s3.tradingview.com"],
  },
  {
    name: "app-shell",
    imports: [
      'import { AppShell, Sidebar, SidebarItem } from "@luc/ui/app-shell";',
      'import { Workspace, WorkspacePane } from "@luc/ui/workspace";',
      "export const ui = [AppShell, Sidebar, SidebarItem, Workspace, WorkspacePane];",
    ],
    forbidden: [
      "echarts",
      "lightweight-charts",
      "react-aria-components",
      "@internationalized",
      "tradingview-widget.com",
      "s3.tradingview.com",
    ],
  },
  {
    name: "tradingview",
    imports: [
      'import { TradingViewMiniChart, TradingViewAdvancedChart, TRADINGVIEW_CATALOG } from "@luc/ui/tradingview";',
      "export const ui = [TradingViewMiniChart, TradingViewAdvancedChart, TRADINGVIEW_CATALOG];",
      "export const state = TRADINGVIEW_CATALOG.length;",
    ],
    /*
     * The wrappers are adapters. They must not pull a chart engine or the date
     * system, and they must not *eagerly* fetch a provider script — the only
     * provider reference allowed in the graph is the loader's dynamic import,
     * which runs when a wrapper renders.
     */
    forbidden: ["echarts", "lightweight-charts", "react-aria-components", "@internationalized"],
    eagerProviderImport: true,
  },
  {
    name: "charts",
    imports: [
      'import { Chart, ChartSyncGroup } from "@luc/ui/charts";',
      "export const ui = [Chart, ChartSyncGroup];",
    ],
    forbidden: [],
  },
  {
    name: "slider",
    imports: [
      'import { Slider, RangeSlider } from "@luc/ui/slider";',
      "export const ui = [Slider, RangeSlider];",
    ],
    // A continuous numeric control must not drag a chart engine, the date
    // system or a third-party widget loader along with it.
    forbidden: [
      "echarts",
      "lightweight-charts",
      "react-aria-components",
      "@internationalized",
      "tradingview-widget.com",
      "s3.tradingview.com",
    ],
  },
  {
    name: "menus",
    imports: [
      'import { DropdownMenu, DropdownMenuItem } from "@luc/ui/dropdown-menu";',
      'import { ContextMenu, ContextMenuItem } from "@luc/ui/context-menu";',
      "export const ui = [DropdownMenu, DropdownMenuItem, ContextMenu, ContextMenuItem];",
    ],
    forbidden: ["echarts", "lightweight-charts", "react-aria-components", "@internationalized", "tradingview-widget.com"],
  },
  {
    name: "surfaces",
    imports: [
      'import { Alert, Callout } from "@luc/ui/alert";',
      'import { EmptyState } from "@luc/ui/empty-state";',
      "export const ui = [Alert, Callout, EmptyState];",
    ],
    forbidden: ["echarts", "lightweight-charts", "react-aria-components", "@internationalized", "tradingview-widget.com"],
  },
  {
    /*
     * V3.0 adds six spatial primitives to `@luc/ui/motion`. A consumer that
     * wants one of them must not pay for the whole motion vocabulary, and must
     * certainly not reach a chart engine or a provider through the motion entry.
     */
    name: "motion-spatial",
    imports: [
      'import { ParallaxScene, ParallaxLayer } from "@luc/ui/motion";',
      "export const ui = [ParallaxScene, ParallaxLayer];",
    ],
    forbidden: [
      "echarts",
      "lightweight-charts",
      "react-aria-components",
      "@internationalized",
      "tradingview-widget.com",
    ],
  },
  {
    name: "barrel",
    imports: ['import { Button, toast, Field } from "@luc/ui";', "export const ui = [Button, toast, Field];"],
    forbidden: [],
  },
  {
    /*
     * Phase 4 added seventeen component families to the root barrel. A consumer
     * of the *root* entry must still pay only for the symbols it names — that is
     * the whole point of a barrel with a side-effect-free graph, and the reason
     * the P0/P1 wave needed no new subpath.
     */
    name: "components-v4",
    imports: [
      'import { Accordion, AccordionItem, Avatar, AvatarGroup, Carousel, CarouselTrack, Pagination, Toggle, ToggleGroup, Timeline, ScrollArea } from "@luc/ui";',
      "export const ui = [Accordion, AccordionItem, Avatar, AvatarGroup, Carousel, CarouselTrack, Pagination, Toggle, ToggleGroup, Timeline, ScrollArea];",
    ],
    forbidden: [
      "echarts",
      "lightweight-charts",
      "react-aria-components",
      "@internationalized",
      "tradingview-widget.com",
    ],
  },
  {
    /*
     * A statistical chart must not drag the financial engine in, and it must not
     * pull the date system or a provider script. This is the measurement the
     * Phase 4 brief asked for by name, and it is the one that would have caught
     * a stray static import of `lightweight-charts` from a shared helper.
     */
    name: "charts-statistical",
    imports: [
      'import { EcdfChart, ErrorBarChart, ConfusionMatrixChart, ViolinChart } from "@luc/ui/charts";',
      "export const ui = [EcdfChart, ErrorBarChart, ConfusionMatrixChart, ViolinChart];",
    ],
    forbidden: ["lightweight-charts", "react-aria-components", "@internationalized", "tradingview-widget.com"],
  },
  {
    /*
     * The ECharts candlestick is a different engine from
     * `@luc/ui/financial-chart`, and a consumer of the former must not pay for
     * the latter. The financial entry keeps its own scenario below.
     */
    name: "charts-financial",
    imports: [
      'import { CandlestickChart, DrawdownChart, VolatilitySmileChart, FactorExposureChart } from "@luc/ui/charts";',
      "export const ui = [CandlestickChart, DrawdownChart, VolatilitySmileChart, FactorExposureChart];",
    ],
    forbidden: ["lightweight-charts", "react-aria-components", "@internationalized", "tradingview-widget.com"],
  },
  {
    /* The Lightweight Charts surface, measured separately from the ECharts pack. */
    name: "financial-engine",
    imports: [
      'import { FinancialChart } from "@luc/ui/financial-chart";',
      "export const ui = FinancialChart;",
    ],
    forbidden: ["echarts", "react-aria-components", "@internationalized", "tradingview-widget.com"],
  },
  {
    name: "forms-core",
    imports: [
      'import { Field, Form, FormErrorSummary, InputGroup, InputGroupAddon } from "@luc/ui/forms";',
      'import { Input } from "@luc/ui/components/input";',
      "export const ui = [Field, Form, FormErrorSummary, InputGroup, InputGroupAddon, Input];",
    ],
    forbidden: ["echarts", "lightweight-charts", "tradingview-widget.com", "s3.tradingview.com"],
  },
  {
    name: "data-table-only",
    imports: [
      'import { DataTable, textColumn, numericColumn } from "@luc/ui/data-table";',
      "export const ui = [DataTable, textColumn, numericColumn];",
    ],
    forbidden: ["echarts", "lightweight-charts", "tradingview-widget.com", "react-aria-components"],
  },
  {
    /*
     * Phase 8's `@luc/ui/experiences` entry.
     *
     * Page-level assemblies are exactly the kind of module that quietly acquires
     * a heavy dependency — a chart for a project card, a date library for a
     * timeline — so the same isolation contract the primitives have is asserted
     * here: no engine, no date system, no provider script.
     */
    name: "experiences",
    imports: [
      'import { ProfileHero, SocialLinks, ExperienceTimeline, ProjectShowcase, PublicationList, ReadingShelf, NowSection } from "@luc/ui/experiences";',
      "export const ui = [ProfileHero, SocialLinks, ExperienceTimeline, ProjectShowcase, PublicationList, ReadingShelf, NowSection];",
    ],
    forbidden: [
      "echarts",
      "lightweight-charts",
      "react-aria-components",
      "@internationalized",
      "tradingview-widget.com",
      "s3.tradingview.com",
    ],
  },
];

/** Resolve `@luc/ui[/subpath]` straight into the built package, nothing else. */
function lucResolver() {
  return {
    name: "luc-ui-resolver",
    enforce: "pre",
    resolveId(source) {
      if (source === "@luc/ui") return path.join(distDir, "index.js");
      if (source === "@luc/ui/styles.css") return path.join(distDir, "styles/index.css");
      if (source.startsWith("@luc/ui/")) {
        const sub = source.slice("@luc/ui/".length);
        return path.join(distDir, `${sub}.js`);
      }
      return null;
    },
  };
}

const root = await mkdtemp(path.join(tmpdir(), "luc-ui-consumer-"));
const results = [];
const failures = [];

try {
  for (const scenario of scenarios) {
    const dir = path.join(root, scenario.name);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "entry.js"), `${scenario.imports.join("\n")}\n`, "utf8");

    await build({
      root: dir,
      logLevel: "silent",
      plugins: [lucResolver()],
      build: {
        outDir: path.join(dir, "out"),
        emptyOutDir: true,
        minify: true,
        lib: { entry: path.join(dir, "entry.js"), formats: ["es"], fileName: "bundle" },
        rollupOptions: {
          external: (id) => !id.startsWith("@luc/ui") && !id.startsWith(distDir) && !id.startsWith("."),
        },
      },
    });

    const outDir = path.join(dir, "out");
    const emitted = (await readdir(outDir)).find((file) => /\.m?js$/.test(file));
    if (!emitted) throw new Error(`${scenario.name}: vite emitted no bundle in ${outDir}`);
    const bundle = await readFile(path.join(outDir, emitted), "utf8");
    const raw = Buffer.byteLength(bundle);
    const gzip = gzipSync(bundle).length;
    results.push({ name: scenario.name, raw, gzip, bundle });

    for (const forbidden of scenario.forbidden) {
      if (bundle.includes(forbidden)) {
        failures.push(`${scenario.name} pulls ${forbidden}`);
      }
    }
    if (scenario.eagerProviderImport && /(?:from|import)\s*\(?\s*["']https:\/\/[^"']*tradingview/.test(bundle)) {
      failures.push(`${scenario.name} eagerly imports a provider script`);
    }
  }
} finally {
  await rm(root, { recursive: true, force: true });
}

console.log("LUC UI — consumer tree-shaking");
for (const result of results) {
  console.log(
    `  ${result.name.padEnd(12)} ${(result.raw / 1024).toFixed(1).padStart(7)} KB raw` +
      `  ${(result.gzip / 1024).toFixed(1).padStart(6)} KB gzip`,
  );
}

// ---------------------------------------------------------------- baseline
const measured = Object.fromEntries(
  results.map((result) => [result.name, { raw: result.raw, gzip: result.gzip }]),
);

let previous = null;
try {
  previous = JSON.parse(await readFile(baselinePath, "utf8"));
} catch {
  previous = null;
}

if (updateBaseline || !previous) {
  await writeFile(
    baselinePath,
    `${JSON.stringify({ tolerance: TOLERANCE_RELATIVE, entries: measured }, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `  ${previous ? "updated" : "wrote"} bundle baseline (${Object.keys(measured).length} entries) at ${
      path.relative(pkgDir, baselinePath)
    }`,
  );
} else {
  const budgets = previous.entries ?? {};
  for (const [name, size] of Object.entries(measured)) {
    const budget = budgets[name];
    if (!budget) {
      failures.push(`${name} is a new entry point with no baseline — run with LUC_UPDATE_BASELINE=1`);
      continue;
    }
    const allowance = Math.max(budget.raw * TOLERANCE_RELATIVE, TOLERANCE_ABSOLUTE);
    if (size.raw > budget.raw + allowance) {
      failures.push(
        `${name} grew from ${(budget.raw / 1024).toFixed(1)} KB to ${(size.raw / 1024).toFixed(1)} KB ` +
          `(budget ${(budget.raw / 1024).toFixed(1)} KB + ${(allowance / 1024).toFixed(1)} KB)`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error(`\n  ${failures.length} tree-shaking problem(s):`);
  for (const failure of failures) console.error(`   ✗ ${failure}`);
  process.exitCode = 1;
} else {
  console.log("  ✓ subpath imports stay isolated");
}
