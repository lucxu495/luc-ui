# LUC UI Showcase Transformation — Audit & Master Plan

Read-only product, IA and frontend-architecture audit of the LUC UI Showcase,
plus a competitor study and a prioritised, evidence-based transformation plan.
**No application code was changed by this audit.**

Audited revision: `ec3c097d744b16de468d43d46a4fd76d54a9095d` (branch `main`) with a
large in-flight, uncommitted working tree under `luc-ui/**`
(123 changed paths, ~50 new untracked files). Running showcase:
Docker image `luc-ui/showcase:1.0.0`, built 2026-10-11T09:32:52Z, serving
`http://127.0.0.1:3000`, which already contains the in-flight Visuals work.
See `01_CURRENT_STATE.md` §1 for the exact provenance caveats.

## Read in this order

| # | Document | What it answers |
|---|---|---|
| 1 | [01_CURRENT_STATE.md](01_CURRENT_STATE.md) | What LUC UI actually is today: routes, navigation, catalogs, workbenches, debt, verified defects |
| 2 | [02_COMPETITOR_RESEARCH.md](02_COMPETITOR_RESEARCH.md) | How nine leading libraries present components, with a comparison matrix and transferable patterns |
| 3 | [03_SHOWCASE_DESIGN_SPEC.md](03_SHOWCASE_DESIGN_SPEC.md) | The target experience: navigation rules, IA, page templates, workbench model, copy policy |
| 4 | [04_ACTION_PLAN.md](04_ACTION_PLAN.md) | **The operational document.** Prioritised action items with acceptance criteria and evidence requirements |
| 5 | [05_QUALITY_GATE.md](05_QUALITY_GATE.md) | Why green tests did not equal a working product, and the acceptance/release protocol that fixes it |
| 6 | [06_LOCAL_DEVELOPMENT_PLAN.md](06_LOCAL_DEVELOPMENT_PLAN.md) | Feasibility and sequence for moving UI development off the shared production host |

Machine-readable inventories: [`data/routes.csv`](data/routes.csv) (326 routes),
[`data/components.csv`](data/components.csv) (223 registry entries),
[`data/navigation.csv`](data/navigation.csv), [`data/findings.csv`](data/findings.csv),
[`data/competitors.csv`](data/competitors.csv).

## How the research was done

- **Source reading first.** Every count in these documents is derived from the
  current working tree (`packages/ui`, `packages/visuals`,
  `apps/showcase/lib/**`), not from earlier audit reports. Where an earlier
  report and the current source disagree, the discrepancy is recorded.
- **Live observation second.** A real Chromium drove the running Showcase:
  a 57-route structural sweep, a 326-route HTTP link crawl, targeted workbench
  and motion interaction probes, and geometry measurement.
- **Competitors third.** Nine real websites were visited in a real browser on
  2026-10-11 and their structure recorded (sidebar, preview, code access,
  container tabs, mobile behaviour). No competitor source code or imagery was
  copied; only observable structure was studied.
- **Harnesses** live in [`tools/`](tools/) and are re-runnable:
  `node tools/browser-sweep.mjs --shots`,
  `node tools/card-stack-probe.mjs`, `node tools/ux-probe.mjs`,
  `node tools/detail-probe.mjs`, `bash tools/link-crawl.sh`,
  `node tools/competitor-probe.mjs`.
  Raw evidence (screenshots, JSON) is written only to the gitignored
  `luc-ui/artifacts/screenshots/showcase-transformation/**` — it is **not**
  committed.

## How to read the evidence labels

Every finding carries one label:

- **OBSERVED** — directly verified in source or in the running browser.
- **SOURCE_ONLY** — established from code, not live-verified.
- **REPORTED** — supplied by the user or an earlier report; not re-verified.
- **INFERRED** — plausible interpretation that still needs validation.
- **UNVERIFIED / UNKNOWN** — insufficient evidence. `04_ACTION_PLAN.md` never
  marks a defect fixed on the strength of an unverified claim.

## How implementation agents should use the action plan

1. Pick **one** action item by ID (`IA-003`, `MOT-002`, …). IDs are stable and
   must never be renumbered or reused.
2. Read its problem statement, forbidden scope, dependencies, acceptance
   criteria and required evidence *before* editing anything.
3. Implementation agents may set a task's status to `IMPLEMENTED`. Only an
   **independent** verification pass — a different agent, or the user — may set
   `VERIFIED`, and only with the evidence the item names.
4. Never check an implementation checkbox in this audit's documents. Research
   checkboxes are the only ones that may be ticked, and only against evidence.
5. Do not batch unrelated items. The plan is batched deliberately to avoid two
   agents editing the same files; respect the "risk to concurrent agents" field.

## Status vocabulary

`TODO` · `IN_PROGRESS` · `IMPLEMENTED` · `VERIFIED` · `BLOCKED` · `DEFERRED`

A task is not VERIFIED because code exists, tests pass, or a screenshot looks
acceptable. It is VERIFIED when its named acceptance criteria have supporting
evidence recorded in the change log at the bottom of `04_ACTION_PLAN.md`.
