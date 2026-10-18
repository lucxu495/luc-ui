import type { NextConfig } from "next";
import aliasRedirects from "./lib/docs/generated/redirects.json";

/*
 * Aliases, generated from the documentation registry.
 *
 * Some components were documented before Phase 9 at a plural or topical path
 * (`/components/buttons`, `/components/inputs`). Those pages are the canonical
 * page for their component, so the component's *id* URL redirects to them
 * rather than 404ing or duplicating the content. The list is produced by
 * `scripts/docs-registry.mjs` and checked by `docs:registry:check`, so it cannot
 * drift from the pages that exist.
 */
const redirects = async () => [
  ...aliasRedirects.map((entry) => ({
    source: entry.source,
    destination: entry.destination,
    permanent: entry.permanent,
  })),
  /*
   * The same aliases under `/zh`.
   *
   * They are needed *because* the prefix is now stripped by a config rewrite
   * rather than by middleware: the rewrite happens after `redirects`, so a
   * request for `/zh/components/button` reaches the router as that path, finds no
   * redirect rule and no page — a 404 where the old middleware rewrite happened to
   * render the canonical page under the alias URL. Redirecting to the canonical
   * *Chinese* URL is the better behaviour of the two: one canonical address per
   * capability per language, and the language survives the redirect.
   */
  ...aliasRedirects.map((entry) => ({
    source: `/zh${entry.source}`,
    destination: `/zh${entry.destination}`,
    permanent: entry.permanent,
  })),
];

/*
 * `/zh/**` is the same page as `/**`, with the locale in the URL.
 *
 * Declared here rather than in `middleware.ts`, because a config rewrite is
 * compiled into the route manifest: the runtime never has to match an absolute
 * destination against the server's own origin. Doing it in middleware produced
 * `307 Location: /zh` for a request to `/zh` on a standalone server started with
 * `HOSTNAME=127.0.0.1` — request.url and the Host header disagree about the
 * origin there, so the rewrite was read as cross-origin and answered with a
 * redirect to the path that had just been requested. The loop is in the serving
 * path, not in the pages, which is why `next dev` and the Docker container (both
 * of which reconcile the origin) never showed it.
 *
 * `beforeFiles` so the rewrite happens before the filesystem route is matched —
 * i.e. `/zh/components/buttons` renders `app/components/[component]/page.tsx`
 * with the middleware's `x-luc-locale` header still attached.
 */
const rewrites = async () => ({
  beforeFiles: [
    { source: "/zh", destination: "/" },
    { source: "/zh/:path*", destination: "/:path*" },
  ],
});

/*
 * Response headers for document routes. `public/_headers` applies the same
 * policy to Workers static assets, which bypass the Next.js server.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

const headers = async () => [
  {
    source: "/(.*)",
    headers: securityHeaders,
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /*
   * CONCURRENCY-001 — one output directory per development session.
   *
   * Two `next dev` processes over the same source and the same `distDir` write
   * into one Turbopack cache, one HMR manifest and one set of chunk files. The
   * second server does not merely share the first's cache: each server compiles
   * its own graph and then overwrites the other's manifests, so a browser
   * attached to server A can be served a module graph compiled by server B —
   * stale components, wrong HMR ids, and QA runs that pass or fail depending on
   * which process happened to write last. That is the "stale module results"
   * this session was opened to fix.
   *
   * Next supports an explicitly configured `distDir`, so isolation needs no
   * architecture change: run each session with its own value and each gets its
   * own dev cache, lock and build output. `pnpm dev:a` / `pnpm dev:b` at the
   * luc-ui root do exactly that (see docs/DEV_MODE.md §7).
   *
   * Default stays `.next` so every existing command — `pnpm dev`, the production
   * build, the Dockerfile's `.next/standalone` copy — is byte-for-byte unchanged.
   */
  distDir: process.env.LUC_NEXT_DIST_DIR || ".next",
  /*
   * DEV-001 — the dev server must accept the loopback IP as an origin.
   *
   * `next dev` derives its allowed development origin from the hostname it
   * prints as "Local" — `localhost`. A browser opened at
   * `http://127.0.0.1:<port>` sends `Origin: http://127.0.0.1:<port>` for the
   * HMR websocket, and the dev server answers the upgrade with a bare
   * `Unauthorized` body that carries no HTTP status line. Chrome can only read
   * that as `net::ERR_INVALID_HTTP_RESPONSE`, the HMR socket never connects, and
   * the dev client defers `hydrateRoot` until it does — so the page renders its
   * server HTML, logs the React banner, and then never responds to a click.
   * The production server is unaffected (it has no HMR socket), which is why
   * `next build && next start` hydrated while `next dev` did not.
   *
   * Reproduced and fixed on 2026-10-11; see `docs/DEV_MODE.md`.
   */
  allowedDevOrigins: ["127.0.0.1", "[::1]", "localhost"],
  // Docker review builds run the production server from a self-contained
  // `.next/standalone` bundle (see luc-ui/Dockerfile). This only affects
  // build output layout, not the dev server or the static export.
  output: "standalone",
  // @luc/ui ships TypeScript source (open-code style) so the design system is
  // readable and patchable inside consuming products.
  transpilePackages: ["@luc/ui"],
  // Next 16 writes AGENTS.md/CLAUDE.md into the app on first dev run. LUC UI
  // owns its agent guidance explicitly (skills/luc-ui/SKILL.md).
  agentRules: false,
  redirects,
  rewrites,
  headers,
};

export default nextConfig;
