/**
 * @luc/ui post-build.
 *
 * Three jobs the bundler should not be asked to do:
 *
 *  1. Ship the CSS. LUC UI's styles are Tailwind v4 CSS-first: the consumer's
 *     Tailwind compiles them, so they are copied verbatim rather than being run
 *     through a CSS pipeline that would try to resolve `@theme`.
 *  2. Re-point `@source` at the compiled output. Tailwind scans the files it is
 *     told to; in the published package the class names live in `dist`, not
 *     `src`.
 *  3. Guarantee the `"use client"` directives survive minification. React
 *     Server Components need them on every client entry point, and it is not
 *     worth betting the whole package on a bundler's directive handling.
 */

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const srcDir = path.join(root, "src");
const distDir = path.join(root, "dist");

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function copyCss() {
  const cssFiles = (await walk(srcDir)).filter((file) => file.endsWith(".css"));
  for (const file of cssFiles) {
    const relative = path.relative(srcDir, file);
    const target = path.join(distDir, relative);
    let content = await readFile(file, "utf8");
    if (path.basename(file) === "index.css" && relative === path.join("styles", "index.css")) {
      // Scan the compiled output, which is what is actually installed.
      content = content.replace(
        /@source\s+"\.\.\/\.\.\/src";/,
        '@source "../"; /* the compiled module graph */',
      );
    }
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, "utf8");
  }
  return cssFiles.length;
}

async function preserveUseClient() {
  const sources = (await walk(srcDir)).filter(
    (file) => file.endsWith(".ts") || file.endsWith(".tsx"),
  );
  let touched = 0;
  for (const file of sources) {
    const source = await readFile(file, "utf8");
    if (!/^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*["']use client["']/.test(source)) continue;
    const relative = path.relative(srcDir, file).replace(/\.tsx?$/, ".js");
    const target = path.join(distDir, relative);
    let output;
    try {
      output = await readFile(target, "utf8");
    } catch {
      continue;
    }
    if (/^["']use client["']/.test(output)) continue;
    await writeFile(target, `"use client";\n${output}`, "utf8");
    touched += 1;
  }
  return touched;
}

const cssCount = await copyCss();
const clientCount = await preserveUseClient();
console.log(
  `[luc-ui] post-build: ${cssCount} stylesheet(s) copied, ${clientCount} client directive(s) restored`,
);
