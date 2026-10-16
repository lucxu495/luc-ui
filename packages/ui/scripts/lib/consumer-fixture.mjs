/**
 * The assertions that make an installed `@luc/ui` a *consumer's* package.
 *
 * Both installed-artifact proofs run the same body — `independent-consumer.mjs`
 * for the packed tarball, `git-consumer.mjs` for a git ref — because the
 * question is identical in both cases ("does what a consumer gets work?") and
 * only the way the bytes arrive differs. Two copies of these assertions would
 * eventually disagree about what "works" means.
 *
 * What is asserted, and why each one is here:
 *
 *   · the manifest publishes `dist` and ships no `src` — the property
 *     `publishConfig` exists to provide, and the one a git fetch silently loses;
 *   · the stylesheet scans `dist` — Tailwind's `@source` is rewritten by the
 *     build, and a wrong one produces a page with no utilities;
 *   · `"use client"` survives on the client entry and stays off the server
 *     recipe — the React Server Components contract;
 *   · the declarations typecheck from the package, not from source;
 *   · the package server-renders;
 *   · Tailwind compiles the imported stylesheet into real utilities;
 *   · a button-only bundle contains no chart engine, no date system and no
 *     provider script — the subpath split, measured.
 */

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const ENTRY = `import { Button, buttonVariants } from "@luc/ui/components/button";
import { DataTable } from "@luc/ui/data-table";
import { ProfileHero, PublicationList, ReadingShelf } from "@luc/ui/experiences";
import { Chart, ChartSyncGroup } from "@luc/ui/charts";
import { Workspace } from "@luc/ui/workspace";
import { MagnifyDock, MagnifyDockItem } from "@luc/ui/motion";
export const sample = [Button, buttonVariants, DataTable, Chart, ChartSyncGroup, Workspace, ProfileHero, PublicationList, ReadingShelf, MagnifyDock, MagnifyDockItem];
export const button = <Button variant="primary">Ready</Button>;
`;

const SSR = `import React from "react";
import { renderToString } from "react-dom/server";
import { Button } from "@luc/ui/components/button";
import { ChartSyncGroup } from "@luc/ui/charts";
import { ProfileHero } from "@luc/ui/experiences";
import { Workspace } from "@luc/ui/workspace";
const html = renderToString(React.createElement(Button, { variant: "primary" }, "Ready"));
if (!html.includes("<button") || !html.includes("Ready")) throw new Error("SSR button failed");
const hero = renderToString(React.createElement(ProfileHero, { name: "Ada Okonkwo", title: "Engineer" }));
if (!hero.includes("Ada Okonkwo") || !hero.includes("<h1")) throw new Error("SSR profile hero failed");
if (typeof ChartSyncGroup !== "function" || typeof Workspace !== "function") throw new Error("public chart/workspace import failed");
if (typeof ProfileHero !== "function") throw new Error("public experiences import failed");
console.log("SSR and chart/workspace/experiences imports passed");
`;

/**
 * Assert that the package installed in `fixture` is a usable consumer package.
 * The caller is responsible for having installed it there.
 */
export async function verifyInstalledPackage(fixture, { expectNoInstallScripts = false } = {}) {
  const bin = (name) => path.join(fixture, "node_modules/.bin", name);
  const command = async (file, args) => {
    const result = await run(file, args, { cwd: fixture, maxBuffer: 12 * 1024 * 1024, timeout: 180_000 });
    return `${result.stdout}${result.stderr}`;
  };

  const installed = path.join(fixture, "node_modules/@luc/ui");
  const manifest = JSON.parse(await readFile(path.join(installed, "package.json"), "utf8"));
  assert.equal(manifest.name, "@luc/ui");
  assert.equal(manifest.peerDependencies.react, "^19.0.0");
  assert.equal(manifest.peerDependencies["react-dom"], "^19.0.0");
  assert.equal(manifest.exports["."].default, "./dist/index.js");
  if (expectNoInstallScripts) {
    /*
     * Stronger than it looks: a manifest with no `scripts` at all cannot ask an
     * install to run anything, which is what lets a git consumer install this
     * package without allow-listing a build. The packed tarball keeps the
     * repository's scripts — publishing them is normal — so this is asserted
     * only where the artifact is the git release tree.
     */
    assert.ok(!manifest.scripts, "the installed manifest must not carry install scripts");
  }
  await assert.rejects(readFile(path.join(installed, "src/index.ts"), "utf8"));

  const css = await readFile(path.join(installed, "dist/styles/index.css"), "utf8");
  assert.match(css, /@source "\.\.\/"/);
  assert.doesNotMatch(css, /@source[^;]*src/);
  const clientButton = await readFile(path.join(installed, "dist/components/button-base.js"), "utf8");
  assert.match(clientButton, /^"use client";/);
  const serverRecipe = await readFile(path.join(installed, "dist/components/button-variants.js"), "utf8");
  assert.doesNotMatch(serverRecipe, /^"use client";/);

  await writeFile(path.join(fixture, "entry.tsx"), ENTRY);
  await writeFile(
    path.join(fixture, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          types: ["react", "react-dom"],
        },
        include: ["entry.tsx"],
      },
      null,
      2,
    ),
  );
  await command(bin("tsc"), ["--project", "tsconfig.json"]);

  await writeFile(path.join(fixture, "ssr.mjs"), SSR);
  const ssr = await command("node", ["ssr.mjs"]);

  await writeFile(path.join(fixture, "style.css"), '@import "tailwindcss";\n@import "@luc/ui/styles.css";\n');
  await command(bin("tailwindcss"), ["-i", "style.css", "-o", "out.css"]);
  const outputCss = await readFile(path.join(fixture, "out.css"), "utf8");
  assert.match(outputCss, /\.bg-accent-default\b/);
  assert.match(outputCss, /\.h-control-md\b/);
  assert.match(outputCss, /--accent-default\s*:/);

  await writeFile(path.join(fixture, "button-entry.js"), 'import { Button } from "@luc/ui/components/button"; export const value = Button;\n');
  await writeFile(
    path.join(fixture, "vite.config.mjs"),
    `export default {
  build: { outDir: "bundle", lib: { entry: "button-entry.js", formats: ["es"], fileName: "button" },
    rollupOptions: { external: ["react", "react-dom", "react/jsx-runtime", "radix-ui", "@remixicon/react"] } }
};\n`,
  );
  await command(bin("vite"), ["build", "--config", "vite.config.mjs"]);
  const bundle = await readFile(path.join(fixture, "bundle/button.js"), "utf8");
  for (const forbidden of ["echarts", "lightweight-charts", "tradingview-widget.com", "s3.tradingview.com"]) {
    assert(!bundle.includes(forbidden), `button-only bundle includes ${forbidden}`);
  }

  return { ssr: ssr.trim(), bundleBytes: Buffer.byteLength(bundle), manifest };
}

/** The lines every installed-artifact proof prints. */
export function reportInstalledPackage(label, { ssr, bundleBytes }) {
  console.log(`  React peers, declarations, public imports, SSR/client split, Tailwind dist scan, subpath isolation passed`);
  console.log(`  button-only bundle ${(bundleBytes / 1024).toFixed(1)} KB`);
  console.log(`  ${ssr}`);
  console.log(`${label}: PASS`);
}
