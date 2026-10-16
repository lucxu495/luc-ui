# Phase 9.6 — independent publication readiness

Workstream E asks a question with a short answer and a long justification: **what
actually stops `luc-ui` from being its own public repository today?** The audit
below is the justification. It was produced by reading the manifests, the build
scripts, the Docker context and the imports — not by aspiration.

No repository was created, nothing was published, and no licence was chosen.

## 1. What is verified working

| Gate | Command | Result |
| --- | --- | --- |
| Package builds and packs | `pnpm verify:package` | 277 modules, 267 declarations, 1 061 files, 1 318 KB |
| Public exports agree with the tarball | `scripts/verify-package.mjs` | ✓ exports, tarball and metadata agree |
| Declarations resolve for ESM + bundler consumers | `scripts/verify-types.mjs` | every entry point OK |
| Tree shaking is real | `scripts/consumer-test.mjs` | 17 scenarios, button-only 10.9 KB raw / 3.6 KB gzip |
| A consumer can install it | `scripts/independent-consumer.mjs` | npm install of the tarball, tsc, SSR, Tailwind scan, Vite bundle |
| A consumer can render and capture it | `apps/showcase/scripts/consumer-capture.mjs` | SSR + hydration + PNG + PDF from a directory outside the workspace |

The last two are the ones that matter for publication: they are the only ones
that do not trust the repository's own resolution rules.

## 2. Coupling that exists today, and its disposition

| Coupling | Where | Risk on extraction | Disposition |
| --- | --- | --- | --- |
| Workspace membership | repo-root `pnpm-workspace.yaml` lists `luc-ui`, `luc-ui/apps/*`, `luc-ui/packages/*` | the package itself has no dependency on it; only the *workspace* does | `luc-ui` carries its own `package.json`, `eslint.config.mjs`, `tsconfig.base.json` and scripts. An extracted repo needs a two-line `pnpm-workspace.yaml`, not a rewrite |
| `luc-web` is a sibling workspace member and the root `typecheck`/`lint` scripts recurse into it | root `package.json` | none on the library; it is the *root* scripts that reach outside | Not in scope. It is listed for a future monorepo split, not for the `luc-ui` extraction |
| Dependencies on other LUC projects | `rg "@luc-\|luc-(api\|jobs\|cron\|web\|render\|injest\|research)/" packages/ui/src apps/showcase/{app,components,lib}` | must be zero | **Verified zero imports.** The two textual matches are demo copy ("Read 42 files in luc-api/src") in a simulated-activity fixture, not an import |
| Absolute paths into `luc-quant` | `rg '/home/luc\|luc-quant' packages/ui/src packages/ui/scripts apps/showcase/qa apps/showcase/scripts` | a leaked absolute path breaks any other checkout | **None in source.** The only matches are the catalogue scripts' cross-platform path-normalisation *fixtures* (`catalog-signature.mjs`, `generate-catalog.mjs`), which exist to fold macOS/Windows/Linux paths to one canonical form — the opposite of a leak |
| Secrets, hostnames, private endpoints | `rg -i 'api[_-]?key\|secret\|password\|BEGIN .*PRIVATE KEY\|\.internal'` over the library and the Showcase source | a secret in public source is unrecoverable | **None.** The matches are the `Password` component, its demo copy and its i18n strings. The library makes no network calls: the TradingView integration is a loader for a widget the *consumer* enables, and `qa:providers` is a Showcase-only live smoke against a public host |
| The Showcase's QA harness | `apps/showcase/qa/*` | a public repo without the harness loses its gates | Ships with the extraction; it is tooling, not product code |
| Docker Compose / image tag | `luc-ui/docker-compose.yml`, `Dockerfile` | the Dockerfile builds from the monorepo root context (`context: ..`) | **The one real change**: the extraction moves the build context to the repository root, and `HASH_ROOTS`/workspace filters drop the `luc-ui/` prefix. Named as the first task in §4 |
| Generated artifacts | `apps/showcase/lib/docs/generated/*`, `docs/component-catalog.json` | regenerating in a fresh checkout must produce identical files | Now true for both (`catalog:check`, `docs:registry:check`), and the registry check stopped depending on the cwd in this phase (§`02`) |

## 3. Blockers that are decisions, not engineering

1. **Licence.** `packages/ui/package.json` declares `"license": "UNLICENSED"`.
   That is correct for a private package and wrong for a public one, and the
   choice between MIT, Apache-2.0 and a copyleft licence is a product decision
   with commercial consequences — the repository also plans a closed-source Pro
   tier, and Apache-2.0 and MIT differ in exactly the trademark/patent terms that
   decision cares about. **No licence file was added and no SPDX identifier was
   changed.** The options, with the trade-off that matters for each:

   | Option | Effect on the planned Pro tier | Note |
   | --- | --- | --- |
   | MIT | simplest, most permissive | no patent grant; the most common choice for component libraries |
   | Apache-2.0 | explicit patent grant + trademark clause | the safer default when a commercial tier exists alongside |
   | AGPL-3.0 | copyleft reaches hosted derivatives | incompatible with the intent to let companies adopt it freely |

2. **Version and release policy.** `@luc/ui` is at `1.0.0` and `private: false`,
   with `docs/VERSIONING.md` describing the contract. Publication needs a
   decision on whether `1.0.0` is the first public version (the Showcase and the
   API have stabilised, so it is defensible) or whether the extraction starts at
   `0.9.x`.
3. **npm scope.** `@luc/ui` is unclaimed on the public registry as far as this
   audit knows; publishing requires either registering the scope or renaming.
   Not attempted.

## 4. Proposed extraction, in order

Each step is independently verifiable, and the repository keeps working after
each one.

1. **Move the build context.** Change `Dockerfile`/`docker-compose.yml` so the
   context is `luc-ui/` and every path drops its prefix; `HASH_ROOTS` loses
   `../`. Verify: the image builds and `qa:full` passes.
2. **Create the repository** with `luc-ui/**` verbatim plus a root
   `pnpm-workspace.yaml` listing `apps/*` and `packages/*`, and a `README.md`
   that states the licence, the version policy and the support boundary.
3. **Add the community files** GitHub expects at a repository root:
   `LICENSE` (per §3.1), `CONTRIBUTING.md`, `SECURITY.md` (a reporting address,
   not a threat model), `CODE_OF_CONDUCT.md`, `.github/ISSUE_TEMPLATE/`,
   `.github/workflows/ci.yml` running `pnpm verify` and
   `pnpm --filter @luc/showcase qa:mobile-a11y`.
4. **Land the CI gate before the first release**, then publish `@luc/ui` from a
   tagged commit and run the consumer fixture against the *published* tarball
   rather than the local one — the last untested link.
5. **Keep `luc-render` out** of the extraction. It is a separate product with
   its own workspace, and its dependency on LUC UI is one-way by design
   (`ADR-0001`); nothing in this phase created a reverse dependency.

## 5. What this phase deliberately did not do

* No `LICENSE` file, no `CONTRIBUTING.md`, no workflow files were created —
  they belong to the extraction commit, and inventing a licence here would be a
  product decision made by an engineering phase.
* No version bump, no `publishConfig` change, no `npm publish`.
* No repository was created, and the Showcase's private loopback binding was
  left exactly as it was.
