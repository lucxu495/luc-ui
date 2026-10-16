# LUC UI evolution blueprint

Date: 2026-10-08. This is a recommendation built on [the verified current-state audit](./2026-10-productization-current-state.md) and [gap/consumer analysis](./2026-10-productization-gaps-and-consumers.md). No roadmap item has been implemented. The design principle is **quiet at rest, alive on interaction, memorable at the moment of interaction**.

## Decision summary

1. **Start with documentation/API truth and a small agent workflow.** `docs/COMPONENT_INVENTORY.md` misstates `Button.asChild` and native-table semantics, `README.md` points external consumers at `src` despite a dist-only tarball, and a stable API list does not fully enumerate the current motion barrel (`luc-ui/docs/COMPONENT_INVENTORY.md`, `luc-ui/README.md`, `luc-ui/docs/PUBLIC_API.md`, `luc-ui/packages/ui/src/components/button-base.tsx`, `luc-ui/packages/ui/src/table/data-table.tsx`, `luc-ui/packages/ui/package.json`). This has high reuse, low implementation risk and directly improves developer and agent decisions.
2. **Tighten existing primitives before adding families.** Card's overlapping interaction props, selected-control geometry/semantics and input-like state parity are concrete targets (`src/components/{card,tabs,segmented-control,input,select,combobox}.tsx`, `src/motion/shared-highlight.tsx`).
3. **Make data inspection and workspace composition easier without moving domain logic.** Use existing charts, table, DataDetails, shell, workspace and URL-state primitives (`src/charts/index.ts`, `src/table/index.ts`, `src/data/data-details.tsx`, `src/workspace/index.ts`, `src/url-state/index.ts`).
4. **Keep package distribution, docking, editable grids and a public registry out of the first implementation phase.** The current package has build gates but no independently installed consumer proof, and complex interaction families need a real consumer contract (`packages/ui/scripts/verify-package.mjs`, `packages/ui/scripts/consumer-test.mjs`, `docs/WORKSPACE_GUIDE.md`).

## Documentation information architecture

The current `luc-ui/README.md`, `DESIGN_SYSTEM.md`, `AI_DESIGN_GUIDE.md`, `docs/PUBLIC_API.md`, `docs/COMPONENT_INVENTORY.md`, topical guides, `apps/showcase/app/**/page.tsx` and `skills/luc-ui/SKILL.md` form a rich but overlapping corpus. The next phase should give each layer one job:

| Audience / layer | Canonical material | Purpose and change rule |
| --- | --- | --- |
| Human developer entry | `README.md` → “start, styles, provider, import path, examples”; `docs/PUBLIC_API.md` for support status | Short setup and conceptual map. Link to source-generated API pages, not hand-copy all props. |
| Component catalog/examples | Showcase `apps/showcase/app/components|charts|application|motion/**` plus a generated index from public exports | One page per meaningful family: imports, examples, variants/states, composition, a11y, motion, theme, tests, caveats. Runnable examples remain Showcase source. |
| Design/motion rules | `DESIGN_SYSTEM.md`, `docs/MOTION_GUIDE.md`, `docs/ACCESSIBILITY.md` | Normative tokens, visual hierarchy, interaction budget, reduced motion and keyboard contracts; screenshots illustrate but do not define the API. |
| Agent-facing | Thin repository `AGENTS.md` guidance + a task-scoped `SKILL.md` that points to public API, component catalog and source | Teach search/reuse/verification workflow. Do not restate every component or keep a second prop database in prompts. Existing `skills/luc-ui/SKILL.md` can be trimmed and aligned. |
| Maintainer | `.context/docs/luc-ui/index.md`, `docs/QA_WORKFLOW.md`, `docs/PACKAGING_GUIDE.md`, `docs/SOURCE_POLICY.md`, `docs/VERSIONING.md` | Architecture boundaries, commands, provenance, release and QA gates. Update on workflow changes. |
| Migration/versioning | `CHANGELOG.md`, `MIGRATION_V1.md`, `docs/VERSIONING.md` | State what changes for consumers and how to upgrade; keep release history separate from current API truth. |
| Machine-readable metadata | One generated manifest derived from TypeScript public barrels, package export map and small hand-authored annotations | Serve catalog/search/agent use. Manual annotations should cover intent, a11y caveats and examples; never duplicate prop signatures or export names by hand. |

### Metadata source-of-truth rule

The package's `package.json` export map defines importable paths; public barrels and TypeScript declarations define symbols/props; token CSS defines design values; Showcase source defines examples. A small metadata annotation file may add *semantic* facts that code cannot infer (`category`, `whenToUse`, `avoidWhen`, `a11yNotes`, `showcaseRoute`, `status`). A generator joins these and fails if a documented symbol/import path no longer exists. This is a **proposed** workflow, not current infrastructure (`luc-ui/packages/ui/package.json`, `src/index.ts`, `apps/showcase/lib/navigation.ts`, `docs/COMPONENT_INVENTORY.md`). Do not independently maintain a registry JSON, API Markdown table and skill component list.

## Skills, MCP and Registry feasibility

| Option | Feasibility and maintenance | Recommended timing |
| --- | --- | --- |
| Repository `AGENTS.md` + task-scoped `SKILL.md` | Lowest cost. The repo already has `AGENTS.md` handoff and `luc-ui/skills/luc-ui/SKILL.md`; a skill is instructions plus optional references/scripts. Official OpenAI guidance describes repo-local skills and keeping general policy in `AGENTS.md`. [OpenAI skills guidance](https://developers.openai.com/blog/skills-agents-sdk), [OpenAI Skills](https://developers.openai.com/api/docs/guides/tools-skills). | **Phase 1.** Keep the skill short: find the correct public import, inspect props and Showcase, follow token/a11y rules, run affected gates. |
| Generated component metadata/search index | Feasible from current exports, declaration files and Showcase routes. Useful to humans and agents without a service. Risk is stale hand-authored data, solved by deriving names/signatures and validating semantic annotations. | **Phase 1–2.** Start with a static manifest and drift check after documentation truth is repaired. |
| Local MCP server | Technically feasible: MCP servers expose tools/resources/prompts through a host; the official TypeScript SDK documents this. [MCP TypeScript SDK](https://ts.sdk.modelcontextprotocol.io/v2/). But the current data is static and locally readable; a server adds packaging, host configuration and API support cost without a unique capability. | **Defer.** Reconsider only if agents need cross-repository live search, executable examples, validation services or hosted design assets that plain files cannot supply. Use the same generated manifest as its data source. |
| shadcn-style registry | Feasible: registry items carry files, dependencies and optional CSS variables, and shadcn documents schemas/build tooling. [Registry getting started](https://ui.shadcn.com/docs/registry/getting-started), [registry item schema](https://ui.shadcn.com/docs/registry/registry-item-json). But LUC is presently a compiled package with provider, token and subpath contracts; copying components would create forked code and support obligations. | **Defer until distribution strategy is set.** If later needed, expose only deliberately copyable recipes/blocks generated from the same metadata, not the entire package as a second delivery model. |

This comparison is a feasibility assessment as of the audit date. External tool capabilities can change; validate the linked primary documentation before implementation.

## Prioritized roadmap

Impact, effort, maintenance cost and reuse are relative estimates (H/M/L). A priority is not a release commitment.

| Priority | Work | Impact | Effort | Ongoing cost | Reuse | Why now / evidence |
| --- | --- | --- | --- | --- | --- | --- |
| P0 | Correct public API/inventory/setup drift; define one generated catalog contract | H | M | L | H | Incorrect `asChild`, table semantics and external CSS source path already mislead adopters (`docs/COMPONENT_INVENTORY.md`, `README.md`, `components/button-base.tsx`, `table/data-table.tsx`, `scripts/verify-package.mjs`). |
| P0 | Accessibility/state audit of SharedHighlight and disabled actions; fix confirmed issues | H | M | L | H | Semantic mismatch candidate and divergent disabled treatment (`motion/shared-highlight.tsx`, `components/button-variants.ts`, `components/input.tsx`). |
| P1 | Unify documented interaction grammar for selected controls and Card | M | M | L | H | Shared measurement but duplicated visual geometry and overlapping Card modes (`hooks/use-sliding-indicator.ts`, `components/{tabs,segmented-control,card}.tsx`, `motion/shared-highlight.tsx`). |
| P1 | Input-like state matrix and cross-family visual/keyboard QA | H | M | M | H | Shared shell plus Combobox duplication (`components/{input,select,combobox}.tsx`, `apps/showcase/qa/`). |
| P1 | Generic linked chart/table/data-inspection recipe | M | M | M | H | Existing primitives are good but composition is dispersed (`charts/components/chart-data-table.tsx`, `data/data-details.tsx`, `apps/showcase/app/patterns/chart-table/page.tsx`). |
| P2 | Independent package consumer matrix and release policy | H for distribution | M | M | H | Dist build exists, but packed tarball/setup/SSR need external proof and license decision (`packages/ui/package.json`, `scripts/consumer-test.mjs`, `README.md`). |
| P2 | Optional static manifest API for agent search | M | M | L | H | Can reuse export/Showcase metadata once catalog contract is stable (`packages/ui/package.json`, `apps/showcase/lib/navigation.ts`). |
| P3 | Docking, editable DataGrid, multi-select, registry, MCP | Unproven | H | H | Unknown | No current generic contract or repeated consumer evidence (`docs/WORKSPACE_GUIDE.md`, `src/table/index.ts`, `src/components/combobox.tsx`). |

## Proposed Phase 1 implementation tasks and acceptance criteria

These are proposed future tasks. The present audit does not edit any of the listed implementation or existing documentation files.

### 1. Establish a truthful API and setup baseline **(recommended first task)**

**Scope:** reconcile `README.md`, `docs/PUBLIC_API.md`, `docs/COMPONENT_INVENTORY.md` with `packages/ui/package.json`, `src/index.ts`, subpath barrels and actual props. Add a small public-export/catalog drift check only if it can derive names instead of duplicating a manual list. Fix the external Tailwind source example against the packed artifact (`packages/ui/scripts/postbuild.mjs`, `scripts/verify-package.mjs`).

**Accept when:** every documented import resolves from a packed install; Button documentation correctly says native button plus `buttonVariants` for anchors; DataTable is described as a semantic table; each public family has one discoverable Showcase link and a short status/limitation; a deliberate export change fails the catalog drift check; `pnpm verify` and one independent-package smoke install pass. No public API change is required.

### 2. Resolve selected-control semantics and disabled-state readability

**Scope:** inspect `SharedHighlight` in navigation-link and button modes, and audit Button disabled contrast in both themes (`src/motion/shared-highlight.tsx`, `src/components/button-variants.ts`, `src/components/input.tsx`).

**Accept when:** accessibility tree and keyboard behavior match the role used for each mode; no link/button selector is advertised as tabs without tab semantics; screen reader labels/current state are correct; disabled text remains recognizable at normal and 200% zoom; reduced-motion behavior remains deterministic; focused unit tests and targeted browser axe/keyboard QA pass.

### 3. Clarify Card and selected-track composition

**Scope:** document Card interaction precedence and compare Tabs/SegmentedControl/SharedHighlight track geometry (`src/components/{card,tabs,segmented-control}.tsx`, `src/motion/shared-highlight.tsx`). Favor shared tokens/recipes only after visual comparison.

**Accept when:** each Card mode has a documented semantic use and native actionable element example; no conflicting prop combination yields ambiguous styling; selected tracks align across themes/sizes/density; Showcase demonstrates rest/hover/focus/selected/reduced-motion states; Luc Web affected routes remain visually sound.

### 4. Make agent guidance thin and testable

**Scope:** revise `skills/luc-ui/SKILL.md` and repository guidance to point to the repaired catalog, public imports, Showcase and QA workflow; optional static manifest is generated from the same sources (`luc-ui/skills/luc-ui/SKILL.md`, `luc-ui/docs/PUBLIC_API.md`, `luc-ui/docs/QA_WORKFLOW.md`).

**Accept when:** a fresh agent can find the right import and distinguish generic from Luc Web domain code from one short workflow; component names/props live in generated API data, not copied into the skill; sample queries for Button, DataTable, chart sync and workspace resolve to the correct source and Showcase route; no MCP server or registry is required.

## Gates for later work

For a future implementation, choose focused unit tests when interaction logic changes, targeted Showcase behavior/axe/visual checks for touched routes, package verification for exports or CSS, and Luc Web verification when used APIs change (`luc-ui/docs/QA_WORKFLOW.md`, `luc-ui/package.json`, `luc-web/package.json`). Run the full release suite only at a freeze. Maintain dark/light, narrow/wide, keyboard, high zoom and reduced-motion samples. Preserve the library boundary: values and domain narratives come from consumers, while `@luc/ui` owns presentation, generic interaction and data inspection (`luc-ui/docs/CHART_GUIDE.md`, `luc-web/components/render/`).
