# Luc UI Showcase on Cloudflare Workers

Target: **https://ui.lucxu.com**

The Showcase is configured to run as a Cloudflare Worker named
`luc-ui-showcase`. The Cloudflare application is connected to
`lucxu495/luc-ui`, deploys the `main` branch, and builds from the repository
root so the pnpm workspace is resolved exactly as it is locally and in Docker.

This document records the implementation and the settings that were actually
exercised. It deliberately does not contain an account ID, API token or any
other credential.

---

## 1. Architecture decision

The Showcase uses:

- Next.js **16.3.6** App Router, React **19.3.0**.
- `@opennextjs/cloudflare` **1.20.5**, pinned because its peer range includes
  Next.js 16.3.6. Newer adapter releases require Next.js 16.3.8 or 16.4.1.
- Wrangler **4.151.1**.
- Cloudflare Workers static assets with a Worker fallback for every page.

The application is not a static site. Every route is request-rendered because:

- `middleware.ts` resolves the locale and sets `x-luc-locale` and the locale
  cookie;
- `app/layout.tsx` and many server components await `headers()` / `cookies()`;
- `next.config.ts` supplies registry-derived redirects and `/zh/**` rewrites.

The baseline `next build` reports **359 generated pages**, all marked dynamic
(`ƒ`) by Next.js because of that request state. A static export would lose the
server-side locale decision unless the routing and documentation model were
rewritten, so Cloudflare Workers is the correct target.

### Why OpenNext rather than vinext

`npx vinext@1.2.1 check` reports 98% surface compatibility (19 supported, one
partial, zero issues), including App Router, middleware, redirects, rewrites,
`next/headers`, Tailwind CSS and nuqs. That is useful supporting evidence, but
vinext is still beta, requires Vite/React RSC packages, and reimplements the
Next.js runtime. OpenNext runs the real `next build` and therefore preserves
the middleware, rewrites, route manifest and Server Component behavior already
covered by the repository's 357-route QA suite. The selected adapter version
explicitly supports the installed Next.js version and requires no application
rewrite.

## 2. Files

| File | Purpose |
|---|---|
| `apps/showcase/wrangler.jsonc` | Worker name, OpenNext entrypoint, assets, `nodejs_compat`, self-reference, Images binding and logging |
| `apps/showcase/open-next.config.ts` | Explicit adapter config with no R2/ISR cache |
| `apps/showcase/public/_headers` | Immutable `_next/static` caching, brand caching and static-asset security headers |
| `apps/showcase/package.json` | `cf:build`, `cf:check`, `cf:preview`, `cf:deploy`, `cf:upload` |
| `apps/showcase/next.config.ts` | Security headers on document responses |
| `apps/showcase/qa/brand-assets.mjs` | Waits for the optimized drawer logo to decode before asserting dimensions |
| `pnpm-workspace.yaml` | Allows the `workerd` postinstall needed by Wrangler |
| `.dockerignore`, `.gitignore` | Keep `.open-next` and Wrangler state out of Docker and Git |
| `eslint.config.mjs`, `apps/showcase/eslint.config.mjs` | Exclude the Worker bundle from lint |

No `@luc/ui` public API, component, Dockerfile or Compose service was changed.

## 3. Local build and Worker preview

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm cf:build
pnpm cf:check
```

Then preview the built artifact in the local Workers runtime:

```bash
cd apps/showcase
pnpm exec wrangler dev --port 8787 --ip 127.0.0.1
```

Open `http://127.0.0.1:8787`. `pnpm cf:preview` performs the build and calls
the adapter's preview command in one step.

The build output is:

| Item | Value |
|---|---|
| Worker entrypoint | `apps/showcase/.open-next/worker.js` |
| Static assets | `apps/showcase/.open-next/assets` |
| Uncompressed upload | 36,555.48 KiB (35.7 MiB) |
| Gzip | 7,254.26 KiB (7.1 MiB) |
| Files in assets directory | 260 |
| Static assets size | about 10 MiB |

The Free plan's Worker size limit is **64 MiB uncompressed**; the artifact is
under it. Gzip size is informational and is not the limit.

## 4. Cloudflare Workers Builds settings

Create or open the Worker `luc-ui-showcase`, connect GitHub, and use these
values under **Settings → Build**:

| Setting | Value |
|---|---|
| Repository | `lucxu495/luc-ui` |
| Production branch | `main` |
| Root directory | `/` (repository root, not `apps/showcase`) |
| Build command | `pnpm --filter @luc/showcase cf:build` |
| Deploy command | `pnpm --filter @luc/showcase cf:deploy` |
| Preview command | `pnpm --filter @luc/showcase cf:upload` |
| Preview builds | Enabled if pull-request/preview URLs are wanted |
| Build variable | `PNPM_VERSION=12.6.0` |
| Build variable | `NODE_VERSION=24.18.0` |

`PNPM_VERSION` is required because the Workers build image's default pnpm is
older than the repository's `packageManager` (`pnpm@12.6.0`). The root
directory stays at `/` so the root `pnpm-lock.yaml` and the `@luc/ui`
workspace link are visible; the `--filter` targets the Showcase explicitly.

No runtime environment variables or secrets are required. The adapter uses the
Worker's own `ASSETS`, `IMAGES` and `WORKER_SELF_REFERENCE` bindings declared in
`wrangler.jsonc`.

Suggested build watch paths:

```text
apps/showcase/**
packages/ui/**
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
.npmrc
```

## 5. Free-plan audit

| Constraint | Free plan | This deployment |
|---|---|---|
| Worker upload size | 64 MiB uncompressed | 35.7 MiB |
| Requests | 100,000/day | Static assets are free; SSR requests count |
| CPU per request | 10 ms | Not measurable without an account; monitor after first deploy |
| Worker startup | 1 second | Local Wrangler starts within the limit; validate in production |
| Static assets | 20,000 files, 25 MiB each | 260 files, about 10 MiB total |
| Workers Builds | 3,000 min/month, 20 min/build | Well within; local cold builds take several minutes |
| Images | 5,000 unique transformations/month | Small local logo/media set |

The deployment uses no D1, R2, KV, Durable Objects or paid add-on. The one
subject that cannot be certified from a local runtime is production CPU time;
Wrangler's local runtime does not enforce the Free plan's 10 ms per-request
ceiling. Check **Workers → Metrics** after the first deployment. If real
traffic exceeds the CPU allowance, the options are to pre-render more routes,
reduce server-rendered work, or move to a paid plan. No plan upgrade is part of
this change.

## 6. Routing and caching behavior

- `/zh` and `/zh/**` are handled by the existing middleware + config rewrite.
  The browser keeps the Chinese URL and the page receives `x-luc-locale`.
- Registry aliases such as `/components/button` return **308** to
  `/components/buttons`; the `/zh` variants return **308** to
  `/zh/components/buttons`.
- Hashed files under `/_next/static/*` are served with
  `Cache-Control: public, max-age=31536000, immutable`.
- `/brand/*` files are cached for one week.
- Document responses carry `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy` and `X-Frame-Options`. Static assets receive the same
  headers through `public/_headers`.

## 7. Custom domain

Do this only after the first Worker deployment succeeds. The Worker is not
claimed to be deployed by this repository change.

1. Open **Workers & Pages → luc-ui-showcase**.
2. Go to **Settings → Domains & Routes → Add Custom Domain**.
3. Enter `ui.lucxu.com`.
4. If Cloudflare reports an existing `ui` DNS record, inspect it before
   changing anything. Do not delete or overwrite an unrelated record.
5. Let Cloudflare create the Worker route and TLS certificate.
6. Verify:

```bash
curl -I https://ui.lucxu.com/
curl -I https://ui.lucxu.com/zh
curl -I https://ui.lucxu.com/components/buttons
curl -I https://ui.lucxu.com/zh/charts/line-chart
curl -I https://ui.lucxu.com/_next/static/chunks/<hashed-file>.js
```

## 8. Worker-runtime verification commands

With Wrangler listening on port 8787:

```bash
cd apps/showcase
export LUC_QA_BASE_URL=http://127.0.0.1:8787
node qa/route-health.mjs --workers=2
node qa/locale.mjs --all
node scripts/visual-qa.mjs --mode=behaviour --provider-mode=stub
```

The first command walks every route in `qa/routes.mjs` plus the generated
registry. It checks HTTP 200, the hydration marker, console errors and page
errors. `locale.mjs --all` additionally checks every documented `/zh` route,
cookie transitions and redirect hops.

## 9. Verification record

Measured on 2026-10-18 with Node.js 24.3.0, pnpm 12.6.0 on macOS:

| Gate | Result |
|---|---|
| `pnpm cf:build` | pass; 359 generated pages |
| `pnpm cf:check` | pass; 36,555.48 KiB upload / 7,254.26 KiB gzip |
| `wrangler check startup` | 28.9 ms active local startup |
| Worker route health | 357/357 routes, HTTP 200, hydrated, no console/page errors |
| Worker locale `--all` | 357/357 `/zh` routes, redirects and cookie transitions pass |
| Worker behaviour suite | 155/155 checks |
| Mobile overflow | 694 scans, 0 findings |
| Mobile axe (`390`, `768`) | 198 scans, 0 findings |
| Target size | 94 mobile routes, 0 findings |
| Reduced motion | 45 routes, 0 findings |
| Brand assets | 8 contexts (en/zh, light/dark, 1440/390) pass |
| `pnpm verify` | pass; 997 library + 182 Showcase + 43 tooling tests |
| Clean consumers | Vite pass, Next.js pass |
| Docker route health | 357/357 routes pass against the unchanged local stack |

## 10. Docker and local development

None of this replaces the Docker review stack:

```bash
docker compose up -d --build
```

The Showcase remains available on loopback port **5300** (or
`LUC_UI_SHOWCASE_PORT`), and `next dev` remains the development server.
Cloudflare-specific files are additive; `pnpm verify`, Docker QA and consumer
tests continue to use the existing commands.
