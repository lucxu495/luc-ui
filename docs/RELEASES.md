# Releasing `@luc/ui`

`@luc/ui` is not published to a registry. It is published as a **git ref** that
points at a commit whose root is the built package. This document is the
contract: what a release is, how to make one, and what a consumer can rely on.

Current public state: package `1.0.0`, tag `v1.0.0`, commit
`1ea6cd7b7dad96d9b60daf4654ade2721a0ab5e0`. The tag is immutable. See
[OPEN_SOURCE_RELEASE_CHECKLIST.md](./OPEN_SOURCE_RELEASE_CHECKLIST.md) before
cutting a successor.

```bash
pnpm add @luc/ui@github:lucxu495/luc-ui#v1.0.0
```

## Release candidate `1.0.1`

`main` contains the reviewed `1.0.1` release candidate. It fixes accessibility
and documentation defects without changing the public export map, required
peers or package layout. The recommended SemVer bump is **patch**.

The candidate is intentionally not exposed to consumers yet:

- `packages/ui/package.json` still says `1.0.0`;
- no `v1.0.1` tag or GitHub Release exists;
- npm has not been published;
- the current public install remains the immutable `v1.0.0` tag.

The source commit, packed artifact and both clean-consumer builds are verified
before tagging. The release candidate must not be represented as an available
install until a successor tag is approved and verified from a fresh directory.

## Why a branch and a tag, and not `#main`

The repository root is a pnpm workspace (`apps/*`, `packages/*`), and the
package is at `packages/ui`. Neither obvious git spec works:

| Spec | What a consumer gets | Why not |
| --- | --- | --- |
| `github:lucxu495/luc-ui#v1.0.0` | the **root** package, `luc-ui-workspace` | it is `private` and exports nothing |
| `…#v1.0.0&path:packages/ui` | `exports` → `src/*.ts` | a git fetch reads the manifest verbatim; npm and pnpm apply `publishConfig` when they *pack*, never when they *fetch*. The consumer would compile this repository's TypeScript instead of installing the package it publishes |
| `…#v1.0.0&path:packages/ui` + `prepare` | built package ✓ | every consumer must allow-list an install-time build script by *resolved git URL* — `onlyBuiltDependencies` wants the full spec including the commit, so it is pasted from an error message rather than written by hand |
| `…#v1.0.0` where the **tag is the release tree** | built package ✓ | this is the design |

The tag therefore points at a commit on an orphan `release` branch. `main` holds
the source and no build output; the release branch holds build output and no
source. They share no history, which is the point: a consumer fetching a release
never downloads the repository.

## What a release contains

`release/` is not hand-written. `pnpm --filter @luc/ui release:build` packs
`packages/ui` (which applies `publishConfig` and is therefore the published
manifest) and unpacks the tarball:

```
release/
├── package.json     the packed manifest, minus `scripts`, `devDependencies`,
│                    `publishConfig` and `packageManager`
├── dist/            JS, `.d.ts`, `.js.map`, and the CSS (`styles/`, `tokens/`)
├── README.md
├── LICENSE          MIT
└── RELEASE.json     which commit this tree was built from
```

`release:check` rebuilds from the current source and compares. `pnpm verify`
runs it, so a release tree that has drifted from `src` fails the gate before it
can be pushed.

### What is byte-reproducible, and what is not

JavaScript, CSS and `package.json` are byte-identical across builds. Declaration
files are not: the dts bundler prints the members of a union type in an order
that varies between runs (`"outline" | "neutral" | …` in one build,
`"neutral" | … | "outline"` in the next). It is the same type.

`release:check` therefore compares everything byte-for-byte except `.d.ts`, which
it compares as parsed TypeScript with union members sorted — so a renamed prop,
a removed member or a changed comment is still a failure, and a reordering is
reported as a note. `scripts/release-artifact.test.mjs` asserts both directions.

## Making a release

```bash
cd luc-ui
pnpm verify                                  # includes release:check
pnpm --filter @luc/ui release:build          # writes release/
pnpm --filter @luc/ui test:git-consumer      # installs it from a local git ref
```

Then commit the tree on the `release` branch and tag it. The worktree is
throwaway, so `main`'s working tree is never touched:

```bash
WT=$(mktemp -d)
git worktree add --detach "$WT" <main-sha>
cd "$WT" && git checkout --orphan release && git rm -rf . >/dev/null
cp -R /path/to/luc-ui/release/. .
git add -A && git commit -m "release: @luc/ui <version> (from <main-sha>)"
git tag v<version>
git push origin release && git push origin v<version>
git worktree remove --force "$WT"
```

Then prove the tag itself, from a directory that has never seen this repository:

```bash
pnpm --filter @luc/ui test:git-consumer:remote   # github:lucxu495/luc-ui#v<version>
```

### Versioning

SemVer, and tags are immutable — a published version is never re-pointed and
never force-pushed. A version that has to change is a new version. The version
the release publishes is the `version` in `packages/ui/package.json`; the tag is
`v` + that value.

## What the proof covers

`git-consumer.mjs` runs `verifyInstalledPackage` against the installed tree, and
that is the same body `independent-consumer.mjs` runs against the packed
tarball. It asserts:

* the installed manifest exports `dist`, has no `src/` and carries no `scripts`;
* `react` and `react-dom` are peer dependencies, `react-hook-form` optional;
* `@luc/ui/styles.css` scans its own `dist` (`@source "../"`) and no `src`;
* `"use client"` survives on client entry points and stays off server recipes;
* the declarations typecheck from the package for eleven public subpaths;
* the package server-renders (`react-dom/server`);
* Tailwind compiles the imported stylesheet into real utilities;
* a button-only bundle contains no ECharts, no Lightweight Charts and no
  TradingView provider URL.

It also asserts the lockfile recorded the commit and that pnpm asked for no
build script for `@luc/ui`.

## The `release` branch is generated

Do not hand-edit it. Anything changed there is lost on the next release, and a
change that is not in `main` is not in the source of truth. If a release is
wrong, fix `packages/ui` on `main`, then cut the next version.
