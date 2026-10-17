# Open-source release checklist

This is the release read/unpublished state of Luc UI on 2026-10-18. It is a
checklist, not a published release announcement.

## Current state

| Fact | Value |
| --- | --- |
| Package | `@luc/ui` |
| Package version | `1.0.0` |
| Public tag | `v1.0.0` |
| Tag commit | `1ea6cd7b7dad96d9b60daf4654ade2721a0ab5e0` |
| Release branch | `release` |
| npm registry | not published |
| Install path | Git tag or packed release tarball |
| License | MIT |

`v1.0.0` is immutable. The tag must not be moved or force-pushed.

## Version decision

No version is chosen by this checklist. If the changes currently on `main` are
released after `v1.0.0` and contain only backward-compatible fixes, package
metadata or README changes, the smallest SemVer-correct candidate is
`1.0.1`. A new public prop, subpath or component requires `1.1.0`; a breaking
API, token or package-shape change requires `2.0.0`.

The version must be chosen from the actual diff and approved before a tag is
created.

## Pre-release checklist

- [ ] Review the complete consumer-visible diff since `v1.0.0`.
- [ ] Update `CHANGELOG.md` with migrations for any consumer-visible change.
- [ ] Run `pnpm verify` on the release commit.
- [ ] Run `pnpm test:consumers` against the packed artifact.
- [ ] Run `pnpm test:consumers -- --mode=remote` against the existing public tag.
- [ ] Run `pnpm qa:full` and record browser/axe results.
- [ ] Review visual differences; do not update baselines without approval.
- [ ] Build `release/` with `pnpm --filter @luc/ui release:build`.
- [ ] Run `pnpm --filter @luc/ui release:check`.
- [ ] Record the tarball SHA-256 and `release/RELEASE.json`.
- [ ] Confirm the release commit is on the generated `release` branch.
- [ ] Create the tag as `v<package version>` only after approval.
- [ ] Verify a fresh remote install from the new tag.
- [ ] Record the GitHub Actions run for the release commit.

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

This checklist does not authorize npm publish, a GitHub Release, a tag, a remote
deployment or a baseline update. Those require a separate approval.
