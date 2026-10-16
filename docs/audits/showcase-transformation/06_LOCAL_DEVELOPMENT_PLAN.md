# 06 — Future Local-Development Migration (Planning Only)

Readiness analysis for moving LUC UI Showcase development from the shared
production host to a local machine. **Nothing in this document is executed.**
No system configuration, service, repository or deployment is changed.

---

## 1. Feasibility verdict

**The Showcase is already standalone.** Verified by reading the current tree:

| Check | Result |
|---|---|
| Server-side data fetches in `apps/showcase/{app,lib,components}` | **none** (no `fetch(`, no API client) |
| Backend imports (`luc-api`, `luc-web`, ClickHouse, Redis) | **none** |
| Environment variables read at runtime | only `process.env.NODE_ENV` (i18n provider) and QA-script variables (`LUC_QA_BASE_URL`, `LUC_SKIP_PACKAGE_BUILD`, `LUC_KEEP_CAPTURE_FIXTURE`) |
| External network use | TradingView provider hosts (only on `/integrations/tradingview/**`), plus fictional example URLs in demo data |
| Data source for specimens | local fixtures/mocks in the tree (`lib/demo/**`, `packages/visuals/src/fixtures`) and inline page data |
| Build output | self-contained Next.js `standalone` bundle (Dockerfile) |
| Required services | **none** — no Redis, no ClickHouse, no Luc API, no Prefect |

Consequence: UI development can run locally with deterministic fixtures and no
production access. The only caveats are the workspace plumbing (below), browser
binaries for QA, and the choice of Mac vs Linux for visual baselines.

---

## 2. What exists today

- **Monorepo**: `luc-quant` with many subprojects. The frontend pnpm workspace
  root is the **repository root** (`pnpm-workspace.yaml` → `luc-ui`,
  `luc-ui/apps/*`, `luc-ui/packages/*`, `luc-web`).
- **LUC UI members**: `apps/showcase` (Next 16, App Router), `packages/ui`
  (`@luc/ui`), `packages/visuals` (`@luc/visuals`).
- **Versions**: Node `>=22` (`engines`), pinned image `node:22.22.1-alpine`;
  `packageManager: pnpm@12.6.0`; React 19.3, Next 16.3.6, Tailwind 4.3.3,
  TypeScript 5.9.3.
- **Toolchain**: Next (Turbopack) builds the Showcase; `tsdown` builds the
  `@luc/ui` package; Playwright 1.63 drives QA (Chromium/Firefox/WebKit are
  already cached on this host).
- **Production host role today**: a Docker review service
  (`luc-ui-showcase`, loopback-only `127.0.0.1:3000`) plus the QA harnesses.
  The host also runs `luc-api`, `luc-web`, Prefect, Redis, ClickHouse, Grafana
  and others — the Showcase shares the machine but not their state.
- **Known host-only constraint**: `next build` on the *host* fails in this
  environment because Turbopack's PostCSS worker cannot bind a port in the
  sandbox; that is why the production build happens in Docker. This is an
  environment quirk of the current server, not a property of the project.

---

## 3. Dependencies and blockers

| Kind | Item | Notes |
|---|---|---|
| Required | Node 22 + corepack/pnpm 12.6.0 | `corepack enable` honours `packageManager` |
| Required | Repo checkout containing the root workspace manifests **and** `luc-ui/**` | `pnpm install` at the root resolves the whole workspace |
| Likely required | Checkout or stub of `luc-web/package.json` | The workspace lists `luc-web`; the Dockerfile deliberately omits its manifest so pnpm skips the unresolvable importer. A partial local checkout must do the same or include `luc-web` |
| Optional | Docker Desktop | Only to reproduce the exact production bundle or to run the `qa-server.mjs` Docker path |
| Optional | Playwright browsers (Chromium, Firefox, WebKit) | ~1–2 GB; needed only for QA |
| Not required | Redis, ClickHouse, Luc API, Prefect, Grafana | Verified unused by the Showcase |
| Not required | Secrets / `.env` | The Showcase reads none at runtime |
| Blocker to decide | Mac vs Linux for visual baselines | ADR-036 forbids diffing Linux headless screenshots against Mac-Retina baselines |
| Blocker to decide | Where the canonical QA run happens | If local becomes primary, the committed baselines must be captured on the local platform |

---

## 4. Recommended local architecture

```
local machine (Mac, Apple Silicon)
  ├── repo clone (git, branch mirroring the shared flow)
  ├── Node 22 + pnpm 12.6.0 (corepack)
  ├── luc-ui/
  │     ├── apps/showcase  → pnpm dev   (Turbopack, 127.0.0.1:3000)
  │     ├── packages/ui    (transpiled from source; no publish needed)
  │     └── packages/visuals
  ├── Playwright browsers (chromium + webkit for the journey subset)
  └── optional: Docker for a byte-identical production build

no Redis · no ClickHouse · no Luc API · no Luc Web · no production tunnel
```

Principles:

1. **Development is fixture-first.** Specimens read from the in-repo fixtures
   already used today; no sample data is fetched.
2. **QA runs against a locally started server.** Point `LUC_QA_BASE_URL` at
   `http://127.0.0.1:3000` and run the harnesses directly instead of the Docker
   path in `scripts/qa-server.mjs`.
3. **Isolation from production is total.** Do not clone production databases or
   point anything at server Redis/ClickHouse — the Showcase never needed them.
4. **One artifact for acceptance.** For release-style acceptance, build the
   Docker image locally so the checked artifact matches the deployment shape.

### Apple Silicon considerations

- `pnpm` and the toolchain are architecture-independent; no native modules were
  found in the workspace's direct dependencies.
- Docker images: the pinned `node:22.22.1-alpine` builds natively on arm64.
- Playwright ships arm64 builds for Chromium/Firefox/WebKit; `pnpm exec
  playwright install` fetches the right ones.
- If a Linux-built image is pulled from the server for comparison, expect an
  emulated build and slower runs; prefer building locally on arm64.

---

## 5. Proposed setup sequence (for later approval)

| Step | Action | Exit criterion |
|---|---|---|
| 1 | Install Node 22 + corepack; `corepack enable` | `node -v`, `pnpm -v` match the pinned versions |
| 2 | Clone the repository (or a sparse checkout mirroring the Docker build context: root manifests + `luc-ui/**` + a `luc-web/package.json` stub) | `pnpm install` completes |
| 3 | `pnpm install` at the repo root | lockfile unchanged; no network beyond the registry |
| 4 | `cd luc-ui && pnpm dev` | `http://127.0.0.1:3000` serves the home page; hydration marker present |
| 5 | `pnpm verify` in `luc-ui` | typecheck, lint, unit tests, i18n, registry, package gates green |
| 6 | `pnpm exec playwright install chromium webkit` in `apps/showcase` | browsers present |
| 7 | Run the journey set (QA-002 once it exists) with `LUC_QA_BASE_URL=http://127.0.0.1:3000` | G3 journeys pass locally |
| 8 | Assert no production dependency: leave `luc-api`/Redis/ClickHouse stopped | every page and journey still works |
| 9 | Optional: `docker compose up -d --build` in `luc-ui` | image builds; healthcheck passes |
| 10 | Record platform-specific baselines if baselines move to local (ADR-036) | baseline set captured on this machine only |

---

## 6. QA workflow locally

| Tier | Command | Notes |
|---|---|---|
| Fast loop | `cd luc-ui && pnpm verify` | ~1.5 min; the default gate |
| Route sweep | `pnpm qa:quick` / `qa:changed` | workers ≤ 2 (`apps/showcase/qa/config.mjs`) |
| Chart primitives | `pnpm qa:charts` | engine smoke + geometry |
| Interaction | `pnpm qa:live` (`--mode=behaviour`) | needs a running server; on a local machine point it at the dev server |
| Journeys | QA-002 (to be built) | the missing G3 layer |
| Full sweep | `pnpm qa:full` | release only; 31+ routes × themes × viewports |

Resource notes: keep workers at ≤ 2 (ADR-036); one worker holds a desktop plus a
lazily created mobile context, so "2 workers" is more pages than it sounds. A
single Chromium headless run of the 57-route structural sweep used by this audit
took ≈ 60 s on the server — a modern Mac is comfortably faster.

---

## 7. Integration strategy with the shared repository

- Work on branches; open a change for review rather than pushing to the shared
  working tree.
- The `.context` documents are the contract: a local change that alters
  architecture, commands or boundaries must update `.context/docs` in the same
  change (per `AGENTS.md`).
- Generated artifacts must not be committed: registries are regenerated by
  `node apps/showcase/scripts/docs-registry.mjs`; screenshots/traces stay under
  `luc-ui/artifacts/**` (gitignored) except the small committed baseline set.
- CI/deployment boundaries stay as they are: **the Showcase is a private review
  service**, loopback-bound, no public entry, no production pipeline coupling.
  A local change must not introduce a public deployment.
- Lockfile policy: the root `pnpm-lock.yaml` is shared with `luc-web`. Adding a
  dependency to `luc-ui` changes a file other projects consume — that is a
  cross-cutting change and needs the same care as today.

---

## 8. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Workspace install pulls `luc-web` deps locally | heavy, unrelated install | mirror the Docker context (omit `luc-web/package.json`) or accept the full install |
| Platform divergence in visual baselines | false regressions | baselines captured on one platform only (ADR-036); never cross-diff |
| Two build paths (host dev vs Docker production) diverge | a fix works in dev, fails in the image | run the Docker path for acceptance batches (Gate B/C) |
| Local server ports collide with other projects | friction | the Showcase already accepts `LUC_UI_SHOWCASE_PORT` |
| Generated registries go stale locally | confusing failures | run `pnpm verify` before any acceptance claim; `docs:registry:check` catches drift |
| QA scripts assume Docker | local runs fail confusingly | document the `LUC_QA_BASE_URL` path in `luc-ui/docs/QA_WORKFLOW.md` as part of DEV-001 |
| Heavy concurrent browser work | resource contention (the original complaint) | bounded workers; run QA in the foreground, never as a background loop on a shared host |
| Secrets accidentally introduced | policy violation | the Showcase needs none; do not add any |

---

## 9. Decisions requiring user approval

1. **Primary development platform** — Mac (recommended, per ADR-036) vs the
   Linux host.
2. **Where visual baselines live** — they must move to the primary platform, or
   stay Linux-only and exclude the local runs from pixel comparison.
3. **Whether the local machine also runs a Docker build** for acceptance, or
   whether local acceptance is dev-server-only with Docker reserved for
   release candidates.
4. **Whether the shared host keeps a review container** after local development
   becomes primary (recommended: yes, as the deployment-shaped smoke test).
5. **Partial vs full checkout** — decide whether to mirror the Docker build
   context or clone the entire monorepo.

---

## 10. Out of scope

- No changes were made to any machine, service, container, port, DNS, tunnel, or
  CI configuration.
- No production database was cloned or read.
- No migration was performed; this is a plan awaiting the user's decision.

---

## 11. Addendum (2026-10-11) — what the plan's DEV items resolve to

This section was added by Agent A after the plan was executed. It records the
answers to `DEV-002` and `DEV-003` against the tree as it now stands, and the
commands that keep them true. The rest of the document is unchanged.

### 11.1 DEV-002 — the Showcase is standalone, and prove it

`qa/standalone.mjs` (`pnpm --filter @luc/showcase qa:standalone`) scans every
source file under `app/`, `components/` and `lib/` and fails on:

| Rule | Why |
|---|---|
| no import from `luc-web`, `luc-api`, `luc-jobs`, `luc-cron`, `luc-injest`, `luc-research`, `luc-artifact` | one such import makes the review image need a product checkout to compile |
| no `fetch(`, `XMLHttpRequest` or `axios` in application code | the Showcase renders repository fixtures; a request is either dead code or a hidden dependency |
| no `process.env.LUC_API_*`, `LUC_WEB_*`, `REDIS_*`, `CLICKHOUSE_*`, `PREFECT_*` | the review container must never look like a deployment |

`qa/`, `scripts/` and `tests/` are exempt from the network rule only (a capture
script drives a browser; a test may assert on a URL). They are **not** exempt
from the import rule.

Recorded result: **358 source files, 0 product imports, 0 network calls, 0
deployment variables.** The gate was also shown failing — a scratch file with
`import client from "luc-api"` made it exit 1 and name
`lib/_tmp-standalone-probe.ts` — so a green run is evidence rather than a
vacuous pass.

### 11.2 DEV-003 — when a specimen uses a fixture

One rule, and it is a rule about *honesty* rather than about plumbing:

> **A specimen renders a fixture unless the component's whole contract is about
> data the reader brings, and the fixture is written out in the copied code.**

Three consequences, which is what makes the rule usable:

1. **Deterministic and literal.** A fixture is a module-level constant —
   no `Math.random()`, no `Date.now()`, no locale formatting — and the generated
   snippet writes it out in full. A reader who copies the code gets the same
   picture, which is the only way "the code shows what you see" can be checked.
2. **The library computes nothing from it.** A chart receives values and draws
   them; it never derives a statistic, a fit or a bandwidth. Where a number would
   have to be invented to show something, the control or the specimen is dropped
   instead (`components/playground/adapters/*` declare those in `unsupported`).
3. **A control never changes the data.** Controls are presentation: height,
   state, scale, format, colour, which series are visible. The fixture is fixed
   because the alternative — a control that regenerates data — makes the code
   panel a function of a random number.

Which page shows what:

| Surface | Data | Why |
|---|---|---|
| Registry entry pages (`/components/*`, `/charts/*`, `/motion/*`) | in-repo fixture | there is no server in the image |
| Workbench previews | the adapter's declared fixture | the copied snippet writes it out |
| Visuals (`/visuals/*`) | `@luc/visuals` fixtures (`src/fixtures/*`) | the package is static-first by design |
| TradingView integrations | provider widget, no LUC data | the widget fetches from the provider in the browser |
| Chart catalogue (`/charts/catalog`) | registry metadata only | it is an index, not a specimen |

### 11.3 How the two are kept true

```bash
cd luc-ui/apps/showcase
pnpm qa:standalone          # DEV-002
pnpm qa:outline --all       # IA-001 / UX-004, every registry route
pnpm qa:playground          # WB-001 / WB-003 / WB-004
pnpm qa:dev                 # DEV-001, against a running dev server
pnpm qa:preview             # the local Docker preview, six key surfaces
pnpm qa:health              # QA-001, every documented route
```
