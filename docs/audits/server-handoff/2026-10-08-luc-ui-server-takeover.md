# LUC UI — server takeover and QA handoff

Date: 2026-10-08. Scope: reconstruct the state of `luc-ui`, finish the interrupted
Design Lab, prepare reviewed external Skills, close the Phase 1B workspace
verification blocker, and hand off. **No commit, no push, no production deploy.**
Phase 2 has not started.

## 1. Git

| | |
| --- | --- |
| Repository root | `/home/luc/code/luc-quant` |
| Branch | `main` |
| Revision | `9cec3c2578911629e7fcf2248d50c35f8cb35240` (`9cec3c2`) |
| Working tree at takeover | clean |
| Working tree at handoff | `luc-ui`: 1 modified file, 1 new report, refreshed experiment screenshots, 4 stale screenshots relocated (see §7). Other top-level trees (`luc-api`, `luc-web`, `luc-cron`, `luc-jobs`, `infra`) contain **another agent's in-progress edits** and were deliberately left untouched. |

`9cec3c2` is the commit that carried the Phase 1A catalog/docs, the Phase 1B
fixes, the design-intelligence research, and the interrupted Design Lab
implementation. Nothing had to be fetched, merged or recovered.

## 2. Phase 1A confirmation

Present and consistent:

- `luc-ui/docs/COMPONENT_CATALOG.md`, `luc-ui/docs/component-catalog.json`
- `luc-ui/packages/ui/scripts/generate-catalog.mjs` + `catalog-annotations.json`
- `luc-ui/docs/PUBLIC_API.md`, `DEVELOPER_GUIDE.md`, `luc-ui/skills/luc-ui/SKILL.md`
- `luc-ui/docs/audits/2026-10-phase-1a-verification.md`

The catalog resolves **34 declared package paths**, source and packed export maps
are parity-checked, and the annotations point at real Showcase pages.

**One Phase 1A defect is now proven on this machine** (it was invisible in the
previous local environment):

`docs/component-catalog.json` embeds **685 absolute module paths from the
authoring Mac** (`/Users/luc/Documents/luc/luc-quant/node_modules/.pnpm/...`).
`generate-catalog.mjs` stringifies TypeScript signatures, which include the
resolved `node_modules` paths, and only relativises `source`, not the signature.
On any other machine the generator emits `/home/luc/...`, so
`node scripts/generate-catalog.mjs --check` reports *`docs/component-catalog.json`
is stale* even though no source changed. `COMPONENT_CATALOG.md` is clean (0
occurrences).

This is a portability bug in the generator's output, not a content change. It was
**not fixed**: the generator and the generated catalog are outside this task's
write ownership. Proposal in §10.

## 3. Phase 1B confirmation and closure

The reported Phase 1B fixes are all present in the checkout (`button-variants.ts`,
`chart.test.tsx`, `distribution-charts.tsx`, `sequence-charts.tsx`,
`kinetic.test.tsx`, `motion-primitives.test.tsx`, `shared-highlight.tsx`,
`bundle-baseline.json`, `docs/audits/phase-1b/*`).

### The reported workspace blocker is fixed

Root cause: `luc-ui/apps/showcase/app/charts/uncertainty/page.tsx:193` contained a
JSX attribute string with JavaScript-style escapes. Backslash escapes are not
valid inside a JSX attribute string literal, so `tsc` failed with **TS1127
(Invalid character)** at 193 and **TS1382** at 198, and `pnpm verify` stopped
during Showcase typecheck.

Attribute value, before:

```
description="`labelMode=\"auto\"` prints each label at its marker while the history is short enough to read, and falls back to markers-only (the tooltip carries the name) once it is not."
```

Attribute value, after (one attribute, no logic change):

```
description="`labelMode=&quot;auto&quot;` prints each label at its marker while the history is short enough to read, and falls back to markers-only (the tooltip carries the name) once it is not."
```

Verified before the edit that the file was unmodified by any other agent
(`git status` clean for `luc-ui`) and owned by `luc-ui/apps/showcase`. Nothing
else in the page, the chart library or any component was touched.

### Remaining Phase 1B items

| Item | Status |
| --- | --- |
| Workspace verification blocker (uncertainty JSX) | **Resolved** (see §6) |
| Docker browser QA availability | **Resolved for the design work** — Docker is healthy on the server and the Showcase image builds; QA ran against an isolated container (§5) |
| `catalog:check` on a non-Mac machine | **Failing — portability defect**, §2/§10 |

## 4. Skills bootstrap

### Installed (reviewed, pinned, instruction-only)

| Skill | Upstream | Pinned commit | Files installed | License |
| --- | --- | --- | --- | --- |
| `frontend-design` | `anthropics/skills` → `skills/frontend-design` | `41bbe19d1a1a7eaab5e7bb9050a417e5c6cffc8f` | `SKILL.md`, `LICENSE.txt` (verbatim) | Apache-2.0 |
| `web-design-guidelines` | `vercel-labs/agent-skills` → `skills/web-design-guidelines` | `ba46938889d4e58635362fb8f618e1178ac3ec46` | `SKILL.md` (verbatim) | README says MIT; no top-level LICENSE file; the SKILL declares no `license:` field |
| `vercel-composition-patterns` | `vercel-labs/agent-skills` → `skills/composition-patterns` | `a5343bd997c4cc4d8bf2ca61021bdc74b4d6c9d5` | `SKILL.md`, `README.md`, `metadata.json`, `rules/*.md`, compiled guide (`rules-compiled.md`) | MIT (frontmatter + README) |

Installation path: **`/home/luc/.codex/skills/<name>/`** (user-level). Each folder
also contains a `SOURCE.md` recording the upstream URL, pinned SHA, license,
install date and scope rules.

Review notes:

- Every file was fetched from the pinned raw commit and inspected. **No upstream
  script was executed**; none of the three Skills ships executable code.
- `web-design-guidelines` instructs the agent to fetch an **unpinned live rules
  document** (`vercel-labs/web-interface-guidelines/main/command.md`) on every
  review. Pinning the Skill therefore does not pin the rules it applies, and that
  document's license is unresolved. Documented as a limitation; treat fetched
  rules as reference only.
- The upstream `composition-patterns/AGENTS.md` was renamed to `rules-compiled.md`
  on install so a third-party `AGENTS.md` cannot be mistaken for repository
  policy.
- Third-party guidance is explicitly subordinate to `luc-ui/DESIGN_SYSTEM.md`,
  `luc-ui/AI_DESIGN_GUIDE.md` and the repository `.context` rules. The existing
  `luc-ui` Skill and the root `AGENTS.md` were not modified.

### Discovery — actually verified, not assumed

The harness exposes a discovery probe (`codex debug prompt-input`), which renders
the model-visible skills catalogue. After installation it lists:

```
### Skill roots
- `r0` = `/home/luc/.codex/skills`
- `r1` = `/home/luc/.codex/skills/.system`
### Available skills
- frontend-design …              (file: r0/frontend-design/SKILL.md)
- vercel-composition-patterns …  (file: r0/composition-patterns/SKILL.md)
- web-design-guidelines …        (file: r0/web-design-guidelines/SKILL.md)
```

### Project-scoped location — important finding

The task suggested `luc-ui/.agents/skills/`. That path is **not** a Codex
discovery root. Verified by probe:

- a probe skill at `luc-ui/.agents/skills/__probe2__/` produced **no new root**
  and was not listed;
- a probe skill at `<repo>/.agents/skills/__probe__/` produced
  **`r1 = /home/luc/code/luc-quant/.agents/skills`** and was listed.

So the real project-scoped root is the **repository root**, not the `luc-ui`
subtree. Both probes were removed immediately and the tree was left clean.
Because `<repo>/.agents/skills/` is outside this task's write allowlist, the
authorized user-level fallback was used. **Proposed change (not made):** move (or
symlink) the three folders into `<repo>/.agents/skills/` if the Skills should be
repository-scoped rather than account-scoped.

### Reference-only (reviewed, not installed)

`vercel-react-best-practices` and `ui-ux-pro-max` remain references, per the
existing research. They stay uninstalled to avoid trigger overlap and generic
aesthetic advice.

## 5. Design Lab — what was done

The interrupted implementation was continued, not recreated. Files:

`luc-ui/apps/showcase/app/experiments/design-lab/` — `page.tsx`, `design-lab.tsx`,
`design-lab.module.css`, `data.ts`, `precision-instrument/page.tsx`,
`editorial-research/page.tsx`, `focused-workspace/page.tsx`, `tsconfig.lab.json`.

No library component, token, export, dependency or shared Showcase file was
changed. Full detail, screenshots, comparison and recommendation are in
[`docs/research/design-intelligence/experiments/comparison-and-results.md`](../../research/design-intelligence/experiments/comparison-and-results.md).

Browser QA needed a running Showcase that contains the new routes. The already
deployed preview (`luc-ui-showcase`, `127.0.0.1:3000`, image from 2026-09-27) does
**not** contain them and was left running and untouched. Instead an **isolated
Compose project** was built:

```bash
cd luc-ui
docker compose -f docker-compose.yml -f /tmp/luc-ui-qa-compose.yml -p lucuiqa up -d --build
# → container luc-ui-showcase-qa, image luc-ui/showcase:qa-3100, 127.0.0.1:3100
```

The standalone dev server was tried first and was not usable in this environment
(Turbopack dev compile stalled/crashed reproducibly); the production Docker build
is the documented path and is what the QA ran against. The isolated stack was
removed after the run.

### Design Lab QA results

Script: a throwaway Playwright + axe-core driver run from a temp directory (not
added to the repository, because the routes are deliberately outside
`qa/routes.mjs`). 14 records, **0 findings**.

Coverage and outcomes:

| Check | Result |
| --- | --- |
| 3 routes × {1440×900, 390×900} × {dark, light} | 200 OK, correct `data-treatment`, correct resolved theme |
| Row click selects `Sample 04` | chart live status `Selected: Sample 04, 128 milliseconds`; inspector shows `128 ms`, `07 Sep`, `East`, reference `120 ms` |
| Chart canvas actually repainted on selection | changed in 12/12 runs |
| Layout stability | chart region moved 0px in x/y/w/h in 12/12 runs |
| Non-colour selected cue | `▸` glyph + bold label + `SELECTED` badge present in 12/12 |
| Keyboard row selection | focus lands on `TR`; `Enter` selects `Sample 06` |
| `Clear selection` | returns the empty inspector |
| Mobile stacking | inspector below the chart in 390px runs |
| Horizontal table scroll | table 534px in a 344px container; page never scrolls sideways (380 ≤ 390); scroll hint visible |
| axe-core (wcag2a/aa, wcag21a/aa, wcag22aa) | **24 scans, 0 violations** (rest + selected) |
| Reduced motion | `Enter` pins, `ArrowLeft` steps, `Escape` clears; `(prefers-reduced-motion: reduce)` honoured |
| Console / page errors / hydration mismatch | none in any run |

Baseline (`/patterns/research-workspace`) had reported one minor
`empty-table-header` and four moderate shared-shell `region` nodes; the experiment
reports zero.

## 6. Exact verification commands and outcomes

Run on the server, 2026-10-08.

| Command | Outcome |
| --- | --- |
| `cd luc-ui && pnpm --filter @luc/showcase typecheck` (before fix) | **FAIL** — `TS1127` at `uncertainty/page.tsx:193`, `TS1382` at 198 |
| `cd luc-ui && pnpm --filter @luc/showcase typecheck` (after fix) | **PASS** |
| `cd luc-ui && pnpm verify` | **FAIL (exit 1)** — passed typecheck (packages/ui, apps/showcase, `../luc-web`) and lint (all three), passed `@luc/ui` tests **617 tests / 69 files**, then stopped at `catalog:check`: *`docs/component-catalog.json` is stale* |
| `pnpm --filter @luc/ui catalog:check` | **FAIL** — same stale-catalog portability defect (§2) |
| `pnpm --filter @luc/ui build:package` | **PASS** — tsdown, 213 modules, 203 declarations, 12.4s |
| `pnpm --filter @luc/ui verify:package` | **PASS** — tarball 807 files / 914.7 KB, exports + metadata agree |
| `pnpm --filter @luc/ui test:consumer` | **PASS** — `button-only 5.9/2.1`, `charts 59.1/18.1`, `tradingview 47.2/12.3`, `barrel 9.6/3.0` KB (raw/gzip), subpath isolation intact |
| `pnpm --filter @luc/ui verify:types` | **PASS** — every module entry resolves for ESM and bundler |
| Design Lab Playwright/axe driver | **PASS** — 14 records, 0 findings |
| `git diff --check` | **PASS** |

Not run (with reason): `pnpm qa:changed` / `qa:full` (they drive `qa/routes.mjs`,
which intentionally excludes the experiment routes, and would rebuild the live
3000 container); `qa:providers` (no provider surface touched);
`luc-api`/`luc-web` gates (outside ownership, other agents mid-edit);
`qa:baseline` pixel comparison (the experiment is not a baseline route).

## 7. Files created and modified

Modified (mine):

- `luc-ui/apps/showcase/app/charts/uncertainty/page.tsx` — the one-attribute JSX fix.

Created (mine):

- `luc-ui/docs/research/design-intelligence/experiments/comparison-and-results.md`
- `luc-ui/docs/audits/server-handoff/2026-10-08-luc-ui-server-takeover.md` (this file)
- `luc-ui/docs/research/design-intelligence/experiments/screenshots/_superseded-local-run/` (4 relocated stale screenshots)

Updated (mine): 28 experiment screenshots in
`luc-ui/docs/research/design-intelligence/experiments/screenshots/` re-captured
from the production image, and the experiments `README.md`.

Outside the repository (not repo files):

- `/home/luc/.codex/skills/{frontend-design,composition-patterns,web-design-guidelines}` — the three
  reviewed Skills plus their `SOURCE.md` records.
- `/tmp/luc-ui-qa-compose.yml`, `/tmp/luc-qa/`, `/tmp/luc-design-lab-qa/` — temporary
  QA scaffolding.

Untouched: `luc-ui/packages/ui/**`, all public exports, tokens, the LUC `luc-ui`
Skill, the catalog generator, root `AGENTS.md`, `luc-web/**`, other subprojects,
infrastructure, lockfiles and manifests. Phase 1B's `next-env.d.ts` was briefly
regenerated by a dev-server attempt and restored to the committed content.

## 8. Deployment status

No deployment occurred. The production visual-review stack
(`luc-ui-showcase` → `127.0.0.1:3000`, image `luc-ui/showcase:1.0.0`) is unchanged
and still serving. No production image, container, compose file, service or
network was modified. The temporary isolated QA stack on `3100` was created and
then removed; nothing was exposed beyond loopback. No npm publish, no license
change, no commercial feature.

## 9. LUC UI → Luc Web compatibility impact

**Classification: `NONE`.**

| Change | Component / API | Previous behaviour | New behaviour | Import path | Luc Web uses it? | Verified? | Action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| JSX fix | `luc-ui/apps/showcase/app/charts/uncertainty/page.tsx` (Showcase app, **not** the `@luc/ui` package) | Invalid JSX: the file did not compile, so the route could not typecheck or build | Valid JSX; the page renders `labelMode="auto"` in its description | n/a (Showcase route, not a package entry) | No — Luc Web does not consume Showcase routes | Yes — Showcase typecheck now passes; the string renders identically to intent | None |

`@luc/ui`'s public surface is unchanged: no export, prop, signature, token,
renderer, bundle entry or runtime behaviour was altered. No consumer-breaking
change was introduced, and none was verified as "compatible" merely because unit
tests pass — there is simply nothing to verify. The Design Lab is additive and
lives only under `apps/showcase/app/experiments/`, which no consumer imports.

Background risk outside this task (flagged, not caused here): `catalog:check`
fails on this machine, so `pnpm verify` currently exits non-zero. That is a
verification failure, not an API change.

## 10. Known limitations and deferred work

1. **Catalog portability (must fix).** `generate-catalog.mjs` writes resolved
   `node_modules` paths into the signature strings, so the generated
   `docs/component-catalog.json` is machine-specific and `catalog:check` fails
   everywhere except the authoring machine. Proposed fix: normalise module
   specifiers before stringifying (e.g. rewrite any absolute path containing
   `node_modules` to a stable token such as `node_modules/<pkg>`) and regenerate
   the JSON. This is a Phase 1A generator change and needs explicit authorization.
2. **`DataTable` row selection semantics (shared library).** A controlled single
   selection is not exposed as `aria-selected` on the `<tr>`; the accessible state
   sits on the internal checkbox. The experiment compensates visually. A future
   component change should add row-level selection semantics and a test.
3. **Experiment routes are outside the standing QA tiers.** By design; their
   evidence came from an ad-hoc driver. If they become long-lived, register them
   under a new `experiments` group in `qa/routes.mjs` and `lib/navigation.ts`.
4. **Skill scope.** The three Skills are account-scoped, not repo-scoped, and
   `web-design-guidelines` applies an unpinned live rules document. A move to
   `<repo>/.agents/skills/` and a pinned local rules wrapper are the follow-ups.
5. **Concurrent worktree.** `luc-api`, `luc-web`, `luc-cron`, `luc-jobs` and
   `infra` have another agent's uncommitted changes. Nothing there was read into
   this verdict beyond noting that `luc-web`/`luc-api` are in flux; re-run their
   gates after that work lands.
6. No commit or push was performed; no tag, release or npm publish.

## 11. Suggested Phase 2 priorities (for discussion only — not started)

1. **Fix the catalog generator portability bug**, then make `pnpm verify` green on
   the server. This is the single blocker in the current gate.
2. **Land the Focused Workspace interaction grammar** as a documented,
   consumer-facing recipe (one controlled identity across `DataTable`,
   `ChartInspectionArea`/`ChartSyncGroup` and `InspectorPane`) — the experiment's
   evidence is strongest there and it needs no new component.
3. **Add row-level selection semantics to `DataTable`** (`aria-selected` and a
   keyboard/AT test) so the recipe is accessible without a compensating badge.
4. **Resolve the light-theme surface depth step** (default / raised / overlay
   luminance) as a token-only trial, measured against the three-level rule.
5. **Move the reviewed Skills to `<repo>/.agents/skills/`** and pin the
   web-design-guidelines rules document locally.
6. Only then consider new components — the design-intelligence research found the
   library already has broad coverage, so Phase 2 should bias toward composition,
   documentation and accessibility rather than component count.
