# Phase 9 — Agent B report: component documentation and discovery

**Date:** 2026-10-09 (UTC)
**Owner:** `agent_b_docs` — per-component pages, per-chart pages, family
landings, section chrome, getting-started docs, registry-driven index.

The brief arrived with an empty `Payload:` line in the visible message; the
task text was recovered from the session's own record and followed exactly
(deliverables 1–6, hard rules and the four required tests).

## 1. Files created or changed

```
app/components/[component]/page.tsx        52 component pages + 9 family landings, one route
app/charts/[chart]/page.tsx                76 chart pages, one route
app/motion/[motion]/page.tsx               29 motion pages, one route
app/components/layout.tsx                  section chrome (trail, measure, outline)
app/charts/layout.tsx                      the same chrome for /charts
app/components/page.tsx                    REWRITTEN: registry-driven index (was a hand-written list)
app/docs/page.tsx                          getting started, search, coverage table
app/docs/installation/page.tsx             both distribution modes, real commands
app/docs/theming/page.tsx                  the four theme attributes, foundations links
app/docs/reference/page.tsx                API index: every entry, grouped by family
components/doc-pages/entry-page.tsx        the generated page
components/doc-pages/family-page.tsx       the family landing page
components/doc-pages/examples.tsx          15 real, server-rendered specimens
components/doc-pages/copy.ts               family/group prose, written as literals so it is translatable
components/doc-pages/chart-engine.ts       engine derived from the verified chart catalogue
components/doc-pages/docs-section.tsx      shared chrome wrapper
components/doc-pages/docs-breadcrumbs.tsx  client island: Home › Group › Family, from the URL
tests/unit/doc-pages-routes.test.ts        the four required route assertions
docs/audits/phase-9/i18n/agent-b.json      83 sentence pairs (handoff)
```

Nothing outside the assigned writable scope was touched. `app/charts/page.tsx`
was inspected and **left alone**: it is a real overview with live charts, not a
stub, so the brief's "prefer editing minimally" applies to it literally.

## 2. What a generated page says

`DocEntryHeader` → live `Playground` (renders nothing unless the entry declares
a `playground` id) → **Usage** → **Installation** → **API** (or **Configuration**
for a chart) with `ExportsTable` and one `PropsTable` per symbol that declares
props → **Accessibility** → **SSR and rendering** → **Copy for an AI agent** →
family strip with the family's other entries → `RelatedEntries` →
`PrevNextNav`.

The specific claims, and where each one comes from:

| section | source |
| --- | --- |
| imports, signatures, props | the package and its TypeScript declarations, at build time |
| install commands, peers, setup | `lib/docs/install.ts` — the only place a command is written |
| AI brief | `lib/docs/ai-prompt.ts` + the same registry row the page rendered |
| chart data contract | a fixed statement: values are the caller's, no statistic is computed |
| chart engine | `components/charts/chart-catalog-data.ts`, matched by export name — never inferred |
| accessibility, SSR | one paragraph per family/group, stated as the contract's origin |
| example | `examples.tsx`, or an explicit sentence that there is none |

## 3. Route resolution and coverage

All three routes use `dynamicParams = false`, so `generateStaticParams` is
authoritative and an unknown slug is a 404. A static directory still wins (that
is how the ~35 handwritten pages stay canonical).

| | count |
| --- | --- |
| documented entries | 223 |
| reference-only entries (listed on a family page) | 4 |
| handwritten pages on disk | 62 |
| generated component pages | 52 |
| generated chart pages | 76 |
| generated motion pages | 29 |
| **entries with no reachable page** | **0** |

The brief estimated 73 generated component pages; the rule it states
(`group === "components" && status === "generated" && route === "/components/" + id`)
selects **52**, which is what the route generates. Every one of those 52 has
`status: "generated"` and no handwritten page.

Families: 13 component families resolve through the same route. Nine get a
landing page generated here; four are shadowed and need none — `feedback`,
`media` and `ai` because a handwritten page already owns that URL, and
`typography` because the family contains exactly one entry, whose page is the
family's content. Chart families keep their handwritten overviews, and the
entry pages link to them.

## 4. Commands run, with real results

| command | result |
| --- | --- |
| `cd luc-ui/apps/showcase && npx tsc --noEmit` | **0 errors** |
| `cd luc-ui && pnpm --filter @luc/ui test:showcase` | **5 files, 44 tests passed** (4 new in `doc-pages-routes.test.ts`) |
| `cd luc-ui/apps/showcase && npx eslint . --max-warnings 0` | **clean, 0 warnings** |
| `node apps/showcase/scripts/docs-registry.mjs --check` | up to date |
| `node apps/showcase/scripts/i18n-pending.mjs` | 83 pending sentences, all mine, all in the handoff |
| `node apps/showcase/scripts/i18n-merge.mjs` (dry run) | 4 handoff files, 83 new sentences, 0 refused |
| route-coverage audit against the registry | 52 + 76 + 29 routes, 0 slug collisions, 0 static-directory collisions |

**Not run, by instruction:** `next build`, Playwright, `qa:full`, Docker. A host
dev server was attempted once for a render smoke test and hangs on
`Compiling / …` — the sandbox limitation the coordination document records — so
browser proof belongs to the Lead's Docker pass. The server was stopped.

## 5. Deliberately minimal, or missing

- **No Playground is mounted anywhere yet.** `components/playground/boundary.tsx`
  is imported and rendered on every generated page, and it returns `null`
  because no registry entry declares a `playground` id (the adapter registry
  holds one spec, `button`, whose page is handwritten). The wiring is one field
  in the Lead's curation plus a `playground` value on the entry — no page change
  needed.
- **No live chart preview.** Charts are drawn from caller-prepared data; a real
  specimen needs a fixture per chart that the library would then be documenting
  implicitly. The brief permits a static honest page, and this is static and
  honest: the engine, the data contract, the exports and a link to the
  handwritten family overview.
- **15 of 157 generated entries have a live example** (aspect-ratio, container,
  delta, inline, link, panel, progress, rating, separator, skeleton, spinner,
  stack, stat-card, switch, textarea, typography and the others listed in
  `exampleIds`). The rest say so rather than showing a fake one.
- **Motion families have no landing pages.** Their entries have pages; the
  family is introduced by `/motion` and the six handwritten motion pages, and
  inventing `/motion/motion-surfaces` would be a URL shape nobody asked for.
- **Two handoffs need the Lead**, because both files are Lead-owned:
  the i18n merge (`node apps/showcase/scripts/i18n-merge.mjs --write`), and four
  new route headers in `lib/i18n/routes.zh.ts` for `/docs`,
  `/docs/installation`, `/docs/theming`, `/docs/reference` — suggested copy is in
  the `routes` note of `agent-b.json`.

## 6. Redirects

**None needed.** Every generated entry's canonical URL *is* the one the dynamic
route serves (`/components/<id>`, `/charts/<id>`, `/motion/<id>`), so there is
nothing to redirect from; the entries documented elsewhere are already covered
by the 28 alias redirects the registry computes and `next.config.ts` applies.
The one shape worth knowing: `/components/navigation`, `/components/ai` and
`/components/typography` are entry URLs, so the two single-member families
(`ai`, `typography`) have no separate landing page — their entry page is the
family's page.
