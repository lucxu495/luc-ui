/**
 * The Showcase's review address, written down once.
 *
 * This repository is its own project now, and its Compose stack publishes the
 * container's port 3000 on loopback as **5300** (`docker-compose.yml`, via
 * `LUC_UI_SHOWCASE_PORT`). 5300 is the number this checkout owns on the review
 * host — `luc-visuals` sits beside it on 5301 — so the QA runner, the Playwright
 * suite and every probe default to it, and `node qa/mobile-overflow.mjs` with no
 * environment reaches the stack the `pnpm qa:*` command just built.
 *
 * They used to fall back to `http://127.0.0.1:3000`. That is the *container's*
 * port and nobody's published port: once the published binding was 5300, each
 * of those defaults pointed at a closed socket, and the failure read as "the
 * Showcase is down" rather than "the probe is looking in the wrong place".
 *
 * Override with `LUC_QA_BASE_URL` when the target is not the local stack — a
 * `pnpm dev` server on 3000, a tunnel, a second checkout.
 */

/** The host port `docker-compose.yml` publishes the Showcase on. */
export const SHOWCASE_HOST_PORT = process.env.LUC_UI_SHOWCASE_PORT ?? "5300";

/** Where the local stack answers unless something says otherwise. */
export const DEFAULT_BASE_URL = `http://127.0.0.1:${SHOWCASE_HOST_PORT}`;

/**
 * `LUC_QA_BASE_URL` when it is set, otherwise the local stack — without a
 * trailing slash, because every caller joins a path onto the result.
 */
export function resolveBaseUrl() {
  return (process.env.LUC_QA_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
}
