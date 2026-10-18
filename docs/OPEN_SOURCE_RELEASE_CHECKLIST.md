# Open-source release checklist

This is the public release state of Luc UI on 2026-10-18. It records the
verification behind the published `v1.0.1` GitHub Release.

## Current state

| Fact | Value |
| --- | --- |
| Package | `@luc/ui` |
| Package version | `1.0.1` |
| Public tag | `v1.0.1` |
| Tag commit | `git rev-parse v1.0.1^{}` |
| GitHub Release | public, with tarball, manifest and SHA-256 |
| Release branch | `release` |
| npm registry | not published |
| Install path | Git tag or packed release tarball |
| License | MIT |

`v1.0.0` remains at `1ea6cd7b7dad96d9b60daf4654ade2721a0ab5e0`.
Both public tags are immutable and must not be moved or force-pushed.

## Version decision

The Phase 3 audit compared the public export map, package exports, required
peers and the component/type diffs against the source of `v1.0.0`. No export
was removed or moved, no required prop or peer was added, and no existing prop
type was narrowed. The release candidate is therefore **patch**:
`1.0.1`.

A new public prop, subpath or component would require `1.1.0`; a breaking API,
token or package-shape change would require `2.0.0`.

The approved version is written into `packages/ui/package.json`; the generated
release tree and public tag both carry `1.0.1`.

## Pre-release checklist

- [x] Review the complete consumer-visible diff since `v1.0.0`.
- [x] Update `CHANGELOG.md` with migrations for any consumer-visible change.
- [x] Run `pnpm verify` on the release commit.
- [x] Run `pnpm test:consumers` against the packed artifact.
- [x] Run `pnpm test:consumers -- --mode=remote --ref=v1.0.1` from the public tag.
- [x] Run `pnpm qa:full` and record browser/axe results.
- [x] Review all Darwin and Linux visual differences and record the decision in
  [`RELEASE_V1_0_1_VISUAL_ACCEPTANCE.md`](./audits/RELEASE_V1_0_1_VISUAL_ACCEPTANCE.md).
- [x] Update only the reviewed host-local baselines; keep Darwin and Linux
  snapshots isolated.
- [x] Make browser QA and Linux visual regression separate required CI jobs.
- [x] Build `release/` with `pnpm --filter @luc/ui release:build`.
- [x] Run `pnpm --filter @luc/ui release:check`.
- [x] Record the tarball SHA-256 and `release/RELEASE.json`.
- [x] Confirm the release commit is on the generated `release` branch.
- [x] Create the tag as `v<package version>`.
- [x] Verify fresh npm and pnpm remote installs from the new tag.
- [x] Record the GitHub Actions run for the release commit.
- [x] Publish the GitHub Release and verify its downloadable assets.

## Consumer upgrade

Pin the exact tag:

```json
{ "dependencies": { "@luc/ui": "github:lucxu495/luc-ui#v1.0.1" } }
```

Run the consumer's build and browser smoke test before merging the dependency
update. A lockfile records the resolved commit for a Git install.

## Rollback and withdrawal

- Revert the consumer to the previous immutable tag.
- Do not move or delete a public tag as a rollback strategy.
- If a release is unusable, document the reason and publish a new patch; retain
  the old tag for auditability.
- A tarball is identified by its version and SHA-256. Replacing a tarball in
  place requires a version decision, not a silent overwrite.

## Out of scope

The npm registry remains unpublished. This release does not authorize an npm
publish, a remote production deployment or another baseline update.
