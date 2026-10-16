# Phase 9 — progress record

Append-only. Each checkpoint records what changed, what was verified, and what
is still open. The plan of record is `00-architecture-and-coordination.md`.

---

## Checkpoint 0 — architecture and ownership (2026-10-09)

**Delivered**

| Artefact | What it is |
| --- | --- |
| `docs/audits/phase-9/00-architecture-and-coordination.md` | Plan of record: verified repository facts, the registry/dynamic-route decision, the `DocEntry` and Playground contracts, checkpoints, file ownership, host budget, integration rules |
| `apps/showcase/lib/docs/types.ts` | `DocEntry`, `DocStatus`, `DocFamily`, `DocGroup`, the catalogue types |
| `apps/showcase/lib/docs/taxonomy.ts` | The handwritten half: families, module→family placement, route overrides, integration pages, chart-group landing pages |
| `apps/showcase/lib/docs/curation/summaries.ts` | One sentence per documented module — the only place a component is described in prose |
| `apps/showcase/scripts/docs-registry.mjs` | Generator: the real package catalogue + a real TypeScript program over `packages/ui/src` + taxonomy → typed generated modules |
| `apps/showcase/lib/docs/generated/{registry,api,nav}.ts`, `redirects.json` | Generated documentation registry (223 entries), API facts (444 symbols, 368 with prop tables), client-safe nav projection, 28 alias redirects |
| `apps/showcase/lib/docs/registry.ts` | Server-side registry API: lookup, families, reading order, neighbours, related, ranked search, API facts, redirects |
| `apps/showcase/lib/docs/nav.ts` | Client-safe projection: nav rows, families, ranked search — no API tables in the browser bundle |
| `apps/showcase/lib/docs/{install,ai-prompt}.ts` | The only place an install command or an AI prompt is written |
| `apps/showcase/components/playground/{types,engine,state,shell,registry,boundary}` | The Playground engine: control union, normalization, typed serializer, editor state, UI shell, adapter registry, client boundary |
| `apps/showcase/components/playground/adapters/button.tsx` | The reference adapter every other adapter follows |
| `apps/showcase/components/docs/{doc-entry,doc-search,page-outline}.tsx` | Shared page parts: header, exports/props tables, install block, AI block, related, previous/next; component search; on-this-page outline |
| `apps/showcase/vitest.showcase.config.ts` (in `packages/ui`) + `test:showcase` | The Showcase's unit tests, run by the library's existing Vitest with aliases derived from the package's own `exports` map |
| `apps/showcase/tests/unit/*.test.ts` | 40 tests: registry integrity, Playground engine equivalence, install/AI honesty, block registry |
| `apps/showcase/scripts/i18n-merge.mjs` | One writer for the Chinese prose dictionary, from per-agent handoff files |

**Verified**

- `pnpm --filter @luc/ui test:showcase` → 40 passed.
- `cd apps/showcase && pnpm typecheck` → clean.
- `cd apps/showcase && pnpm lint` → clean (`--max-warnings 0`).
- `node scripts/docs-registry.mjs --report` → 223 entries (62 curated, 157 generated, 4 reference), 76 chart pages, 73 generated component pages, 33 motion pages, 27 families, 28 alias redirects, 368 symbols with compiler-extracted prop tables.
- `qa/routes.mjs` now discovers routes from disk: `ROUTES = POLICY (148) + discovered`, so a page added by any agent is swept without a manual registry edit.

**Decisions worth remembering**

1. A component page is one **source module**; a chart page is one **chart**, because a chart is a distinct scientific claim rather than a part of a composite.
2. Chart routes are flat (`/charts/line-chart`) while the family grouping stays in the sidebar — verified to collide with none of the 27 existing topic directories.
3. A component whose page already exists under a Phase-8 path (`/components/buttons`, `/components/inputs`) keeps that path as canonical; its id URL redirects (28 aliases, generated from the registry, wired into `next.config.ts`).
4. Generated data is emitted as **typed TypeScript** with `as const satisfies`, so a generator bug is a typecheck failure rather than a silent runtime surprise.
5. `generated/` is excluded from the i18n prose measure with a written reason: it is the library's own JSDoc and signatures, which are API text, not Showcase copy.
6. The Showcase has no test runner of its own on purpose; its unit tests run under `packages/ui`'s Vitest, with aliases read from the package's `exports` map.

**Open at this checkpoint** (closed later in the phase)

- Agent A's homepage composition, Agent B's component/chart/docs routes, Agent C's seven remaining adapters, Agent D's four Studios, Blocks/Templates reuse depth, the registry proof of concept, browser QA, Docker deploy, the Chinese terminal report.

---

## Checkpoint 1 — public website foundation (in progress)

- Homepage rebuilt as a **server component** from three sections plus a new install section (`components/home/{hero,product-story,install,resources}-section.tsx`); the reader-facing claims link only to routes that exist, and the installation section shows both distribution modes with the unpublished one labelled.
- Navigation rewritten to be registry-driven for the library sections (Components, Charts, Motion) while the editorial sections (Foundations, Patterns, Application, Integrations) stay handwritten; depth is capped at group → family → component.
- `/blocks` (12 real Blocks with live previews, server-side category filter, exports used per Block) and `/templates` (8 reference pages, an explicit "no download yet" statement, and the copy workflow) added.
- Missing Chinese navigation labels that the coverage summary had under-counted (15 sidebar labels, including `Colors`, `Spacing`, `Radius`) were added, so the Chinese sidebar is no longer partly English.

---

## Checkpoint 2–5 — generation, Studios, verification (Lead), 2026-10-09 17:00Z

**Context for a later reader:** the three implementation agents were spawned, two
of them (`agent_b_docs`, `agent_a_home`) delivered and reported, and two
(`agent_c_playground`, `agent_e_studios`) never wrote a file, never answered a
message and never returned. The Lead took both scopes over, narrowed them to what
could be finished honestly, and recorded the gaps below rather than filling them
with placeholder pages. Nothing outside `luc-ui/**` was touched.

### Delivered

| Artefact | What it is |
| --- | --- |
| `lib/docs/curation/playgrounds.ts` | The single binding between a documented entry and its Playground adapter, plus `PLANNED_PLAYGROUNDS` naming the seven adapters that are designed but not written |
| `components/docs/playground-section.tsx` | The server section that mounts a Playground on a hand-written page, with the client/server constraint written down |
| `tests/unit/playground-wiring.test.ts` | Bidirectional contract: a wired id must resolve, a registered adapter must be reachable, a planned id must stay unwired |
| `app/studios/{charts,motion,themes,composer}/page.tsx`, `components/studios/*`, `lib/studios/{dataset,theme,composer}.ts` | The four Studios and their pure, testable halves |
| `tests/unit/studio-dataset.test.ts`, `tests/unit/studio-theme-composer.test.ts` | Chart data parsing/refusal, snippet generation, theme round-trip, composer ordering |
| `qa/routes.mjs` | Discovery now expands a dynamic segment into real registry entries (first/middle/last) instead of probing the literal `[component]` |
| `qa/behaviour.mjs` | One locator made exact: the sidebar's `Feedback` trigger is also a button, so `getByRole("button", { name: "Back" })` matched three elements and the sweep refused to start |
| `scripts/docs-registry.mjs` | Type text folded to one spelling (`React.ReactNode` → `ReactNode`), which is what made `docs:registry:check` fail spuriously |
| `lib/i18n/routes.zh.ts`, `i18n/*.json` | 6 route headers and 119 sentences from this checkpoint, merged by the single writer |

### Verified

| Command | Result |
| --- | --- |
| `pnpm --filter @luc/ui test:showcase` | **79 passed, 10 files** |
| `pnpm --filter @luc/ui test` | **898 passed** |
| `cd apps/showcase && pnpm typecheck` / `pnpm lint` | clean, 0 warnings |
| `cd luc-ui && pnpm verify` | exit 0 (typecheck, lint, library + showcase tests, i18n, chart catalogue, docs registry, package registry, package build/consumer/types) |
| `node apps/showcase/scripts/i18n-coverage.mjs` | **45932/45932 sentences, 161/161 headers**, exit 0 |
| `node apps/showcase/scripts/docs-registry.mjs --check` | up to date; two consecutive generations are byte-identical |
| `docker compose up -d --build` (luc-ui) | image built in ~1m, container healthy |
| `pnpm qa:full` | **167 routes, 471 screenshots, 109/109 behaviour checks, 0 axe violations across 257 scans, no console errors** |

Rollback target tagged before the deploy: `luc-ui/showcase:rollback-20261009-pre-phase-9`
(= the Phase 8 image `1c5c7ea32051`).

### Not delivered, and why

1. **Seven of the eight Playground adapters** (`input`, `card`,
   `kinetic-headline`, `profile-hero`, `chat-message`, `line-chart`,
   `violin-chart`). The engine, the serializer, the control renderers and the
   reference adapter (`button`) exist and are tested; the other seven are named
   in `PLANNED_PLAYGROUNDS` and deliberately **not** wired, because
   `Playground` renders nothing without an adapter and a bound-but-dead panel is
   a claim the page cannot keep.
2. **The Playground on four hand-written pages** (`/components/ai`,
   `/components/inputs`, `/components/cards`, `/motion/kinetic`). Those pages
   are client components, and `PlaygroundSection` resolves the entry from the
   server-side registry: importing it there put `next/headers` in the browser
   graph and Turbopack failed the build with exactly that message. A
   client-safe entry projection is the fix; it is not in this checkpoint.
3. **Chart Studio's four families.** Two are fully editable (time series →
   `LineChart`, distribution → `ViolinChart`) with CSV/JSON paste, shape
   validation, declared units and a generated snippet. The financial and matrix
   families are not editable yet.
4. **`qa:integration` / `qa:providers` / `qa:baseline`** were not run; the tier
   that ran is `qa:full` against the deterministic provider stub.

### Decisions worth keeping

1. A **unit is declared, never inferred** — the Chart Studio threads the reader's
   choice into `axes[].format` / `valueFormat`, because `0.05` is a ratio, a
   percentage and five basis points depending on nothing the data can tell you.
2. A **distribution arrives as a supplied density**; the Studio never fits a
   kernel, and it says so.
3. A route is measured through **real entries, not literal segments**: the old
   discovery swept `/charts/[chart]` as a URL, recorded a 404, and left the 157
   generated pages unmeasured.
4. Generated documentation text must be **byte-stable**: `docs:registry:check`
   compares it exactly, so the type printer is normalised rather than the check
   weakened.

---

## Superseding note — the tree was worked by two agent trees (2026-10-09 17:55Z)

The checkpoint above was written while a **second agent tree was editing the same
`luc-ui/**` concurrently**, so two of its "not delivered" items are already out
of date. Correcting them here rather than editing history:

1. **The seven adapters exist.** They landed at 17:04–17:11 in that other tree
   (`input`, `card`, `kinetic-headline`, `profile-hero`, `ai-message` in the light
   registry; `line-chart`, `violin-chart`, `registry.charts.ts`,
   `chart-boundary.tsx` in the chart half), together with
   `tests/unit/playground-adapters.test.ts`. All eight ids are wired in
   `lib/docs/curation/playgrounds.ts` and bound in the regenerated registry.
   `PLANNED_PLAYGROUNDS` no longer exists.
2. **The four client-rendered pages mount a Playground again.**
   `components/docs/playground-section.tsx` was made a client component whose
   entry comes from the generated compact projection
   `lib/docs/playground-entries.ts` instead of the server registry — the fix
   named as missing above, arrived at independently. Entry pages mount
   `<ChartPlayground>` for the chart half.

Final state, verified after all writers stopped (`test:showcase` 79 passed /
10 files, 898 library tests, typecheck and lint clean,
`docs:registry:check` up to date, i18n **48438/48438** with navigation
descriptions now 51/51, `qa:full` **167 routes / 475 screenshots / 140 behaviour
checks / 0 axe violations across 257 scans / no console errors**).

Still open after the merge, and unchanged by it: Chart Studio covers two of the
four planned families; `qa:integration`, `qa:providers` (live) and `qa:baseline`
have not been run; pixel baselines are not re-frozen.
