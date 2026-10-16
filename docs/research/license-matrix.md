# LUC UI — license matrix

Status: verified **2026-09-26** by fetching each repository's license file from
GitHub (raw `main`/`master` branch) and reading the text. Star counts and the
last push date come from the GitHub API on the same day.

This document is an engineering assessment, **not legal advice**. Where the
license text is ambiguous or the usage would be unusual, the row is marked
`REQUIRES_MANUAL_LICENSE_REVIEW` and no source is copied until a human decides.

## How to read the classification

| Class | Meaning for LUC UI |
| --- | --- |
| `DIRECT_DEPENDENCY` | Installed as an npm package. We use the public API and ship the package's own license notice. |
| `ADAPT_SOURCE` | License permits copying source into LUC UI with attribution. Prefer a LUC-native rewrite anyway. |
| `REIMPLEMENT_IDEA` | Studied for behaviour only. **No source copied.** We write our own implementation. |
| `REFERENCE_ONLY` | Read for architecture or documentation lessons. No code, no dependency. |
| `DO_NOT_USE` | Not used in any form, including as inspiration for shipped code. |
| `REQUIRES_MANUAL_LICENSE_REVIEW` | Blocked until a human reviews the terms. |

## Permissiveness legend

- **Commercial use / Modification / Redistribution**: `yes`, `no`, or
  `yes-with-conditions` (conditions stated in the caveats column).
- Every license below requires preserving the upstream copyright notice for any
  code we copy or link against.

## Primary matrix

| Repository | License | Commercial | Modify | Redistribute | Attribution | Caveats | LUC classification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | MIT | yes | yes | yes | keep notice if copied | None. Repo is a registry of copy-into-your-app components. | `REFERENCE_ONLY` (architecture), `ADAPT_SOURCE` per component if we ever copy one |
| [radix-ui/primitives](https://github.com/radix-ui/primitives) | MIT (WorkOS) | yes | yes | yes | keep notice | Published as `radix-ui`; behaviour is the value, styling is ours. | `DIRECT_DEPENDENCY` |
| [chakra-ui/chakra-ui](https://github.com/chakra-ui/chakra-ui) | MIT | yes | yes | yes | keep notice | Design-system organisation reference. No runtime dependency chosen. | `REFERENCE_ONLY` |
| [mantinedev/mantine](https://github.com/mantinedev/mantine) | MIT | yes | yes | yes | keep notice | Component completeness, hooks and forms API studied. | `REFERENCE_ONLY` |
| [tailwindlabs/headlessui](https://github.com/tailwindlabs/headlessui) | MIT | yes | yes | yes | keep notice | Compared against Radix; Radix chosen for coverage. | `REFERENCE_ONLY` |
| [chakra-ui/ark](https://github.com/chakra-ui/ark) | MIT | yes | yes | yes | keep notice | State-machine architecture studied. | `REFERENCE_ONLY` |
| [chakra-ui/park-ui](https://github.com/chakra-ui/park-ui) | MIT | yes | yes | yes | keep notice | Design system over headless primitives. Note: the project moved from `cschroeter/park-ui` to `chakra-ui/park-ui`. | `REFERENCE_ONLY` |
| [floating-ui/floating-ui](https://github.com/floating-ui/floating-ui) | MIT | yes | yes | yes | keep notice | Already in our tree transitively via Radix popper. | `DIRECT_DEPENDENCY` (transitive) |
| [adobe/react-spectrum](https://github.com/adobe/react-spectrum) | Apache-2.0 | yes | yes | yes | NOTICE file + attribution | Apache-2.0 adds a patent grant and requires stating changes. | `REFERENCE_ONLY` |
| [magicuidesign/magicui](https://github.com/magicuidesign/magicui) | MIT | yes | yes | yes | keep notice if copied | Effects studied; LUC implementations are independent. | `REIMPLEMENT_IDEA` |
| [ibelick/motion-primitives](https://github.com/ibelick/motion-primitives) | MIT (`LICENCE.md`) | yes | yes | yes | keep notice if copied | British spelling of the filename; license text is standard MIT. | `REIMPLEMENT_IDEA` |
| [imskyleen/animate-ui](https://github.com/imskyleen/animate-ui) | **MIT + Commons Clause** | yes | yes | **restricted** | yes | Commons Clause forbids selling the software itself. Copying into a product library we may license or sell is not permitted. | `REIMPLEMENT_IDEA` — **do not copy source** |
| [kokonut-labs/kokonutui](https://github.com/kokonut-labs/kokonutui) | MIT | yes | yes | yes | keep notice if copied | Composition and polish studied. | `REIMPLEMENT_IDEA` / `REFERENCE_ONLY` |
| [uiverse-io/galaxy](https://github.com/uiverse-io/galaxy) | MIT | yes | yes | yes | keep notice if copied | Huge mixed-quality pool. Used as an idea index only. | `REIMPLEMENT_IDEA` |
| [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits) | **MIT + Commons Clause v1.0** | yes | yes | **restricted** | yes | Same restriction as Animate UI. `BorderGlow` was studied to understand the *behaviour*, then written from scratch for LUC UI. | `REIMPLEMENT_IDEA` — **do not copy source** |
| [tremorlabs/tremor](https://github.com/tremorlabs/tremor) | Apache-2.0 | yes | yes | yes | NOTICE + attribution | Dashboard/metric layout studied. Tremor has since split into a commercial product; the GitHub repo remains Apache-2.0. | `REFERENCE_ONLY` |
| [TanStack/table](https://github.com/TanStack/table) | MIT | yes | yes | yes | keep notice | **Adopted in V0.3** as `@tanstack/react-table` 9.2.4 — the DataTable engine. 28.4k stars, pushed 2026-09-16. | `DIRECT_DEPENDENCY` |
| [TanStack/virtual](https://github.com/TanStack/virtual) | MIT | yes | yes | yes | keep notice | **Adopted in V0.3** as `@tanstack/react-virtual` 3.14.13 — opt-in row virtualisation only. | `DIRECT_DEPENDENCY` |
| [downshift-js/downshift](https://github.com/downshift-js/downshift) | MIT | yes | yes | yes | keep notice | **Adopted in V0.3** as `downshift` 9.4.0 — the Combobox state machine. 12.3k stars. | `DIRECT_DEPENDENCY` |
| [emilkowalski/sonner](https://github.com/emilkowalski/sonner) | MIT | yes | yes | yes | keep notice | **Adopted in V0.3** as `sonner` 2.0.8. Theming is done through its documented CSS variables and class names, not by overriding its stylesheet with `!important`. | `DIRECT_DEPENDENCY` |
| [dip/cmdk](https://github.com/dip/cmdk) | MIT | yes | yes | yes | keep notice | **Adopted in V0.3** as `cmdk` 1.1.1. Last push 2025-10-29; the API surface we use is small and stable. | `DIRECT_DEPENDENCY` |
| [mui/base-ui](https://github.com/mui/base-ui) | MIT | yes | yes | yes | keep notice | Modern unstyled primitives, actively developed. Not adopted: a second primitive system next to Radix. Combobox semantics studied. | `REFERENCE_ONLY` |
| [ariakit/ariakit](https://github.com/ariakit/ariakit) | MIT per `package.json` of `ariakit@2.0.0-next` | yes | yes | yes | keep notice | **Caveat:** the GitHub API does not currently detect a root LICENSE file in the repository (checked 2026-09-26); the npm package declares MIT. Not adopted, so no obligation arises. Would need a manual review before any code were copied. | `REFERENCE_ONLY` |
| [tailwindlabs/headlessui](https://github.com/tailwindlabs/headlessui) | MIT | yes | yes | yes | keep notice | Already listed above; V0.3 studied its `Listbox`/`Combobox` keyboard behaviour specifically. | `REFERENCE_ONLY` |
| [glideapps/glide-data-grid](https://github.com/glideapps/glide-data-grid) | MIT | yes | yes | yes | keep notice | The DataGrid boundary reference: canvas cells, editing, fill handles, range copy — all deliberately out of scope for LUC DataTable. | `REFERENCE_ONLY` |
| [emilkowalski/vaul](https://github.com/emilkowalski/vaul) | MIT | yes | yes | yes | keep notice | **Unmaintained** — the README says so. Not adopted. The LUC Sheet uses the Radix Dialog already in the tree. | `REFERENCE_ONLY` |
| [bvaughn/react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) | MIT | yes | yes | yes | keep notice | Planned for research-terminal layouts. | `DIRECT_DEPENDENCY` (planned) |
| [emilkowalski/sonner](https://github.com/emilkowalski/sonner) | MIT | yes | yes | yes | keep notice | Toast interaction and stacking studied for a future LUC toast. | `REFERENCE_ONLY`, `DIRECT_DEPENDENCY` (planned) |

### V0.4 additions (forms, dates, specialised inputs)

| Repository | License | Commercial | Modify | Redistribute | Attribution | Caveats | LUC classification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [adobe/react-spectrum](https://github.com/adobe/react-spectrum) (React Aria Components) | Apache-2.0 | yes | yes | yes | NOTICE file + attribution; state changes | **Adopted in V0.4** as `react-aria-components` 1.21.1 — the date/time, number and file behaviour layer. Apache-2.0 requires reproducing the NOTICE file contents for distributed copies; the `LICENSE`/`NOTICE` files ship inside the installed package. `@internationalized/date` 3.12.4 (same repo, Apache-2.0) supplies the value types and locale data. | `DIRECT_DEPENDENCY` |
| [react-hook-form/react-hook-form](https://github.com/react-hook-form/react-hook-form) | MIT | yes | yes | yes | keep notice | **Adopted in V0.4** as an *optional peer dependency* (`react-hook-form@7.89.0`), reached only through `@luc/ui/forms/react-hook-form`. Products that do not use it never load it. | `DIRECT_DEPENDENCY` (optional peer) |
| [@hookform/resolvers](https://github.com/react-hook-form/resolvers) | MIT | yes | yes | yes | keep notice | Bridges Standard Schema (Zod 4, Valibot) and other validators into React Hook Form. Showcase-only in V0.4. | `DIRECT_DEPENDENCY` (Showcase) |
| [TanStack/form](https://github.com/TanStack/form) | MIT | yes | yes | yes | keep notice | Evaluated on merit, not adopted: its render-prop field API already composes with LUC `Field`, so an adapter would add surface without removing work. | `REFERENCE_ONLY` |
| [colinhacks/zod](https://github.com/colinhacks/zod) | MIT | yes | yes | yes | keep notice | Validation library for the Showcase resolver demo only; `@luc/ui` never imports it. | `DIRECT_DEPENDENCY` (Showcase) |
| [standard-schema/standard-schema](https://github.com/standard-schema/standard-schema) | MIT | yes | yes | yes | keep notice | **Compatibility target, not a dependency.** `@hookform/resolvers` implements it; LUC never imports the spec package. | `REFERENCE_ONLY` |
| [fabian-hiller/valibot](https://github.com/fabian-hiller/valibot) | MIT | yes | yes | yes | keep notice | Same Standard Schema path as Zod. Studied, not installed. | `REFERENCE_ONLY` |
| [gpbl/react-day-picker](https://github.com/gpbl/react-day-picker) | MIT | yes | yes | yes | keep notice | Not adopted: `Date`-based values, no time field, no zoned value. | `REFERENCE_ONLY` |
| [date-fns/date-fns](https://github.com/date-fns/date-fns) | MIT (npm metadata; GitHub's detector does not recognise the split license files) | yes | yes | yes | keep notice | Not adopted: only useful with a `Date` model, which V0.4 deliberately avoids. | `REFERENCE_ONLY` |
| [guilhermerodz/input-otp](https://github.com/guilhermerodz/input-otp) | MIT | yes | yes | yes | keep notice | **Adopted in V0.4** as `input-otp@1.5.0` — the OTP behaviour (one real input, paste, backspace navigation). Visuals are LUC. | `DIRECT_DEPENDENCY` |
| [react-dropzone/react-dropzone](https://github.com/react-dropzone/react-dropzone) | MIT | yes | yes | yes | keep notice | Not adopted: React Aria already supplies `FileTrigger` + `DropZone`; dropzone's rejection semantics were studied. | `REFERENCE_ONLY` |
| [s-yadav/react-number-format](https://github.com/s-yadav/react-number-format) | MIT | yes | yes | yes | keep notice | Not adopted: React Aria `NumberField` already parses and formats through `Intl`. | `REFERENCE_ONLY` |
| [apache/echarts](https://github.com/apache/echarts) | Apache-2.0 | yes | yes | yes | NOTICE + attribution | Installed `echarts@6.1.0`; the package ships `LICENSE`, `NOTICE` and `licenses/`. Patent grant included. | `DIRECT_DEPENDENCY` |
| [tradingview/lightweight-charts](https://github.com/tradingview/lightweight-charts) | Apache-2.0 | yes | yes | yes | **attribution notice required** | Installed `lightweight-charts@5.2.1`. Trademark: do not imply TradingView endorsement. The adapter keeps `layout.attributionLogo` enabled — the library's own docstring states this is sufficient to meet the notice requirement — and never hides it. | `DIRECT_DEPENDENCY` |
| [airbnb/visx](https://github.com/airbnb/visx) | MIT | yes | yes | yes | keep notice | Escape hatch for bespoke visualisations. Not installed; nothing in V0.2 needed it. | `REFERENCE_ONLY` (reserved escape hatch) |
| [leeoniya/uPlot](https://github.com/leeoniya/uPlot) | MIT | yes | yes | yes | keep notice if copied | Studied for cursor synchronisation and dense-series performance. No code copied. | `REFERENCE_ONLY` |
| [ChartGPU/ChartGPU](https://github.com/ChartGPU/ChartGPU) | MIT | yes | yes | yes | keep notice if copied | WebGPU research. WebGPU availability is not universal; not a dependency. | `REFERENCE_ONLY` |
| [f5/unovis](https://github.com/f5/unovis) | Apache-2.0 | yes | yes | yes | NOTICE + attribution | Modular chart library with strong defaults; rejected as a second engine. | `REFERENCE_ONLY` |
| [antvis/G2](https://github.com/antvis/G2) | MIT | yes | yes | yes | keep notice if copied | Grammar-of-graphics ideas informed `ChartSpec`. | `REFERENCE_ONLY` |
| [vega/vega-lite](https://github.com/vega/vega-lite) | BSD-3-Clause | yes | yes | yes | keep notice | Declarative encoding model studied. BSD-3 requires the notice and no endorsement. | `REFERENCE_ONLY` |
| [plotly/plotly.js](https://github.com/plotly/plotly.js) | MIT | yes | yes | yes | keep notice if copied | Feature-coverage reference only; bundle weight rules it out. | `REFERENCE_ONLY` |
| [chartjs/Chart.js](https://github.com/chartjs/Chart.js) | MIT | yes | yes | yes | keep notice if copied | Plugin and decimation architecture studied. | `REFERENCE_ONLY` |
| [recharts/recharts](https://github.com/recharts/recharts) | MIT | yes | yes | yes | keep notice if copied | Declarative composition studied. | `REFERENCE_ONLY` |
| [react-financial/react-financial-charts](https://github.com/react-financial/react-financial-charts) | MIT | yes | yes | yes | keep notice if copied | Feature vocabulary for a mature financial chart. Unmaintained since 2024. | `REFERENCE_ONLY` |
| [plouc/nivo](https://github.com/plouc/nivo) | MIT | yes | yes | yes | keep notice | Studied for legend/tooltip patterns; ECharts preferred as the general engine. | `REFERENCE_ONLY` |
| [Remix-Design/RemixIcon](https://github.com/Remix-Design/RemixIcon) | Remix Icon License v1.0 (2026) | yes | yes | yes, as part of a larger work | optional | The only restriction: the icons may not be marketed or sold as the primary value of a product. | `DIRECT_DEPENDENCY` |
| [bergside/typeui](https://github.com/bergside/typeui) | MIT (repo `LICENSE.md`) | yes | yes | yes | keep notice | GitHub reports `NOASSERTION` because of the file layout; the text is MIT. Paid TypeUI content was **not** accessed. | `REFERENCE_ONLY` |
| [bergside/awesome-design-skills](https://github.com/bergside/awesome-design-skills) | MIT | yes | yes | yes | keep notice | 69 public design skills. The *structure* of the `SKILL.md`/`DESIGN.md` pair informed our own. | `ADAPT_SOURCE` (structure only; see provenance) |
| [bergside/design-md-chrome](https://github.com/bergside/design-md-chrome) | MIT | yes | yes | yes | keep notice | Design-extraction tooling; studied conceptually. | `REFERENCE_ONLY` |

## Discovered projects (found during the search, not on the original list)

| Repository | License | Commercial | Redistribute | Caveats | LUC classification |
| --- | --- | --- | --- | --- | --- |
| [motiondivision/motion](https://github.com/motiondivision/motion) | MIT | yes | yes | Installed as `motion`. Used for imperative tweening only. | `DIRECT_DEPENDENCY` |
| [barvian/number-flow](https://github.com/barvian/number-flow) | MIT | yes | yes | Excellent digit-roll implementation. LUC's `NumberTicker` is our own, but this is the reference to beat if we ever need per-digit motion. | `REFERENCE_ONLY` |
| [emilkowalski/vaul](https://github.com/emilkowalski/vaul) | MIT | yes | yes | Drawer/sheet interaction. Candidate for a future LUC `Sheet`. | `REFERENCE_ONLY`, `DIRECT_DEPENDENCY` (planned) |
| [mui/base-ui](https://github.com/mui/base-ui) | MIT | yes | yes | A credible alternative primitive layer; Radix chosen for maturity and coverage. Revisit in V1.0. | `REFERENCE_ONLY` |
| [pacocoursey/cmdk](https://github.com/pacocoursey/cmdk) | MIT | yes | yes | Command palette primitive. Candidate for a LUC command menu. | `DIRECT_DEPENDENCY` (planned) |
| [f5/unovis](https://github.com/f5/unovis) | Apache-2.0 | yes | yes | Attractive chart library with a strong visual default; ECharts chosen for breadth and data-scale behaviour. | `REFERENCE_ONLY` |
| [glideapps/glide-data-grid](https://github.com/glideapps/glide-data-grid) | MIT | yes | yes | Canvas data grid for very large tables. Too heavy for V0.1; consider for a research terminal. | `REFERENCE_ONLY` |
| [clauderic/dnd-kit](https://github.com/clauderic/dnd-kit) | MIT | yes | yes | Accessible drag and drop for future chart/series reordering. | `DIRECT_DEPENDENCY` (planned) |
| [downshift-js/downshift](https://github.com/downshift-js/downshift) | MIT | yes | yes | Combobox/autocomplete primitive. Candidate for a LUC `Combobox`. | `REFERENCE_ONLY`, `DIRECT_DEPENDENCY` (planned) |
| [google/fonts](https://github.com/google/fonts) (Inter, Inter Tight, JetBrains Mono) | SIL OFL 1.1 | yes | yes | OFL requires that the fonts are not sold on their own and that Reserved Font Names are respected if modified. We ship them unmodified. | `DIRECT_DEPENDENCY` (via `@fontsource-variable/*`) |

## Explicitly excluded

| Repository | Reason |
| --- | --- |
| Animate UI, React Bits | MIT + Commons Clause. Behaviour studied, source never copied, and no code was translated line-by-line either. |
| Any Uiverse entry without an explicit license header | Galaxy is MIT, but individual submissions can carry their own terms. We did not copy any submission. |
| Paid TypeUI content | Never accessed. Only the public MIT-licensed repositories were read. |

## Verification commands used

```bash
# License file, per repository (main or master branch)
curl -sSL https://raw.githubusercontent.com/<owner>/<repo>/main/LICENSE

# Metadata: stars, SPDX id, last push
curl -sS https://api.github.com/repos/<owner>/<repo>

# Packages: registry metadata, and the packed manifest as the final check
npm view <package> version license
npm pack <package>@<version> && tar -xzOf <tarball> package/package.json | grep license
```

## V0.5 rows (verified 2026-09-26)

| Repository | License | Adopted | Runtime | Note | Class |
| --- | --- | --- | --- | --- | --- |
| [bvaughn/react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) | MIT | yes | yes (`@luc/ui` dependency) | v4.13.3. Panes, separators, keyboard resize, constraints. License read from the packed manifest. | `DIRECT_DEPENDENCY` |
| [47ng/nuqs](https://github.com/47ng/nuqs) | MIT | yes | Showcase only | v2.10.1. Framework adapter; the LUC codecs stay router-agnostic. | `DIRECT_DEPENDENCY` (Showcase) |
| [rolldown/tsdown](https://github.com/rolldown/tsdown) | MIT | yes | no (dev) | v0.23.0. Package build. | `DIRECT_DEPENDENCY` (dev) |
| [publint/publint](https://github.com/bluwy/publint) | MIT | yes | no (dev) | v0.3.24. Lints the packed tarball. | `DIRECT_DEPENDENCY` (dev) |
| [arethetypeswrong/arethetypeswrong.github.io](https://github.com/arethetypeswrong/arethetypeswrong.github.io) | MIT | yes | no (dev) | `@arethetypeswrong/cli` v0.18.5. | `DIRECT_DEPENDENCY` (dev) |
| [shadcn-ui/lint](https://github.com/shadcn-ui/lint) | MIT | no (deferred to V1.0) | no | 0.2.0; needs a contract per component. Two rules reimplemented natively. | `REFERENCE_ONLY` |
| [rolldown/rolldown](https://github.com/rolldown/rolldown) | MIT | indirect | no | Bundler under tsdown. | `DO_NOT_USE` directly |
| [unjs/unbuild](https://github.com/unjs/unbuild) | MIT | no | no | Studied as a packaging alternative; `tsdown` chosen for `unbundle` + declaration quality. | `REFERENCE_ONLY` |
| [egoist/tsup](https://github.com/egoist/tsup) | MIT | no | no | Studied; tsdown is its Rolldown-based successor. | `REFERENCE_ONLY` |
| [vitejs/vite](https://github.com/vitejs/vite) | MIT | yes | yes (dev, tests + consumer test) | Library mode evaluated for packaging. | `DIRECT_DEPENDENCY` (dev) |

## V0.6 rows (verified 2026-09-26)

No new dependency was adopted in this round. The TradingView integration is a
*provider integration*, not a package: nothing from TradingView is installed,
bundled or vendored, and the widgets are loaded from the provider's own hosts at
runtime.

| Repository | License | Adopted | Runtime | Note | Class |
| --- | --- | --- | --- | --- | --- |
| [JorrinKievit/react-ts-tradingview-widgets](https://github.com/JorrinKievit/react-ts-tradingview-widgets) | MIT (GitHub API + `LICENSE`) | no | no | 224★, last push 2026-04. iframe-only wrapper; sets `script.src` from a prop and instantiates the provider's global `TradingView.widget`. Read for API shape; **no code copied**. | `REFERENCE_ONLY` |
| [rafaelklaessen/react-tradingview-widget](https://github.com/rafaelklaessen/react-tradingview-widget) | MIT | no | no | 292★, last push 2023-10. Single chart widget, unmaintained. | `REFERENCE_ONLY` |
| [MalkinK/oakview](https://github.com/MalkinK/oakview) | MIT | no | no | Wraps Lightweight Charts — the wrong lane for widgets. | `DO_NOT_USE` |
| TradingView widget documentation and wizard schema (`tradingview.com`, `widgets.tradingview-widget.com`) | Proprietary, provider-served | attributable use only | loaded from the provider's hosts | Attribute names, encodings and defaults were read from the provider's public wizard modules to build a correct typed API. No provider source is copied into the repository, and no provider code is self-hosted. | `DESIGN_REFERENCE` |

Verify commands used this round:

```bash
curl -sS https://api.github.com/repos/<owner>/<repo>            # license + last push
curl -sS https://api.github.com/repos/<owner>/<repo>/contents/src
curl -sS -D - -o /dev/null https://widgets.tradingview-widget.com/w/en/tv-mini-chart.js   # CORS + host check
curl -s -o /dev/null -w "%{http_code}" https://s3.tradingview.com/external-embedding/embed-widget-<name>.js
```

## V1.0 rows (verified 2026-09-27)

No new dependency was adopted in this round either. Every primitive the four new
families needed was already inside `radix-ui@1.6.7`, which the package has
depended on since V0.1:

| Repository | License | Adopted | Runtime | Note | Class |
| --- | --- | --- | --- | --- | --- |
| [radix-ui/primitives](https://github.com/radix-ui/primitives) | MIT | yes, already | yes | `radix-ui@1.6.7` re-exports `@radix-ui/react-slider@1.4.7`, `@radix-ui/react-dropdown-menu@2.1.24` and `@radix-ui/react-context-menu@2.3.7`. No new package, no lockfile change, no second primitive stack. | `DIRECT_DEPENDENCY` |

Libraries read for *inventory and semantics* while designing the four families.
Nothing was copied from any of them; each is already recorded with its licence
above, and none was re-fetched (the sandbox has no network, so this is an
offline re-read of the recorded facts):

| Repository | License (as recorded) | What informed the design | Class |
| --- | --- | --- | --- |
| [Radix UI](https://github.com/radix-ui/primitives) | MIT | Slider keyboard model incl. `minStepsBetweenThumbs`; menu item/indicator/SubTrigger composition. | `REFERENCE_ONLY` (already a direct dependency) |
| [Base UI](https://github.com/mui/base-ui) | MIT | Slider value/threshold API shape and menu `inset` alignment. | `REFERENCE_ONLY` |
| [React Aria Components](https://github.com/adobe/react-spectrum) | Apache-2.0 | Slider label/value semantics; alert live-region policy. | `REFERENCE_ONLY` (already a direct dependency for date/time) |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | MIT | Menu shortcut/indicator recipes and the empty-state composition. | `REFERENCE_ONLY` |
| [Mantine](https://github.com/mantinedev/mantine) | MIT | EmptyState and Alert inventory comparison only. | `REFERENCE_ONLY` |
| [Chakra UI](https://github.com/chakra-ui/chakra-ui) | MIT | Alert tone vocabulary (`info/success/warning/error`). | `REFERENCE_ONLY` |
| [Ark UI](https://github.com/chakra-ui/ark) | MIT | Slider/range thumb semantics cross-check. | `REFERENCE_ONLY` |
| [ariakit/ariakit](https://github.com/ariakit/ariakit) | MIT (npm; GitHub API still reports no licence file) | Menu/context-menu focus behaviour cross-check. | `REFERENCE_ONLY` |

The package dependency list, the lockfile and the peer set are unchanged from
V0.6. `pnpm verify` runs without an install.
