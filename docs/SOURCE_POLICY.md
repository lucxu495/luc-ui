# LUC UI — source policy

How LUC UI treats other people's work.

## The three-step rule

1. **Research widely.** Read the source, the docs and the demos of as many
   projects as it takes to understand a pattern properly.
2. **Depend narrowly.** Add a runtime dependency only when it removes a class of
   bug we would otherwise own forever (see `research/dependency-decisions.md`).
3. **Own the language.** Whatever we ship must read as LUC UI. If a component
   looks like its upstream, it is not finished.

## Before copying any source

1. Fetch the **current** license file from the repository (not a blog post, not
   a package description). Record the SPDX id and the caveats in
   `docs/research/license-matrix.md`.
2. Classify the intended use: `DIRECT_DEPENDENCY`, `ADAPT_SOURCE`,
   `REIMPLEMENT_IDEA`, `REFERENCE_ONLY`, `DO_NOT_USE`, or
   `REQUIRES_MANUAL_LICENSE_REVIEW`.
3. Record the component-level provenance in `docs/sources/source-registry.md`,
   including whether attribution is required.
4. If anything is unclear, stop and use `REQUIRES_MANUAL_LICENSE_REVIEW`. Do not
   guess, and do not provide a legal opinion.

## Disallowed in this repository

- Source from **MIT + Commons Clause** projects (Animate UI, React Bits) or any
  project whose license restricts redistribution. Their behaviour may be studied;
  their code may not be copied, paraphrased line-by-line, or vendored. LUC
  `BorderGlow` is an independent implementation for exactly this reason.
- Paid or private content of any kind. TypeUI's paid material was never accessed;
  only its public MIT repositories were read.
- Bulk-copying a repository into `luc-ui`. No vendored folders, no "adapted"
  dumps, no unused files.
- Assets without a license (icons, illustrations, fonts, textures).

## Required when we do copy or adapt

- Keep the upstream copyright notice and license text with the code.
- State the modifications in the source registry and in the file header.
- Prefer a LUC-native rewrite when the original is small and the visual language
  differs anyway — which is most of the time.

## Attribution that must ship

| Dependency | Requirement |
| --- | --- |
| Radix UI | MIT notice (shipped by the package) |
| Remix Icon | License file travels with the icon assets |
| Inter / Inter Tight / JetBrains Mono | SIL OFL 1.1 license files (shipped by `@fontsource-variable/*`) |
| Motion, clsx, tailwind-merge, class-variance-authority | MIT notices (shipped by the packages) |
| TanStack Table, TanStack Virtual | MIT notices (shipped by the packages) |
| Downshift | MIT notice (shipped by the package) |
| Sonner | MIT notice (shipped by the package) |
| cmdk | MIT notice (shipped by the package) |
| ECharts (shipped) | Apache-2.0 NOTICE + attribution, shipped inside the package |
| Lightweight Charts (shipped) | Apache-2.0 + attribution notice. Satisfied by the library's own `attributionLogo`, kept visible by `LightweightSurface`. No endorsement implied. |

## Research hygiene

- Research happens in `/tmp`, never inside `luc-ui`. Temporary clones are never
  committed.

## V0.3 notes

The data-table round added five runtime dependencies and **no copied source**.
Every one of them is used through its published public API:

| Capability | Package | What we did *not* do |
| --- | --- | --- |
| Table state and row models | `@tanstack/react-table` | Did not fork its row models, did not re-export its internals, did not let a page import `@tanstack/*` directly. |
| Row virtualisation | `@tanstack/react-virtual` | Did not build a custom scroll maths layer. |
| Combobox behaviour | `downshift` | Did not vendor the reducer, and did not copy its `data-*` styling conventions. |
| Toast behaviour | `sonner` | Did not fork the stacking or gesture code; skinned it through its documented CSS variables. |
| Command palette | `cmdk` | Did not reuse its `Command.Dialog`, which is deprecated; LUC composes Radix Dialog around `Command`. |

Three studied projects are explicitly **not** dependencies, and the reason is
recorded so a future session does not reverse it by accident:

## The forms and date round (V0.4)

V0.4 added two runtime dependencies (`react-aria-components` +
`@internationalized/date`, one Apache-2.0 project) plus one optional peer
(`react-hook-form`, MIT) and one small behavioural package (`input-otp`, MIT).
No source was copied from any of them.

| Capability | Package | What we did *not* do |
| --- | --- | --- |
| Calendar, range, date/time/number fields, file drop | `react-aria-components` | Did not vendor the calendar state machine or the ARIA grid logic; did not use its default styling, and did not import a second copy of its internals. |
| Date value types, locale data, formatting primitives | `@internationalized/date` | Did not re-implement calendar arithmetic or locale tables. |
| Form state (optional) | `react-hook-form` | Did not fork the store, and did not make it a hard dependency — it is a peer, reached only through `@luc/ui/forms/react-hook-form`. |
| One-time-code entry | `input-otp` | Did not copy its slot markup; only its documented single-input behaviour is used. |

Four studied projects are explicitly **not** dependencies, with the reason
recorded so a future session does not reverse it:

- **TanStack Form** — its field render props already compose with LUC `Field`, so
  an adapter would add API surface without removing work.
- **React DayPicker** — `Date`-based values, no time field, no zoned value.
- **date-fns** — only useful with a `Date`-based model, which V0.4 exists to
  avoid.
- **react-dropzone**, **react-number-format** — both superseded here by React
  Aria primitives we already ship; their ideas (rejection semantics, caret-safe
  formatting) were studied.

Two reference-only projects were re-checked: **vaul** is still unmaintained (so
the Sheet stays on Radix Dialog), and **Ariakit** still has no root license file
detectable by the GitHub API (npm declares MIT), so nothing is copied from it.

- **Base UI** and **Ariakit** would be a second and third primitive system
  alongside Radix. Both were read for combobox semantics.
- **vaul** is unmaintained per its own README. The Sheet is built on Radix
  Dialog instead.
- Licenses are verified by fetching the actual file, and the command used is
  recorded in the license matrix so the result can be reproduced.
- Star counts and last-push dates are recorded with the date they were read, so a
  stale assessment is visible as stale.

## If a problem is found later

1. Remove the affected code in its own commit.
2. Replace it with a LUC-native implementation, or adopt the dependency properly.
3. Update the license matrix and source registry in the same change.
4. Note it in the release notes if the code was ever distributed.

## V0.5 additions

Three runtime decisions and one deferred one. Full rows are in
`docs/research/v0.5-open-source-audit.md`; the license matrix carries the
verification command for each.

| Project | Role | License | Decision |
| --- | --- | --- | --- |
| `bvaughn/react-resizable-panels` v4 | resizable panes, separators, keyboard resize | MIT | **dependency** (Workspace) |
| `47ng/nuqs` v2 | Next App Router URL plumbing | MIT | **Showcase-only adapter**; never a `@luc/ui` dependency |
| `rolldown/tsdown` + `publint` + `@arethetypeswrong/cli` | package build and validation | MIT | **dev-only** |
| `shadcn-ui/lint` | agent-facing design-system rules | MIT | **not adopted at V1.0** — still 0.2.x with a hand-written contract per component; LUC's two native rules cover the failure modes with no dependency (see the V1.0 note below) |

## V1.0 — no new sources, one rule kept deliberately

The final round added four component families and none of them introduced a
dependency. `Slider`, `RangeSlider`, `DropdownMenu` and `ContextMenu` are LUC
skins over primitives that were already inside the pinned `radix-ui@1.6.7`
(`@radix-ui/react-slider@1.4.7`, `@radix-ui/react-dropdown-menu@2.1.24`,
`@radix-ui/react-context-menu@2.3.7`); `Alert`, `Callout` and `EmptyState` are
LUC-native composition over the token layer. The lockfile and the dependency
list are unchanged from V0.6, and `pnpm verify` runs without an install.

`@shadcn/lint` was re-evaluated rather than deferred again. It remains the right
*idea* — the two rules in `eslint-rules/no-raw-color-literals.mjs` are the part
of it that pays for itself today — but it still requires a hand-written contract
per component before it reports anything, and it would then overlap with the
rules already in place. The decision, and the conditions that would reverse it,
are recorded in `docs/research/dependency-decisions.md` under "V1.0 rows". The
design contracts that cannot be expressed as a lint rule live in
`DESIGN_SYSTEM.md` §9 and in the "check the inventory first" rule at the top of
`docs/COMPONENT_INVENTORY.md`.

Everything else in the round — shell, sidebar, breadcrumbs, page header, mobile
navigation, navigation model, URL codecs, the inspector, focus mode and pinning
— is LUC code composed over React, Radix and the components that already exist.
No design reference was copied: the shell's structure was studied (shadcn's
architecture, Radix's primitives, Ariakit's and Base UI's menu semantics) and
implemented LUC-native, which the source registry records as
`DESIGN_REFERENCE`.

The URL-state layer deserves one explicit note: **the library owns the codecs
and the parameter sets, and imports no router.** nuqs is the framework's half of
the adapter and only the Showcase installs it. If nuqs disappeared tomorrow, the
codecs, the pure functions and `useUrlState` would still work, and only the
Showcase's adapter file would change.
