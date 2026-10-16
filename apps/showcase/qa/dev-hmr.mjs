/**
 * DEV-001 — the dev server must hydrate when the browser is at 127.0.0.1.
 *
 * `next dev` derives its allowed development origin from the hostname it
 * advertises as "Local" (`localhost`). A browser opened at
 * `http://127.0.0.1:<port>` sends `Origin: http://127.0.0.1:<port>` on the HMR
 * websocket; the dev server refuses the upgrade and answers with a bare
 * `Unauthorized` body with **no HTTP status line**. Chrome can only read that as
 * `net::ERR_INVALID_HTTP_RESPONSE`, the dev client waits for the HMR handshake
 * before calling `hydrateRoot`, and the page sits there rendered but inert.
 * `next build && next start` hydrates because it has no HMR socket — which is
 * how this stayed invisible for a whole phase.
 *
 * Two assertions, in the order the failure happens:
 *
 *   1. a raw WebSocket upgrade that carries the loopback-IP `Origin` is
 *      answered with `101 Switching Protocols`, not a bare body;
 *   2. a real browser at `http://127.0.0.1:<port>` reaches
 *      `document.documentElement.dataset.lucHydrated === "1"` and logs
 *      `[HMR] connected` without a page error.
 *
 * Start the server first, then point this at it:
 *
 *   cd luc-ui/apps/showcase && PORT=3300 pnpm dev
 *   LUC_QA_DEV_URL=http://127.0.0.1:3300 node qa/dev-hmr.mjs
 *
 * It exits non-zero on failure and prints the raw response bytes, so the
 * "Unauthorized" body is visible rather than inferred.
 */

import net from "node:net";
import { chromium } from "@playwright/test";

const DEV_URL = process.env.LUC_QA_DEV_URL ?? "http://127.0.0.1:3300";
const ROUTE = process.argv.slice(2).find((arg) => arg.startsWith("/")) ?? "/";
const url = new URL(DEV_URL);
const PORT = Number(url.port || (url.protocol === "https:" ? 443 : 80));
const KEY = "dGhlIHNhbXBsZSBub25jZQ==";
const failures = [];

/** Send one WebSocket upgrade and return the first bytes the server writes. */
function upgradeRequest({ origin, host = url.hostname }) {
  const request = [
    `GET /_next/hmr?id=lucpreviewcheck000000000000 HTTP/1.1`,
    `Host: ${host}:${PORT}`,
    "Connection: Upgrade",
    "Pragma: no-cache",
    "Cache-Control: no-cache",
    "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
    "Upgrade: websocket",
    `Sec-WebSocket-Version: 13`,
    "Accept-Encoding: gzip, deflate, br, zstd",
    "Accept-Language: en-US,en;q=0.9",
    `Sec-WebSocket-Key: ${KEY}`,
    `Origin: ${origin}`,
    "Sec-WebSocket-Extensions: permessage-deflate; client_max_window_bits",
    "",
    "",
  ].join("\r\n");
  return new Promise((resolve) => {
    const socket = net.connect(PORT, url.hostname, () => socket.write(request));
    let buffer = "";
    socket.on("data", (chunk) => {
      buffer += chunk.toString("latin1");
    });
    socket.setTimeout(5000, () => socket.destroy());
    socket.on("close", () => resolve(buffer));
    socket.on("error", (error) => resolve(`SOCKET ERROR: ${error.message}`));
  });
}

/* --- 1. the raw upgrade, with the Origin the browser actually sends ------- */
const raw = await upgradeRequest({ origin: DEV_URL });
const upgraded = raw.startsWith("HTTP/1.1 101");
console.log(`${upgraded ? "PASS" : "FAIL"} websocket upgrade with Origin: ${DEV_URL}`);
if (!upgraded) {
  failures.push(`/_next/hmr upgrade refused for Origin ${DEV_URL}`);
  console.log(`     server wrote: ${JSON.stringify(raw.slice(0, 200))}`);
}

/* --- 2. the browser's own experience ------------------------------------- */
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
const pageErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(String(error)));

let hydrated = false;
try {
  const response = await page.goto(DEV_URL + ROUTE, { waitUntil: "domcontentloaded", timeout: 30_000 });
  if ((response?.status() ?? 0) !== 200) throw new Error(`HTTP ${response?.status()}`);
  await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, {
    timeout: 30_000,
  });
  hydrated = true;
} catch (error) {
  failures.push(`no hydration at ${DEV_URL}${ROUTE}: ${error.message}`);
}
await browser.close();

const hmrErrors = consoleErrors.filter((message) => message.includes("_next/hmr"));
console.log(`${hydrated ? "PASS" : "FAIL"} ${DEV_URL}${ROUTE} hydrated (HMR errors: ${hmrErrors.length})`);
for (const message of [...consoleErrors, ...pageErrors].slice(0, 6)) console.log(`     ${message}`);
if (hmrErrors.length > 0) failures.push(`HMR websocket errors: ${hmrErrors.length}`);
if (pageErrors.length > 0) failures.push(`page errors: ${pageErrors.length}`);

console.log(
  failures.length === 0
    ? `\ndev server hydrates at ${DEV_URL} — DEV-001 stays fixed.`
    : `\n${failures.length} DEV-001 assertion(s) failed:\n  - ${failures.join("\n  - ")}\n` +
      `If the server was started before next.config.ts gained allowedDevOrigins, restart it.`,
);
process.exit(failures.length === 0 ? 0 : 1);
