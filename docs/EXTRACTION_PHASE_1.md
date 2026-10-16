# Phase 1 — extraction from `luc-quant`

On **2026-10-16** this repository was created by copying the `luc-ui/` directory
out of the `luc-quant` monorepo at commit
`44de505c04324c7773804c531ee374b9598a88a0` (`44de505c`, "codex 55").

Phase 1 is a **copy**, not a refactor: the goal was a repository that installs,
builds, tests and runs on its own while changing no product behaviour and no
pixels, and that leaves `luc-quant` untouched. `luc-visuals` was **not** split
out — `packages/visuals` is still here, unmodified, and is still closed source.
Nothing was pushed, committed on the remote, tagged or published.

## What moved, and what did not

The source was exported with `git archive HEAD:luc-ui`, which yields exactly the
files `luc-quant` tracks under `luc-ui/` and nothing else. That single decision
is what kept the copy safe:

**Copied** — 2109 tracked files: `apps/showcase`, `packages/ui`,
`packages/visuals`, `docs/`, `artifacts/` (committed baselines and review
evidence), `scripts/`, `skills/`, `eslint-rules/`, the root config, and the two
`@luc/ui` / `@luc/visuals` generated registries.

**Not copied** — the monorepo's `.git`; every `node_modules`; generated
`dist/`, `.next/`, `.next-*/` and `*.tsbuildinfo`; the transient QA output under
`artifacts/` (screenshots, `qa-report.json`, `artifacts/qa`, `artifacts/pack`);
and every `.env*` file. A scan of the resulting tree found no credential, key or
token material.

Every copied file was verified byte-for-byte against its `luc-quant` blob. The
only files that differ are the ones listed below: sixteen edited and five new.
Most had to change because the pnpm workspace root moved from `luc-quant/` to
this directory; the rest are the two fixes in "Inherited defects" and the Compose
identity change in "The Docker stack".

## What had to change

Everything *inside* `luc-ui/` used paths relative to its own directory, so it
kept working untouched. Only the code that escaped the directory — four relative
references to the monorepo root and the Docker build context — needed a change.

New files at the repository root:

| File | Why |
| --- | --- |
| `pnpm-workspace.yaml` | This directory is now the workspace root; members are `apps/*` and `packages/*` (the old list also named `luc-ui` and `luc-web`). |
| `.npmrc` | Copied verbatim from the monorepo root, where pnpm read it. |
| `.dockerignore` | Replaces the monorepo's whole-repository one. The two QA artifact roots are anchored (`/artifacts`, `/apps/showcase/artifacts`) on purpose: an unanchored `artifacts` also matches the *source* directory `packages/visuals/src/artifacts/`. |
| `pnpm-lock.yaml` | Generated fresh for a four-importer workspace. See "The lockfile" below. |
| `docs/EXTRACTION_PHASE_1.md` | This record. |

Edited files:

| File | Change |
| --- | --- |
| `Dockerfile` | Build context is this repository root; `COPY . .` replaces `COPY luc-ui ./luc-ui`, and the runner copies `apps/showcase/…` instead of `luc-ui/apps/showcase/…`. |
| `docker-compose.yml` | `build.context: .`, `dockerfile: Dockerfile`, and its own project / image / container name. See "The Docker stack". |
| `docker-compose.local.yml` | The matching local identity, and documentation. |
| `scripts/qa-server.mjs` | `HASH_ROOTS` names the four workspace manifests at this root instead of `../…`; the container-name matcher and its log line follow the new Compose identity. |
| `scripts/preview-inputs.test.mjs` | Reads `packages/<name>/package.json` from this root, not `<monorepo>/luc-ui/packages/…`. |
| `apps/showcase/qa/route-map.mjs` | Every rule lost its `^luc-ui/` prefix, because `git diff` paths are now already relative to this repository root. |
| `apps/showcase/qa/run.mjs` | `changedFiles()` no longer prefixes `luc-ui/`. |
| `apps/showcase/qa/preview-check.mjs` | One documented `docker port` command follows the new container name. |
| `packages/visuals/scripts/limitations-i18n-check.mjs` | `repoRoot` is `packages/visuals/../..`, and the handoff/dictionary paths lost `luc-ui/`. |
| `package.json` | `verify:visuals` builds `@luc/visuals` before checking it — see "Inherited defects" below. |
| `docs/component-catalog.json` | Regenerated. See "The catalog" below. |
| `README.md` | Standalone quick start and directory tree. |
| `apps/showcase/qa/behaviour.mjs` | One missing navigation — see "Inherited defects" below. |
| `docs/QA_WORKFLOW.md`, `docs/LOCAL_PREVIEW.md`, `docs/DEV_MODE.md` | The Compose project, image and container names they document. |

### The lockfile

`pnpm install` writes a *different* lockfile depending on which `pnpm@12.6.0`
binary runs it. A pnpm that manages the version named in `packageManager`
records `packageManagerDependencies` (pnpm itself, plus its platform binaries)
in the root importer; the Homebrew build does not. The Docker build installs
pnpm from npm and does record them, so a lockfile written by the host failed
`pnpm install --frozen-lockfile` inside the image with
`ERR_PNPM_FROZEN_LOCKFILE_WITH_OUTDATED_LOCKFILE`.

The committed lockfile is the one the container produced, and the host accepts
it: `pnpm install --frozen-lockfile` succeeds on macOS against the same file.
It is 158 lines longer than the host's, and `luc-quant`'s own lockfile has the
same block, so this is the form the repository already expected.

### The catalog

`docs/component-catalog.json` records, for each exported symbol, the file
TypeScript resolved it from. Under the monorepo the pnpm virtual store sat *beside*
`luc-ui/`, so third-party sources were written as `../node_modules/.pnpm/…`.
Here the store is *inside* the repository root, so they are
`node_modules/.pnpm/…`. Regenerating changed exactly 44 `source` fields and
nothing else — no signature, no export, no count. `docs/COMPONENT_CATALOG.md` is
byte-identical.

### The Docker stack

The stack used to derive its identity from `luc-quant`'s `luc-ui/` directory:
Compose project `luc-ui` (from the directory name, which also names the default
network `luc-ui_default`), image `luc-ui/showcase:1.0.0`, container
`luc-ui-showcase`. Two checkouts of the same files collide on all three, so the
standalone stack is now project `luc-ui-standalone`, image
`luc-ui-standalone/showcase:1.0.0`, container `luc-ui-showcase-standalone`, and
the local-preview override is `luc-ui-standalone-local` /
`luc-ui-showcase-standalone-local`. `luc-quant`'s own names are untouched.

## Inherited defects (present in `luc-quant`, not caused by the extraction)

These were found while verifying the copy. None of them was introduced here: the
files involved are byte-identical to `luc-quant` at `44de505c`, and the two
behavioural symptoms below are in assertions that the current source cannot
satisfy.

1. **`qa:full` could not start.** `behaviour.mjs` measured
   `[data-slot="transfer-list"]` while the current page was
   `/components/color-picker`, because the navigation to
   `/components/transfer-list` is missing. The 30 s locator timeout aborted the
   tier before the route sweep. **Fixed here** by adding the navigation the
   check's own intent requires, and the tier now completes.
2. **`verify:visuals` could not run on a clean checkout.**
   `limitations-i18n-check.mjs` imports `packages/visuals/dist/index.js`, and
   nothing in the root `verify` chain built it. It happened to pass in
   `luc-quant` because a `dist/` from earlier work was on disk. **Fixed here** by
   building the package first.
3. **Two behaviour assertions still fail** (153/155 pass) and were left alone
   deliberately, because deciding which side is wrong is a product judgement:
   * *"alert live roles are opt-in, not default"* requires a `role="status"`
     region on `/components/alert`. That alert is rendered only after the
     "Break the connection" button is pressed, and the check never presses it.
   * *"Navigation page: the tree scrolls, nothing spills…"* counts four
     zero-area (0 × 0) nodes as horizontal spills. The page's container spans
     256 → 1440 px and nothing real crosses it.
4. **Three axe violations** in the full sweep (568 scans): a critical `label`
   finding on `/components/file-upload` (a visually hidden
   `<input type="file">` with no `<label for>`), and a serious
   `aria-prohibited-attr` on `/motion/magnify-dock` (`aria-label` on a `div`
   with no role).
5. **The committed pixel baselines are stale.** `pnpm qa:baseline` fails 4 of
   10; the captured pages have changed height since the baselines were recorded
   on 2026-10-13 (`/components/buttons` 3008 → 3593 px, `/components` 5145 →
   5429 px, `/charts/line-chart` 5636 → 5617 px, `/motion/card-stack` 4389 →
   4352 px). The six surfaces whose content did not change pass, including the
   home and docs pages, which is the actual evidence that the extraction left
   fonts, tokens, CSS and the shell rendering identically.
6. **Absolute local paths** survive in 22 files under `docs/audits/**`
   (historical logs and one-off probe scripts that import Playwright from
   `/home/luc/code/luc-quant/node_modules/…`), in two `packages/visuals/docs`
   reports, and in two `packages/ui/scripts` *fixtures* that deliberately assert
   the path rewrite. They are historical evidence and were not rewritten.

## Phase 2 notes

* `packages/visuals` is closed source and is still in this repository. It must
  not reach a public history before the Phase 2 split; that is why Phase 1
  commits nothing.
* `apps/showcase` is the shared surface: `/visuals/**` (11 routes, plus
  `lib/visuals/**`, `components/visuals/**` and 26 files importing
  `@luc/visuals`) belongs to Visuals, while everything else belongs to LUC UI.
  The split line is the `@luc/visuals` import graph, not the directory tree.
* Consumers already exist outside this repository and outside `luc-quant`'s
  workspace: `luc-render` and `luc-network/desktop-v1` depend on `@luc/ui`
  through packed tarballs (`file:…/luc-ui-1.0.0.tgz`), and `luc-web` depends on
  it through `workspace:*`. Replacing those with a Git tag/commit dependency is
  a Phase 2 task, and the tarball path is the pattern to follow.
* `.context/docs/luc-ui/index.md` in `luc-quant` still describes `luc-ui` as a
  subproject of that monorepo. That file is owned by that repository and was
  **not** edited from here.
