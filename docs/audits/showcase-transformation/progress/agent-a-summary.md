# Agent A — Progress Summary & Change Log

Updated: 2026-10-12. Author: Agent A.
Authoritative detail, evidence and per-item reasoning:
[`agent-a-ledger.md`](agent-a-ledger.md) (§1–§19).

**Phase 2 (2026-10-12) in one paragraph:** `pnpm verify:i18n` is **green** (the
false positives were code, not prose, so the extractor learned to tell them
apart); the browser-only `/zh` redirect defect was **reproduced and fixed** on
every Agent A page, leaving 6 Agent B `/visuals` routes with a precise handoff;
**Motion is a primary destination** with the header fitting at 1024/1280/1440/390;
**all 26 motion gallery tiles render the real component**; and MOT-003 closed with
a page Replay control plus a proven reduced-motion path. Detail: ledger §20.

Starting revision `83aae8d0` (`codex 43`, branch `main`). The working tree is
shared with a live **Agent B** writing `packages/visuals/**` and
`apps/showcase/{app,lib,components}/visuals/**`; that was observed repeatedly
(one of its unit tests changed its failing case name between two runs, then went
green without a change from here).

**No commit, push, deployment or production change was made.** Nothing outside
`luc-ui/` was touched, no other project's port or container was stopped, and the
shared lockfiles are untouched.

---

## 1. Delivery state

| Status | Count | Items |
|---|---|---|
| IMPLEMENTED / SELF_TESTED | 23 | CMP-001, IA-001, IA-005, QA-001, QA-005, UX-001, UX-002, UX-004, UX-005, WB-001…WB-005, MOT-001, MOT-003, MOT-004, CHT-001, CHT-002, DEV-001…DEV-003, DOC-001 (motion half) |
| DELEGATED to Agent B | 5 | IA-002, IA-004, VIS-001…003 (plus DOC-001's `/visuals` banner row) |
| BLOCKED | 1 | `LEG-001` — needs `OPEN-04` (answered, needs the decision table written) |
| TODO | 17 | IA-006, IA-007, UX-003, MOT-002, DOC-002, DOC-003, DOC-004, DOC-005, LEG-001, LEG-002, LEG-003, LEG-004, LEG-005, QA-002, QA-003, QA-004 |

Nothing here is `VERIFIED` — that needs the independent pass the user runs on
return.

## 2. What a user sees differently now

1. `/components/native-select` and `/components/project-showcase` render instead
   of a Next.js error page, and are interactive (the select changes value; the
   project tile opens its detail without navigating).
2. **The "On this page" rail describes the page again.** `/visuals/elements`
   went from 73 rows — 63 of them card titles — to the 10 real family sections;
   `/motion/spatial` from 25 to 8; `/components/popover` from 15 to 7;
   `/blocks` from 30 to 6; `/components` shows no rail at all, because its 13
   family rows were the sidebar over again. No duplicate labels, no
   specimen-owned rows, no over-budget rails: **227 routes swept, 0 failures**.
3. **The Workbench panel is usable.** Controls are grouped (essential · variant ·
   advanced, with advanced collapsed), each family has a preset row derived from
   its own option list (`ready / loading / empty / error` for a chart,
   `default / raised / outline / ghost` for a Card), and a control that cannot
   take effect is **disabled with a sentence** — set a chart to `error` and the
   Legend switch greys out saying why.
4. **Presentation follows the reader** (WB-005): stage theme, preview width and
   the presentation controls a spec marks `sticky` (chart height/state, control
   size) are remembered, so opening the next chart does not re-ask the question.
   Reset clears the memory too.
5. **Detail pages end with somewhere to go** (UX-005): 2–4 canonical *Related*
   links plus previous/next, on every registry entry page.
6. **Every chart-catalogue row is addressable** (CHT-002): 80 rows deep-link at
   their own registry id.
7. **`pnpm dev` hydrates again** (DEV-001) — see §4.

## 3. `next dev` (DEV-001) — root cause and fix

The dev server refused the HMR websocket when the browser's `Origin` was the
loopback **IP**; it answered the upgrade with a bare `Unauthorized` body carrying
no HTTP status line, which Chrome can only read as
`net::ERR_INVALID_HTTP_RESPONSE`. Next's dev client defers `hydrateRoot` until
that socket connects, so the page rendered its server HTML, logged the React
banner, and never responded to a click. `next build && next start` was never
affected — which is why a whole phase of production-build measurement missed it.

Fixed by declaring `allowedDevOrigins: ["127.0.0.1", "[::1]", "localhost"]` in
`apps/showcase/next.config.ts`, gated by `qa/dev-hmr.mjs` (`pnpm qa:dev`) and
written up in [`docs/DEV_MODE.md`](../../../DEV_MODE.md).

## 4. Source changes made by Agent A

| File | Change |
|---|---|
| `apps/showcase/next.config.ts` | `allowedDevOrigins` — the DEV-001 fix |
| `apps/showcase/components/docs/page-outline.tsx` | specimen/`article`/catalogue exclusions, top-level-section rule, unique anchors |
| `apps/showcase/components/docs/doc-entry.tsx` | `RelatedEntries`: 2–4 canonical links via declared → family peers → reading order |
| `apps/showcase/components/playground/{types,engine,state,shell,controls}.tsx` | WB-003 bands + derived presets; WB-004 `disabledWhen`/`minSelected` + reasons; WB-005 sticky store; width/label update |
| `apps/showcase/components/playground/adapters/*.tsx` (8) | bands, `presetSource`, `sticky`, and the three `disabledWhen` declarations |
| `apps/showcase/app/components/page.tsx` | rail suppressed (sidebar duplicate) |
| `apps/showcase/app/charts/catalog/page.tsx` | per-row anchor ids + link |
| `apps/showcase/lib/i18n/prose.zh.ts` | zh for every new sentence |
| `apps/showcase/tests/unit/playground-engine.test.ts` | +9 cases (WB-003/004/005) |
| `apps/showcase/package.json` | `qa:preview`, `qa:dev`, `qa:standalone`, `qa:nav` |
| `apps/showcase/qa/{preview-check,dev-hmr,standalone,navigation}.mjs` | **new** re-runnable gates |
| `apps/showcase/qa/{outline,playground}.mjs` | `--all` sweep, row budget, duplicate-label check; presets/advanced/inert-reason checks; screenshots |
| `packages/ui/src/components/native-select.tsx` | the missing `"use client"` (CMP-001) |
| `apps/showcase/components/demo/islands/experience-demo.tsx` | **new** client island (CMP-001) |
| `apps/showcase/lib/demo/components/experiences.tsx`, `lib/demo/motion/spatial.tsx` | use the island; Card Stack snippet |
| `apps/showcase/components/demo/islands/d-motion.tsx` | Card Stack starts at index 0 |
| `apps/showcase/app/{motion,date-time/time,foundations/themes}/**`, `lib/i18n/messages.ts` | phase labels removed; the `/date-time/time` hydration fix |
| `apps/showcase/app/blocks/page.tsx`, `app/motion/{kinetic,signature,spatial}/page.tsx` | copy/labels |
| `docs/{LOCAL_PREVIEW,DEV_MODE}.md`, `docs/audits/showcase-transformation/06_LOCAL_DEVELOPMENT_PLAN.md` §11 | the local preview, DEV-001, DEV-002/003 |
| `docs/audits/showcase-transformation/04_ACTION_PLAN.md` | §10 addendum: `QA-005` |

## 5. Verification run (all against the local Docker preview)

Compose project `luc-ui-local` · container `luc-ui-showcase-local` · network
`luc-ui-local_default` · image `luc-ui/showcase:1.0.0` · loopback only, port
re-read from `docker port` after every rebuild (never assumed).

| Check | Command | Result |
|---|---|---|
| Route health | `node qa/route-health.mjs` | **326/326 healthy**, 38.1 s |
| Outline sweep | `node qa/outline.mjs --all --max-rows=12` | 227 routes, **0 failures** |
| Playground | `node qa/playground.mjs` | 5/5 — presets, collapsed advanced, **0 silent disabled controls** |
| Navigation | `node qa/navigation.mjs` | 9/9 — UX-005 ×7, WB-005, CHT-002 |
| Preview smoke | `node qa/preview-check.mjs` | 6/6 — real interactions, no console errors |
| Card Stack | `node qa/card-stack.mjs` | 4/4 (negative result maintained) |
| Standalone | `node qa/standalone.mjs` | 358 files, 0 imports, 0 requests, 0 deployment vars |
| Typecheck / lint | `pnpm --filter @luc/showcase …` | 0 / 0 |
| Unit tests | `pnpm --filter @luc/ui test:showcase` | **132/132** |
| i18n | `pnpm verify:i18n` | **red**: the same 2 sentences in Agent B's `components/visuals/element-detail.tsx`, counted per route (338 = 2 × 169). Every Agent A sentence is translated |

Evidence JSON and screenshots: `luc-ui/artifacts/screenshots/showcase-transformation/`
(gitignored) — including `preview-*.png`, `playground-*.png` and the four probe
reports.

## 6. Decisions requiring the user

1. **`OPEN-02` (Motion's header tier, IA-005)** and **`OPEN-04` (are the
   `/visuals/*` resource pages product or internal, LEG-001)** — both still open;
   IA-007 depends on IA-005, LEG-002 on LEG-001.
2. **WB-002 and ADR-018**: the width control resizes a container and is labelled
   (`Full / 768 / 390`). Confirm that is acceptable, or ask for a real nested
   browsing context.
3. **Agent B's i18n gap** (2 sentences, false positives from import statements)
   keeps `pnpm verify` red.
4. **DOC-005**: whether the long-form zh body is batched or declared
   English-with-a-notice.
5. **The orphan `next-server` on `:3124`** (pid 20780, cwd `apps/showcase`, parent
   pid 1) is documented but not owned by Agent A and left running. If nobody
   claims it, it can be stopped; it is *not* the preview URL.

## 7. Instructions for the independent verification pass

1. Start the preview (URL changes every rebuild — read it, do not assume):
   `cd luc-ui && docker compose -p luc-ui-local -f docker-compose.yml -f docker-compose.local.yml up -d --build`
   then `docker port luc-ui-showcase-local 3000`.
2. Run the gates with `LUC_QA_BASE_URL=http://127.0.0.1:<port>`, and read the
   output rather than the summary: `qa/route-health.mjs`, `qa/outline.mjs --all`,
   `qa/playground.mjs`, `qa/navigation.mjs`, `qa/preview-check.mjs`,
   `qa/card-stack.mjs`, `qa/standalone.mjs`.
3. Show a gate failing: `qa/standalone.mjs` is the cheapest — add a file with
   `import x from "luc-api"` and watch it exit 1.
4. For DEV-001, start `PORT=3300 pnpm dev` and run `pnpm qa:dev`; then confirm the
   negative side by removing `allowedDevOrigins` and watching hydration stop.
5. Compare the outline tables in `agent-a-ledger.md` §3/§16 against a live read,
   and confirm the delegated rows (IA-002, UX-004 visuals, DOC-001 visuals,
   VIS-001…003, IA-004) are still open in Agent B's tree.
