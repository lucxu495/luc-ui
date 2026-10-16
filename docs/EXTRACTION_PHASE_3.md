# Phase 3 — first public release

Phase 1 extracted this repository from `luc-quant`; Phase 2 moved the Visuals
product out. Phase 3 is the one that made it *publishable*: the closed-source
material that was still here went to `luc-visuals`, the library inherited defects
were fixed, and the package became installable from a git tag.

## 1. Safety: what left, and why

The first public commit must not carry the Visuals product. Three directories
were the design and verification record of it, written while it lived here:

| Path | Size | Where it went |
| --- | --- | --- |
| `docs/visual-architecture/**` (31 files) | 1.5 MB | `luc-visuals/docs/visual-architecture/` |
| `docs/audits/phase-10a/**` (the art-direction studies Visuals grew out of) | 88 KB | `luc-visuals/docs/audits/phase-10a/` |
| `docs/audits/phase-10b/**` (29 files + 43 i18n dictionaries) | 860 KB | `luc-visuals/docs/audits/phase-10b/` |

Nothing was deleted to make a check pass: the trees were copied to the repository
that owns them and verified complete (`diff -rq` reported no differing file and
nothing missing on either side) before the originals were removed. The two
`i18n-merge.mjs` handoff directories that pointed at them were dropped, and two
`QA_WORKFLOW.md` references now say where those write-ups live.

What stayed, deliberately, is the UI record: `docs/audits/phase-1b … phase-9`,
`showcase-transformation` (the Showcase IA audit), `server-handoff`, the phase-2/4
plan documents, and every committed baseline and screenshot under `artifacts/`.
All 25 committed pixel baselines are UI surfaces; no Visuals page is among them.

Scanned and clean: no `.env` file, no credential-shaped string, no private key,
no internal service URL. The only absolute local paths are inside historical
audit logs under `docs/audits/**`, where they name a checkout directory and
disclose nothing else; they were left verbatim rather than rewritten.

## 2. Quality: the inherited backlog, closed

Phase 1 listed three axe findings and two failing behaviour assertions as
inherited. All are now fixed at the source rather than re-listed:

* **`FileUpload` had an unnamed file input.** The `sr-only` `<input type="file">`
  is opened by the visible "Browse files" button, and nothing in the
  accessibility tree named it — a critical `label` violation. It now takes an
  `inputLabel` prop, defaulting to `title`, and `v5-components.test.tsx` asserts
  the accessible name.
* **`MagnifyDockItem` put `aria-label` on a `generic` element.** Prohibited, and
  the name reached nobody. A labelled item is now `role="group"`, which is the
  role that says what the label says and keeps the control inside the item in the
  accessibility tree — `role="img"` would have made its children presentational.
* **"alert live roles are opt-in" measured the default.** The check asserted a
  live region existed on a page that correctly has none until a consumer asks for
  one; it now clicks "Break the connection" first, and asserts the *absence* at
  rest as well, which is the property the check is named for.
* **The navigation spill check counted zero-width nodes.** Four 0 × 0 nodes report
  `left = 0`, which the comparison read as "0 px left of a container starting at
  256 px". A node with no horizontal extent cannot spill horizontally.

## 3. Distribution: a git tag, not a registry

The tag is the release. `pnpm --filter @luc/ui release:build` packs
`packages/ui` — which applies `publishConfig`, turning `exports` → `src` into
`exports` → `dist` — unpacks the tarball into `release/`, and that tree is
committed on the orphan `release` branch and tagged. A consumer writes
`github:lucxu495/luc-ui#v1.0.0` and installs the built package with no install
script and no allow-list entry. `docs/RELEASES.md` is the contract;
`docs/CONSUMERS.md` is the consumer's side.

Two things had to be built to make that trustworthy rather than asserted:

* `release:check` (inside `pnpm verify`) rebuilds from `src` and compares. It
  compares `.d.ts` through a TypeScript parse with union members sorted, because
  the dts bundler does not emit union member order deterministically — JavaScript,
  CSS and the manifest are byte-identical across builds, and that was measured.
* `git-consumer.mjs` installs the release from a git ref in a directory that has
  never seen this repository, with no build-script permission for `@luc/ui`, and
  runs the same consumer assertions as the packed-tarball proof.

One bug in existing tooling surfaced along the way: the `pnpm pack` cache was
keyed on `package.json` + `dist/` only, so editing `README.md` and re-packing
returned the previous tarball. It is keyed on the manifest's `files` array now.

## 4. What this phase did not do

`luc-web`'s dependency migration and the retirement of the `luc-ui` directory
inside `luc-quant` are separate steps with their own risk, and they are reported
in the Phase 3 report rather than assumed here.
