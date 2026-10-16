/**
 * External consumer capture — the independent fixture.
 *
 * Everything else in this repository proves LUC UI *renders*. This script
 * proves a different thing: that a project which has never seen the monorepo
 * can install the packed tarball, render a page with it, hydrate it in a real
 * browser, and **capture** it to a PNG and a PDF — which is the whole of the
 * contract `luc-render` needs from the library side.
 *
 * The fixture is genuinely external:
 *
 *   - it lives in a `mkdtemp` directory outside the workspace;
 *   - it installs the tarball with `npm`, not `pnpm`, so the workspace's
 *     resolution rules play no part;
 *   - it imports only public subpaths (`@luc/ui`, `@luc/ui/charts`,
 *     `@luc/ui/data-table`, `@luc/ui/motion`) — no `src/`, no Showcase file, no
 *     internal adapter — and it is built by Vite, not by the repository's
 *     toolchain;
 *   - the browser is launched from this workspace only because that is where
 *     the Playwright download lives; nothing from the workspace is bundled.
 *
 * What it asserts, and why each assertion is the one that matters:
 *
 *   1. **SSR.** The shell renders to HTML on the server with no DOM.
 *   2. **Hydration.** The page reports ready from an effect, so the number is
 *      an application fact rather than a timer, and no console error is
 *      tolerated.
 *   3. **Vector output.** A chart configured for capture emits real `<svg>`
 *      `<path>` elements with non-empty geometry. This is the difference
 *      between a PDF that stays sharp and one that is a picture of a picture.
 *   4. **Raster output still works.** The same chart without the vector
 *      renderer paints to a canvas whose pixels are not uniform — "non-blank"
 *      measured from the actual canvas, not inferred from a file size.
 *   5. **Reduced motion is honoured.** With `reducedMotion: "reduce"`, a motion
 *      component is at its settled transform, so a capture cannot catch it
 *      mid-flight.
 *   6. **Fixed-size capture.** The PNG is a screenshot of a fixed box at
 *      `deviceScaleFactor: 2`, and its IHDR says so.
 *   7. **PDF output.** A PDF is produced, and the pages that contain the charts
 *      are materially larger than the same pages with the charts hidden —
 *      which is the evidence that the visual content reached the file rather
 *      than the file merely being valid.
 *
 *   node apps/showcase/scripts/consumer-capture.mjs
 *   LUC_KEEP_CAPTURE_FIXTURE=1 node apps/showcase/scripts/consumer-capture.mjs
 */

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

import { chromium } from "@playwright/test";

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const showcaseRoot = path.resolve(here, "..");
const packageRoot = path.resolve(showcaseRoot, "../../packages/ui");
/** Evidence lands beside the rest of the QA artifacts: `luc-ui/artifacts/`. */
const artifactsDir = path.resolve(showcaseRoot, "../../artifacts/consumer-capture");

const { ensurePack } = await import(pathToFileURL(path.join(packageRoot, "scripts/lib/pack.mjs")).href);

/* ------------------------------------------------------------------ fixture */

const APP_FILES = {
  "package.json": JSON.stringify(
    { name: "luc-ui-external-capture", private: true, type: "module" },
    null,
    2,
  ),
  "style.css": '@import "tailwindcss";\n@import "@luc/ui/styles.css";\n',
  "app.jsx": `
import { Card, Heading, Metric, MetricValue, Text } from "@luc/ui";
import { Reveal } from "@luc/ui/motion";
import { DataTable } from "@luc/ui/data-table";

const ROWS = [
  { id: "r1", strategy: "Momentum", sharpe: 1.42, trades: 318 },
  { id: "r2", strategy: "Carry", sharpe: 0.96, trades: 142 },
  { id: "r3", strategy: "Mean reversion", sharpe: 1.18, trades: 507 },
];

const COLUMNS = [
  { accessorKey: "strategy", header: "Strategy" },
  { accessorKey: "sharpe", header: "Sharpe" },
  { accessorKey: "trades", header: "Trades" },
];

/** The document shell: everything that does not need a browser. */
export function Shell() {
  return (
    <main id="capture" className="mx-auto flex w-[1080px] flex-col gap-6 bg-surface-default p-8">
      <Heading as="h1" size="display-sm">LUC UI external capture</Heading>
      <Text variant="body" tone="secondary">
        Rendered by an independent consumer from the packed tarball. The chart is mounted by the
        client bundle into the box below, exactly as a capture pipeline mounts a visual.
      </Text>
      <div className="grid grid-cols-3 gap-4">
        <Card variant="outline" className="p-4">
          <Metric label="Sharpe"><MetricValue value={1.42} /></Metric>
        </Card>
        <Card variant="outline" className="p-4">
          <Metric label="Trades"><MetricValue value={318} /></Metric>
        </Card>
        <Card variant="outline" className="p-4">
          <Metric label="Drawdown"><MetricValue value={-0.083} /></Metric>
        </Card>
      </div>
      <Reveal immediate data-testid="reveal">
        <MetricValue value={1234.5} kind="currency" currency="USD" />
      </Reveal>
      <DataTable data={ROWS} columns={COLUMNS} getRowId={(row) => row.id} ariaLabel="Runs" />
      <div id="charts" className="flex flex-col gap-6">
        <div data-chart="vector" style={{ height: 320, width: "100%" }} />
        <div data-chart="raster" style={{ height: 320, width: "100%" }} />
      </div>
    </main>
  );
}
`,
  "server.jsx": `
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync } from "node:fs";
import { Shell } from "./app.jsx";

const html = renderToStaticMarkup(<Shell />);
writeFileSync(
  "index.html",
  \`<!doctype html><html lang="en"><head><meta charset="utf-8" />
<link rel="stylesheet" href="/out.css" />
<title>LUC UI external capture</title></head>
<body class="bg-surface-default"><div id="root">\${html}</div>
<script type="module" src="/client.js"></script></body></html>\`,
);
console.log("ssr-ok");
`,
  "client.jsx": `
import { StrictMode, useEffect, useState } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { Chart, staticChartSpec } from "@luc/ui/charts";
import { Shell } from "./app.jsx";

const DATA = [
  { t: 1, close: 100 },
  { t: 2, close: 104 },
  { t: 3, close: 101 },
  { t: 4, close: 109 },
  { t: 5, close: 113 },
  { t: 6, close: 111 },
];

const SPEC = {
  family: "line",
  xKey: "t",
  x: { label: "Session" },
  axes: [{ id: "primary", label: "Close", format: { kind: "currency", currency: "USD" } }],
  series: [{ key: "close", label: "Close", tone: "accent" }],
  data: DATA,
  legend: true,
  unit: "USD",
};

const settled = new Set();
window.lucCaptureReady = (renderer) => {
  settled.add(renderer);
  if (settled.size >= 2) document.documentElement.dataset.captureReady = "1";
};

function ChartSlot({ renderer }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready) window.lucCaptureReady?.(renderer);
  }, [ready, renderer]);
  return (
    <Chart
      spec={staticChartSpec(SPEC, { renderer })}
      height={320}
      eager
      ariaLabel={\`Close, \${renderer}\`}
      onReady={() => setReady(true)}
    />
  );
}

hydrateRoot(document.getElementById("root"), <Shell />);

for (const slot of document.querySelectorAll("[data-chart]")) {
  createRoot(slot).render(
    <StrictMode>
      <ChartSlot renderer={slot.getAttribute("data-chart") === "vector" ? "svg" : "canvas"} />
    </StrictMode>,
  );
}
`,
  "vite.config.mjs": `
export default {
  esbuild: { jsx: "automatic" },
  build: {
    outDir: "public",
    emptyOutDir: true,
    rollupOptions: { input: "client.jsx", output: { entryFileNames: "client.js" } },
  },
};
`,
  /*
   * The server pass gets its own config.
   *
   * A single config with `input: "client.jsx"` wins over the CLI's `--ssr`
   * entry, so the "SSR build" quietly bundles the client and the server bundle
   * is never written — a failure that only shows up two steps later when the
   * file is missing.
   */
  "vite.ssr.config.mjs": `
export default {
  esbuild: { jsx: "automatic" },
  build: {
    ssr: "server.jsx",
    outDir: "ssr",
    emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: "server.js" } },
  },
};
`,
};

/* ------------------------------------------------------------------- server */

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

function serve(rootDir) {
  const server = createServer(async (request, response) => {
    const relative = decodeURIComponent((request.url ?? "/").split("?")[0]);
    const candidates = [
      path.join(rootDir, relative === "/" ? "index.html" : relative),
      // Vite writes the client bundle and the compiled stylesheet into
      // `public/`, which is the fixture's document root for assets the way any
      // static server would serve it.
      path.join(rootDir, "public", relative),
    ];
    try {
      let body;
      let file = candidates[0];
      for (const candidate of candidates) {
        body = await readFile(candidate).catch(() => undefined);
        if (body) {
          file = candidate;
          break;
        }
      }
      if (!body) throw new Error("not found");
      response.writeHead(200, {
        "content-type": MIME[path.extname(file)] ?? "application/octet-stream",
        // The fixture is served from a temporary directory that Vite wrote
        // seconds ago; a cached copy of a previous run would be worse than no
        // cache at all.
        "cache-control": "no-store",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end("not found");
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

/* -------------------------------------------------------------- assertions */

/** PNG dimensions straight out of the IHDR chunk — no decoder needed. */
function pngSize(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  assert.equal(signature, "89504e470d0a1a0a", "capture is not a PNG");
  assert.equal(buffer.subarray(12, 16).toString("ascii"), "IHDR", "PNG has no IHDR");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), bytes: buffer.length };
}

async function main() {
  /*
   * The tarball is only as good as `dist/`, and `ensurePack` hashes `dist/` —
   * so a stale build would produce a cached tarball that passes every check and
   * tests the previous release. Build first.
   */
  if (process.env.LUC_SKIP_PACKAGE_BUILD !== "1") {
    process.stdout.write("consumer-capture · building @luc/ui … ");
    await run("pnpm", ["build:package"], { cwd: packageRoot, maxBuffer: 32 * 1024 * 1024 });
    process.stdout.write("done\n");
  }
  const tarball = await ensurePack(packageRoot);
  const fixture = await mkdtemp(path.join(tmpdir(), "luc-ui-capture-"));
  const keep = process.env.LUC_KEEP_CAPTURE_FIXTURE === "1";
  await mkdir(artifactsDir, { recursive: true });
  const steps = [];
  let browser;
  let server;

  async function command(bin, args, label) {
    const started = performance.now();
    try {
      const result = await run(bin, args, {
        cwd: fixture,
        maxBuffer: 24 * 1024 * 1024,
        timeout: 300_000,
        env: { ...process.env, NODE_ENV: process.env.NODE_ENV ?? "production" },
      });
      steps.push(`${label} ${Math.round(performance.now() - started)}ms`);
      return `${result.stdout}${result.stderr}`;
    } catch (error) {
      // A consumer-side build failure is the interesting case, and the raw
      // `execFile` error shows the top of the stack and none of the tool's own
      // message. Surface both, or the failure is unactionable.
      const stdout = typeof error.stdout === "string" ? error.stdout.trim() : "";
      const stderr = typeof error.stderr === "string" ? error.stderr.trim() : String(error);
      throw new Error(`[consumer-capture] ${label} failed: ${bin} ${args.join(" ")}\n${stdout}\n${stderr}`);
    }
  }

  try {
    for (const [name, contents] of Object.entries(APP_FILES)) {
      await writeFile(path.join(fixture, name), contents);
    }

    await command(
      "npm",
      [
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        tarball,
        "react@19.3.0",
        "react-dom@19.3.0",
        "vite@8.3.1",
        "tailwindcss@4.3.3",
        "@tailwindcss/cli@4.3.3",
      ],
      "install",
    );

    const installed = JSON.parse(
      await readFile(path.join(fixture, "node_modules/@luc/ui/package.json"), "utf8"),
    );
    // The installed manifest must point at built output, not at `src`: a
    // consumer that received TypeScript sources would need the monorepo's
    // toolchain to use the package at all.
    assert.match(installed.exports["."].default ?? installed.exports["."], /^\.\/dist\//);
    assert.match(installed.exports["./charts"].default, /^\.\/dist\//);

    // The server pass is a real Vite SSR build of a real consumer entry, so the
    // JSX, the subpath imports and the externalisation all behave the way they
    // would in a consumer's own pipeline.
    await command(
      path.join(fixture, "node_modules/.bin/vite"),
      ["build", "--config", "vite.ssr.config.mjs"],
      "ssr-build",
    );
    await command("node", ["ssr/server.js"], "ssr-run");

    /*
     * Client bundle, then stylesheet.
     *
     * The order matters for a boring reason: `vite build` empties its output
     * directory, so a stylesheet written there first would be deleted. Tailwind
     * also scans the project, and by now `index.html` exists — so the classes
     * the server actually rendered are in scope.
     */
    await command(path.join(fixture, "node_modules/.bin/vite"), ["build"], "client-build");
    await command(
      path.join(fixture, "node_modules/.bin/tailwindcss"),
      ["-i", "style.css", "-o", "public/out.css"],
      "css",
    );

    const html = await readFile(path.join(fixture, "index.html"), "utf8");
    assert.match(html, /LUC UI external capture/, "SSR output is missing the heading");
    assert.match(html, /Sharpe/, "SSR output is missing the metric cards");
    assert.doesNotMatch(html, /<canvas/, "the server pass cannot have painted a canvas");

    const { server: httpServer, port } = await serve(fixture);
    server = httpServer;
    const baseUrl = `http://127.0.0.1:${port}`;

    browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1200, height: 900 },
      deviceScaleFactor: 2,
      /*
       * Reduced motion, set the way a capture host sets it. The library reads
       * the preference (and a spec can switch animation off outright), and both
       * routes have to end in a settled frame — a capture that lands mid-intro
       * is a capture of a chart that does not exist.
       */
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const problems = [];
    page.on("console", (message) => {
      if (message.type() === "error") problems.push(message.text());
    });
    page.on("pageerror", (error) => problems.push(String(error)));

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.documentElement.dataset.captureReady === "1", null, {
      timeout: 30_000,
    });

    /* 3. Vector output. */
    const vector = await page.evaluate(() => {
      const host = document.querySelector('[data-chart="vector"]');
      const svg = host?.querySelector("svg");
      const paths = Array.from(svg?.querySelectorAll("path") ?? []);
      return {
        hasSvg: Boolean(svg),
        hasCanvas: Boolean(host?.querySelector("canvas")),
        paths: paths.length,
        withGeometry: paths.filter((node) => (node.getAttribute("d") ?? "").length > 8).length,
        box: svg?.getBoundingClientRect().width ?? 0,
        labels: Array.from(svg?.querySelectorAll("text") ?? [])
          .map((node) => (node.textContent ?? "").trim())
          .filter(Boolean),
      };
    });
    assert.equal(vector.hasSvg, true, "an svg chart did not emit an <svg> element");
    assert.equal(vector.hasCanvas, false, "an svg chart still painted a canvas");
    assert.ok(vector.paths > 0, "the svg chart emitted no path elements");
    assert.ok(
      vector.withGeometry >= 1,
      `the svg chart's paths carry no geometry (${vector.withGeometry}/${vector.paths})`,
    );
    /*
     * The x values are a *category* axis here (they were not declared
     * positional), so the axis must be labelled with the caller's own x values.
     * Before Phase 9.6 it was built as a value axis instead, which ignores the
     * labels and reads each plain y value as a coordinate pair — the marks were
     * drawn at (y, y) and the axis read 0…120 while the data was 1…6. The two
     * assertions below are what that looked like from the outside.
     */
    assert.ok(
      vector.labels.includes("1") && vector.labels.includes("6"),
      `the x axis is not labelled with the data's own values — got ${JSON.stringify(vector.labels.slice(0, 12))}`,
    );

    /* 4. Raster output, measured from the canvas itself. */
    const raster = await page.evaluate(() => {
      const host = document.querySelector('[data-chart="raster"]');
      const canvas = host?.querySelector("canvas");
      if (!canvas) return { hasCanvas: false };
      const context2d = canvas.getContext("2d");
      const { data } = context2d.getImageData(0, 0, canvas.width, canvas.height);
      let nonTransparent = 0;
      const seen = new Set();
      for (let index = 0; index < data.length; index += 4) {
        if (data[index + 3] > 0) {
          nonTransparent += 1;
          if (seen.size < 64) seen.add(`${data[index]},${data[index + 1]},${data[index + 2]}`);
        }
      }
      return {
        hasCanvas: true,
        nonTransparent,
        distinctColours: seen.size,
        pixels: data.length / 4,
        width: canvas.width,
        height: canvas.height,
      };
    });
    assert.equal(raster.hasCanvas, true, "the raster chart did not create a canvas");
    assert.ok(raster.nonTransparent > 500, `the raster chart painted ${raster.nonTransparent} pixels`);
    assert.ok(
      raster.distinctColours > 2,
      `the raster chart painted a flat block (${raster.distinctColours} distinct colours)`,
    );

    /* 5. Reduced motion settles. */
    const motion = await page.evaluate(() => {
      const reveal = document.querySelector('[data-testid="reveal"]');
      return {
        prefersReduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        transform: reveal ? getComputedStyle(reveal).transform : null,
        opacity: reveal ? getComputedStyle(reveal).opacity : null,
      };
    });
    assert.equal(motion.prefersReduced, true, "the context did not honour reduced motion");
    assert.ok(
      motion.transform === "none" || motion.transform === "matrix(1, 0, 0, 1, 0, 0)",
      `a motion component is still transformed under reduced motion (${motion.transform})`,
    );

    /* 6. Fixed-size PNG capture. */
    const box = await page.locator("#capture").boundingBox();
    const png = path.join(artifactsDir, "capture@2x.png");
    await page.locator("#capture").screenshot({ path: png, animations: "disabled" });
    const pngBuffer = await readFile(png);
    const size = pngSize(pngBuffer);
    /*
     * The box is in CSS pixels and may be fractional; a screenshot is an integer
     * number of device pixels. One pixel of rounding is the difference between
     * the two, not a defect — two would mean the capture is not the box.
     */
    const near = (actual, expected) => Math.abs(actual - expected) <= 2;
    assert.ok(
      near(size.width, box.width * 2),
      `PNG width ${size.width} is not the box (${box.width}) at deviceScaleFactor 2`,
    );
    assert.ok(
      near(size.height, box.height * 2),
      `PNG height ${size.height} is not the box (${box.height}) at deviceScaleFactor 2`,
    );
    assert.ok(size.bytes > 20_000, `the PNG is only ${size.bytes} bytes — the page captured nearly empty`);

    /* 7. PDF output, and evidence the visuals are in it. */
    const pdfWith = path.join(artifactsDir, "capture.pdf");
    await page.pdf({ path: pdfWith, format: "A4", printBackground: true });
    const withCharts = await readFile(pdfWith);
    assert.equal(withCharts.subarray(0, 5).toString("ascii"), "%PDF-", "the PDF has no signature");

    await page.addStyleTag({ content: "#charts { visibility: hidden !important; }" });
    const pdfWithout = path.join(artifactsDir, "capture-no-charts.pdf");
    await page.pdf({ path: pdfWithout, format: "A4", printBackground: true });
    const withoutCharts = await readFile(pdfWithout);

    assert.ok(
      withCharts.length > withoutCharts.length * 1.05,
      `hiding the charts barely changed the PDF (${withCharts.length} vs ${withoutCharts.length} bytes) — ` +
        "the chart content may not be in the file",
    );

    assert.deepEqual(problems, [], `the consumer page reported console errors: ${problems.join(" | ")}`);

    await context.close();

    console.log(`consumer-capture · PASS · ${path.basename(tarball)}`);
    console.log(
      `  SSR shell, hydration, vector paths=${vector.paths} (${vector.withGeometry} with geometry, ` +
        `${Math.round(vector.box)}px box), raster ${raster.nonTransparent}/${raster.pixels} px painted ` +
        `across ${raster.distinctColours} colours`,
    );
    console.log(
      `  reduced motion settled (transform ${motion.transform}); PNG ${size.width}×${size.height} ` +
        `${(size.bytes / 1024).toFixed(0)}KB; PDF ${(withCharts.length / 1024).toFixed(0)}KB with charts vs ` +
        `${(withoutCharts.length / 1024).toFixed(0)}KB without`,
    );
    console.log(`  artifacts → ${path.relative(showcaseRoot, artifactsDir)}`);
    console.log(`  timings  ${steps.join(" · ")}`);
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    if (!keep) await rm(fixture, { recursive: true, force: true });
    else console.log(`fixture kept at ${fixture}`);
  }
}

await main();
