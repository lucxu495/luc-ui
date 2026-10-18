/**
 * Build both public language trees into one Cloudflare Worker.
 *
 * Next's request-aware locale layer makes every route dynamic. On Workers Free
 * that exceeds the 10ms CPU ceiling even for `/docs`. This script runs the
 * production build twice with a fixed build locale, merges the Chinese static
 * cache under a `zh/` prefix, and leaves the English output as the Worker
 * server. The custom Worker/cache override selects the matching tree by the
 * original request path.
 */

import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const appDir = path.resolve(import.meta.dirname, "..");
const openNextBin = path.join(appDir, "node_modules", ".bin", "opennextjs-cloudflare");
const cacheDirName = "cdn-cgi/_next_cache";
const buildId = process.env.LUC_NEXT_BUILD_ID ?? `luc-${Date.now().toString(36)}`;

const directories = {
  output: path.join(appDir, ".open-next"),
  outputEnglish: path.join(appDir, ".open-next-locale-en"),
  outputChinese: path.join(appDir, ".open-next-locale-zh"),
};

function removeBuildDirectory(directory) {
  if (!existsSync(directory)) return;
  rmSync(directory, { recursive: true, force: true });
}

function runBuild(locale) {
  const result = spawnSync(openNextBin, ["build"], {
    cwd: appDir,
    env: {
      ...process.env,
      LUC_STATIC_LOCALE: locale,
      LUC_NEXT_BUILD_ID: buildId,
    },
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`OpenNext build failed for ${locale}`);
  }
}

function countFiles(directory) {
  if (!existsSync(directory)) return 0;
  let count = 0;
  for (const entry of readdirSync(directory)) {
    const full = path.join(directory, entry);
    count += statSync(full).isDirectory() ? countFiles(full) : 1;
  }
  return count;
}

function writeRawPageAssets(cacheRoot, assetsRoot) {
  const outputRoot = path.join(assetsRoot, "luc-static");
  let written = 0;
  const walk = (directory) => {
    for (const entry of readdirSync(directory)) {
      const full = path.join(directory, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.endsWith(".cache")) continue;
      const parsed = JSON.parse(readFileSync(full, "utf8"));
      if (typeof parsed.html !== "string" && typeof parsed.rsc !== "string") continue;
      const relative = path.relative(cacheRoot, full).replace(/\.cache$/, "");
      for (const extension of ["html", "rsc"]) {
        const body = parsed[extension];
        if (typeof body !== "string") continue;
        const target = path.join(outputRoot, `${relative}.${extension}`);
        mkdirSync(path.dirname(target), { recursive: true });
        writeFileSync(target, body);
        written += 1;
      }
    }
  };
  walk(cacheRoot);
  return written;
}

for (const directory of [
  directories.output,
  directories.outputEnglish,
  directories.outputChinese,
]) {
  removeBuildDirectory(directory);
}

try {
  runBuild("en");
  renameSync(directories.output, directories.outputEnglish);

  runBuild("zh-CN");
  renameSync(directories.output, directories.outputChinese);

  const englishCacheRoot = path.join(directories.outputEnglish, "cache");
  const chineseCacheRoot = path.join(directories.outputChinese, "cache");
  const englishCacheId = readdirSync(englishCacheRoot).find((entry) =>
    entry !== "__fetch" && statSync(path.join(englishCacheRoot, entry)).isDirectory(),
  );
  const chineseCacheId = readdirSync(chineseCacheRoot).find((entry) =>
    entry !== "__fetch" && statSync(path.join(chineseCacheRoot, entry)).isDirectory(),
  );
  const englishCache = path.join(englishCacheRoot, englishCacheId ?? "");
  const chineseCache = path.join(chineseCacheRoot, chineseCacheId ?? "");
  if (!existsSync(englishCache) || !existsSync(chineseCache)) {
    throw new Error(`Expected static caches in both language builds`);
  }

  const chineseTarget = path.join(englishCache, "zh");
  mkdirSync(chineseTarget, { recursive: true });
  cpSync(chineseCache, chineseTarget, { recursive: true });

  /*
   * Chunk names are content-hashed, so the language-specific HTML can refer to
   * its own chunks while identical files collapse onto one path. Merging (rather
   * than replacing) keeps every English chunk referenced by the server bundle.
   */
  cpSync(
    path.join(directories.outputChinese, "assets"),
    path.join(directories.outputEnglish, "assets"),
    { recursive: true, force: true },
  );

  /*
   * `preview` and `deploy` normally run this copy themselves. Doing it here as
   * well makes a plain `wrangler dev` against `.open-next/worker.js` exercise
   * the same static cache as deployment.
   */
  cpSync(
    path.join(directories.outputEnglish, "cache"),
    path.join(directories.outputEnglish, "assets", cacheDirName),
    { recursive: true, force: true },
  );

  const rawPageAssets = writeRawPageAssets(
    path.join(directories.outputEnglish, "cache", englishCacheId),
    path.join(directories.outputEnglish, "assets"),
  );

  renameSync(directories.outputEnglish, directories.output);

  console.log(
    `Cloudflare build ${buildId}: ` +
      `${countFiles(path.join(directories.output, "cache"))} cache files, ` +
      `${countFiles(path.join(directories.output, "assets", cacheDirName))} static cache assets, ` +
      `${rawPageAssets} raw page assets`,
  );
} finally {
  removeBuildDirectory(directories.outputEnglish);
  removeBuildDirectory(directories.outputChinese);
}
