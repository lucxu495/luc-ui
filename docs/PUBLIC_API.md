# Luc UI V1 — public API

The declared package export map defines importable paths. The generated
[component catalog](./COMPONENT_CATALOG.md) lists every current public symbol,
its declaring source and packed target; use it for exact names and signatures.
The V1 compatibility policy is in [versioning](./VERSIONING.md). A symbol may
be publicly reachable through the root barrel without having its own subpath.

Package: `@luc/ui` · version `1.0.1` · ESM only · React 19 peer.

## Import paths

For the complete, generated list see [COMPONENT_CATALOG.md](./COMPONENT_CATALOG.md)
or [component-catalog.json](./component-catalog.json). These files derive from
`packages/ui/package.json` and TypeScript public barrels. Examples of the
recommended narrow entries:

| Need | Recommended import | Composition note |
| --- | --- | --- |
| Button action or button-looking link | `@luc/ui/components/button` | `Button` is a native button; apply `buttonVariants` to an anchor. No `asChild`. |
| Text entry | `@luc/ui/components/input` | `Input` is on this subpath; `Textarea` and `SearchInput` are root exports. |
| Known choice | `@luc/ui/components/select` | Use with `Field`; `Combobox` has its own subpath for searchable choices. |
| Table | `@luc/ui/data-table` | `DataTable` and `VirtualDataTable` render native tables. |
| Prepared chart | `@luc/ui/charts` | Import chart and synchronization APIs here; keep engines and data calculations outside the UI. |
| Financial chart | `@luc/ui/financial-chart` | Lightweight Charts price-series entry. |
| Provider widget | `@luc/ui/tradingview` | Separate provider integration; not in the root barrel. |
| Application shell / workspace | `@luc/ui/app-shell`, `@luc/ui/workspace` | Inject routing and compose panes from the public entries. |
| Forms and date | `@luc/ui/forms`, `@luc/ui/datetime`, `@luc/ui/date-picker`, `@luc/ui/calendar` | React Hook Form is optional under `@luc/ui/forms/react-hook-form`. |
| Styles and tokens | `@luc/ui/styles.css`, `@luc/ui/tokens.css` | CSS entries are not JavaScript modules. |

> `IconButton` and `Link` are their own families, not part of the button entry:
> both are exported from the root barrel (`@luc/ui`). The button *recipe*
> (`buttonVariants`) travels with `Button` so a consumer can style an anchor
> without reaching for the root barrel.

## Phase 4 additions (V4.0)

Seventeen component families and thirty-five chart types were added in the
spatial-language cycle. **All of them are root-barrel or `@luc/ui/charts`
exports**: not one new subpath was introduced, because every new component is
light and dependency-free. The generated catalog remains the source of truth for
exact names, and `/charts/catalog` in the Showcase lists every chart type with a
status.

| Group | Symbols | Entry |
| --- | --- | --- |
| Disclosure | `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`, `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`, `CollapsibleTriggerRow` | `@luc/ui` |
| Confirmation | `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogAction`, `AlertDialogCancel` | `@luc/ui` |
| Paging and scrolling | `Pagination`, `PaginationSummary`, `paginationWindow`, `ScrollArea`, `ScrollAreaRoot` | `@luc/ui` |
| Pressed states | `Toggle`, `ToggleGroup`, `ToggleGroupItem`, `toggleVariants` | `@luc/ui` |
| Identity | `Avatar`, `AvatarGroup`, `AvatarRoot`, `initialsOf` | `@luc/ui` |
| Field parts | `InputGroup`, `InputGroupAddon`, `InputGroupInput`, `InputGroupSeparator`, `Label`, `NativeSelect`, `Kbd`, `KbdGroup` | `@luc/ui`; `InputGroup*` is also on `@luc/ui/forms` |
| Grouped actions | `ButtonGroup`, `ButtonGroupSeparator`, `Toolbar`, `ToolbarButton`, `ToolbarSeparator`, `ToolbarLink`, `ToolbarToggleGroup`, `ToolbarToggleItem` | `@luc/ui` |
| Sequence and display | `Timeline`, `Stepper`, `Rating`, `Carousel`, `CarouselTrack`, `CarouselItem`, `CarouselControls`, `useCarousel`, `AspectRatio`, `HoverCard`, `HoverCardContent`, `HoverCardTrigger` | `@luc/ui` |
| Charts | 35 types across the statistical, scientific, workflow, quantitative and multidimensional packs, plus `registerEChartsMap`, `formatRatio`, `ratioAxis`, `ratioOrFormatAxis` | `@luc/ui/charts` |

Two contracts worth reading before using them:

- **`aside` on a disclosure trigger is non-interactive.** A button inside a
  button is invalid HTML; the browser un-nests it and React reports a hydration
  failure. Put the control next to the trigger.
- **A chart never computes.** Every value is supplied by the caller; the only
  transforms are documented display mappings, and `formatRatio` is the single
  one that changes a number — applied once, at the rendering boundary.

## Root barrel policy

The root barrel exists so a product can write
`import { Button, Field, Card } from "@luc/ui"` without hunting for a subpath.
It is safe because every module is `unbundle`-built and side-effect-free apart
from CSS, and because the heavy families are still isolated:

* importing `@luc/ui/components/button` does not pull ECharts, Lightweight
  Charts, the date system or any TradingView code — measured at 5.7 KB raw /
  2.1 KB gzip in `scripts/consumer-test.mjs`;
* importing `@luc/ui/date-picker` does not pull a chart engine;
* importing `@luc/ui/tradingview` does not fetch provider code until a wrapper
  actually renders.

`@luc/ui/tradingview` is deliberately **not** re-exported from the root barrel,
so a plain `@luc/ui` import can never bring provider hosts into a bundle.

## Stability levels

| Level | Meaning |
| --- | --- |
| **Stable** | Declared public paths and exported symbols in the generated catalog, subject to `VERSIONING.md`. Breaking changes require a major version. |
| **Third-party integration** | The TradingView wrappers. Luc UI's own props and registry are stable; TradingView may change a widget's behaviour or attributes without notice, and the audit trail lives in `docs/research/v0.6-tradingview-policy-audit.md`. |
| **Not a public path** | Direct imports of `components/menu-shared`, `charts/core/*`, `charts/adapters/*`, `integrations/tradingview/core/*`, the Showcase app, or any `src/` file. Some helpers defined in those files are deliberately re-exported by public barrels; import them through the declared path in the catalog. |

There is no `experimental` namespace at V1. If a capability is not ready to
freeze, it is not exported.

## Rules

1. Import from a subpath, or from `@luc/ui`. Never from `@luc/ui/src` or
   `@luc/ui/dist`.
2. Import the stylesheet once, at the app root:
   `@import "tailwindcss"; @import "@luc/ui/styles.css";`
3. Wrap the application in `LucProvider`. A product that needs an explicit
   locale or a fixed theme composes `ThemeProvider` and `LocaleProvider`
   instead.
4. Composition beats re-styling. If a component does not look right, the token
   is usually the thing to change — `DESIGN_SYSTEM.md` §9 explains which one.
5. Check the generated component catalog and the historical `docs/COMPONENT_INVENTORY.md` before building a local primitive.

## Versioning

See `docs/VERSIONING.md`. V1.0.0 is the frozen foundation; the changes that were
needed to arrive here are in `CHANGELOG.md` and `MIGRATION_V1.md`.
