/**
 * Repeats a small, bounded sample against the public Showcase so a deployment
 * failure has a reproducible trace instead of a one-off screenshot.
 *
 * Usage:
 *   node scripts/product-audit/public-reliability.mjs
 *
 * It deliberately keeps the sample small: ten spaced requests followed by one
 * four-request burst. A healthy static documentation site should answer all of
 * them in well under the Worker CPU limit.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const base = (process.env.AUDIT_PUBLIC_BASE ?? "https://ui.lucxu.com").replace(/\/$/, "");
const out = path.resolve("artifacts/product-experience-audit/reliability");
const routes = [
  "/",
  "/docs",
  "/components/buttons",
  "/components/ai",
  "/components/command",
  "/date-time/date-picker",
  "/application/navigation",
  "/explore",
  "/zh",
  "/zh/components/buttons",
];

await mkdir(out, { recursive: true });

async function request(route) {
  const started = performance.now();
  const response = await fetch(`${base}${route}`, {
    redirect: "manual",
    headers: { "cache-control": "no-cache" },
  });
  const body = await response.text();
  return {
    route,
    status: response.status,
    elapsedMs: Math.round(performance.now() - started),
    bytes: Buffer.byteLength(body),
    body: body.length <= 120 ? body : undefined,
    server: response.headers.get("server"),
    cfRay: response.headers.get("cf-ray"),
    cacheControl: response.headers.get("cache-control"),
  };
}

const sequential = [];
for (const [index, route] of routes.entries()) {
  sequential.push(await request(route));
  console.log(
    `${String(index + 1).padStart(2)} ${String(sequential.at(-1).status)} ${route} ` +
      `${sequential.at(-1).elapsedMs}ms ${sequential.at(-1).bytes}B`,
  );
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

const burstRoutes = ["/components/ai", "/date-time/date-picker", "/zh", "/components/command"];
const burst = [];
for (let round = 0; round < 3; round += 1) {
  const items = await Promise.all(burstRoutes.map(request));
  burst.push(...items.map((item) => ({ round: round + 1, ...item })));
  for (const item of items) {
    console.log(`burst ${round + 1} ${item.status} ${item.route} ${item.elapsedMs}ms`);
  }
  await new Promise((resolve) => setTimeout(resolve, 800));
}

const report = {
  capturedAt: new Date().toISOString(),
  base,
  sequential,
  burst,
  sequentialFailures: sequential.filter((item) => item.status !== 200).length,
  burstFailures: burst.filter((item) => item.status !== 200).length,
};

await writeFile(path.join(out, "report.json"), JSON.stringify(report, null, 2));
console.log(`Wrote ${path.join(out, "report.json")}`);
