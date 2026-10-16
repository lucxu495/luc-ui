# Phase 1 closure — portable component catalog

Date: 2026-10-08. Scope: make the generated component catalog machine-independent
so `luc-ui/pnpm verify` passes on the Linux server. No runtime component, public
API, token or Design Lab file was touched. No commit, push or publish.

## 1. Root cause

`packages/ui/scripts/generate-catalog.mjs` records the TypeScript printer's output
for every exported symbol:

```js
signature = checker.typeToString(type, declaration, ts.TypeFormatFlags.NoTruncation).replace(/\s+/g, " ");
if (signature.length > 320) signature = `${signature.slice(0, 317)}...`;
```

When a type lives in a package that the declaring file does not import by name,
the printer has no import specifier to reuse and falls back to the **resolved
filesystem path**:

```
({ … }: DataTableProps<TData>) => import("/Users/luc/Documents/luc/luc-quant/node_modules/.pnpm/@types+react@19.3.0/node_modules/@types/react/index").JSX.Element
```

Two independent defects followed:

1. **The prefix leaked.** 685 signature values in the committed
   `docs/component-catalog.json` contained `/Users/luc/Documents/luc/luc-quant/…`.
2. **The truncation point moved with the prefix.** The 320-character budget was
   applied to the *un-normalized* string, so a longer home directory produced a
   different cut. The committed (macOS) catalog had **116** signatures ending in
   `...`; the same revision generated on Linux had **72**. Even if the prefix had
   been masked afterwards, the two files could never agree.

Only `source` was ever relativised (`path.relative(uiRoot, …)`); the signature
string was not.

### Reproduced drift

```
committed (macOS) catalog : 685 × "/Users/luc"
same revision on Linux    : 685 × "/home/luc"
entries whose JSON differs mac vs linux : 29 / 34
truncated signatures      : 116 (mac) vs 72 (linux)
```

The leaked specifiers were exactly four packages, all reached through
`node_modules/.pnpm/…`, plus truncation-mangled fragments of the same paths:

```
@types/react/index
@tanstack/react-table/dist/useTable
@tanstack/table-core/dist/index
class-variance-authority/dist/types
```

## 2. Fix

New module `packages/ui/scripts/lib/catalog-signature.mjs`:

- `normalizeModuleSpecifier(specifier, { uiRoot })` — rewrites a **quoted absolute
  module specifier** into a stable one:
  - takes everything after the **last** `/node_modules/`, which drops the pnpm
    store prefix (`.pnpm/<name>@<version>_<peer-suffix>/`) and any machine prefix;
  - strips a trailing declaration extension (`.d.ts` / `.d.mts` / `.d.cts`) and a
    conventional trailing `/index`;
  - for absolute paths inside `uiRoot`, returns the workspace-relative path;
  - leaves bare (`react`) and relative (`./x`) specifiers untouched;
  - normalises `\` to `/` first, so Windows paths work.
- `normalizeSignature(text, { uiRoot })` — applies that rewrite to every quoted
  specifier in a signature.
- `ABSOLUTE_PATH_PATTERNS` / `findAbsolutePaths` / `assertNoAbsolutePaths(catalog)`
  — a **guard** that fails generation if any signature or `source` still carries a
  real filesystem root (`/Users`, `/home`, `/var`, `/tmp`, …) or a Windows drive.
  The drive pattern excludes a drive letter that is the tail of a URL scheme, so
  TradingView URL literal types such as `"https://s3.tradingview.com"` do not trip
  it.
- `PATH_FIXTURES` / `runPathFixtures(uiRoot)` — the regression fixture set.

`generate-catalog.mjs` changes:

1. runs `runPathFixtures(uiRoot)` at startup, so `catalog:generate`,
   `catalog:check` **and** `--self-test` all exercise the fixtures (this puts them
   inside the standing `verify:package` gate);
2. normalises the signature **before** truncating, so the 320-character cut is
   machine-independent;
3. calls `assertNoAbsolutePaths(catalog)` on the built object before writing;
4. extends `--self-test` with a normalization assertion and an
   absolute-path-guard assertion.

The drift check itself is unchanged: `--check` still compares the generated JSON
and Markdown byte-for-byte, and `validateExportParity` still asserts the source
and packed export maps are identical. Nothing was weakened; a guard and a fixture
set were added.

### Type information preserved

Module identity is kept (package name plus the subpath the printer chose), and
normalisation makes signatures *shorter*, so fewer of them hit the truncation
budget: **116 → 30 truncated**. Example that now resolves fully:

```
before: (… TradingViewWebComponentProps) => import("/Users/luc/code/luc-quant/…
after : (… TradingViewWebComponentProps) => import("@types/react").JSX.Element
```

## 3. Regression fixture (Mac / Linux / Windows / pnpm)

`runPathFixtures` checks 10 cases; three of them are the determinism contract —
the same package resolved through a macOS pnpm store, a Linux pnpm store and a
Windows pnpm store must normalize to exactly the same specifier:

```
/Users/luc/Documents/luc/luc-quant/node_modules/.pnpm/@types+react@19.3.0/node_modules/@types/react/index
/home/luc/code/luc-quant/node_modules/.pnpm/@types+react@19.3.0/node_modules/@types/react/index
C:\Users\luc\Documents\luc\luc-quant\node_modules\.pnpm\@types+react@19.3.0\node_modules\@types\react\index
  -> "@types/react"
```

Plus: peer-suffixed pnpm subpath, hoisted `node_modules`, `.d.ts` extension,
nested `node_modules` precedence, workspace-internal absolute path, and the two
"must not change" cases (bare and relative specifiers).

## 4. Before / after evidence

| Signal | Before | After |
| --- | ---: | ---: |
| `/Users/luc` occurrences in `docs/component-catalog.json` | 685 | **0** |
| `/home/luc` occurrences in `docs/component-catalog.json` | 685 (when generated on Linux) | **0** |
| `C:\` machine paths | n/a | **0** |
| Distinct module specifiers printed | 4 absolute paths (plus truncated fragments) | 4 stable specifiers: `@types/react`, `@tanstack/react-table/dist/useTable`, `@tanstack/table-core/dist`, `class-variance-authority/dist/types` |
| Truncated signatures | 116 (macOS) / 72 (Linux) | **30** |
| Entries differing between macOS and Linux generation | 29 / 34 | 0 (fixtures) |
| Signatures changed by the fix | — | 685 (all of them were path-mangled) |
| Structure other than signatures (keys, `import`, `source`, `packed`, annotations) | — | **identical** (verified by comparing the committed catalog with the regenerated one with `signature` fields removed) |

`docs/COMPONENT_CATALOG.md` did not change (it lists names, not signatures).

## 5. Commands and outcomes

| Command | Outcome |
| --- | --- |
| `node scripts/generate-catalog.mjs` (package dir) | **PASS** — `catalog: generated 34 public paths, 10 path fixtures pass` |
| `node scripts/generate-catalog.mjs --check` | **PASS** — `34 public paths, all documented imports resolve, 10 path fixtures pass` |
| `node scripts/generate-catalog.mjs --self-test` | **PASS** — symbol / documented-path / export-map mismatches still detected; 10 path fixtures pass |
| `cd / && node /home/luc/.../scripts/generate-catalog.mjs` | **PASS** — byte-identical output |
| `cd luc-ui && node packages/ui/scripts/generate-catalog.mjs` | **PASS** — byte-identical output |
| cwd determinism | all three runs md5 `74e24c3955d8a1d6271e5dce55bec82b` |
| Deliberate drift (one byte appended to the catalog) then `--check` | **FAIL as designed** — `docs/component-catalog.json is stale`, exit 1; restored, `--check` exit 0 |
| `pnpm --filter @luc/ui catalog:check` | **PASS** |
| `cd luc-ui && pnpm verify` | **PASS — exit 0** (typecheck ui/showcase/luc-web, lint, **617 tests / 69 files**, catalog:check, build:package, verify:package, test:consumer, verify:types) |

Cross-OS generation was validated at the unit level with the fixtures (which use
the real macOS path string taken from the committed artifact, the real Linux path,
and a Windows path) plus the guard, because no macOS machine was available in this
session. Every input that previously varied by machine is now covered by a
fixture.

## 6. Files changed

- `luc-ui/packages/ui/scripts/lib/catalog-signature.mjs` (new)
- `luc-ui/packages/ui/scripts/generate-catalog.mjs` (modified)
- `luc-ui/docs/component-catalog.json` (regenerated)
- `luc-ui/docs/audits/server-handoff/2026-10-08-catalog-portability-fix.md` (new)

Not changed: any runtime component, public export, token, Design Lab file,
`luc-web`, other subprojects, root manifests or lockfiles.

## 7. Remaining blockers

None for this task. `pnpm verify` is green.

Deferred (out of this task's write scope, unchanged by this work):

- `.context/docs/luc-ui/index.md` still does not mention the catalog commands;
  that is a `.context` edit and needs separate authorization.
- `docs/component-catalog.json` remains a large generated artifact (13k lines);
  it is now deterministic, so a future option would be to generate it on demand
  instead of committing it. Not proposed as a change here.
