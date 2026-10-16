# LUC UI V1 — public API audit

The purpose of this document is to *measure* the public surface, not to praise
it. Every claim below comes from reading `packages/ui/src` and the export map in
`packages/ui/package.json`; the counts are from `rg` over the source at the V1
freeze, and the conventions were checked against the code rather than recalled.

This is the audit behind `docs/PUBLIC_API.md` (what is frozen) and
`CHANGELOG.md` (what changed).

## 1. What is public

| Surface | Where it is declared | Size at the freeze |
| --- | --- | --- |
| Root barrel | `src/index.ts` | 40+ families, every domain re-exported |
| Curated subpaths | `package.json → exports` | 34 keys: 31 module entries + `styles.css` + `tokens.css` + `package.json` |
| Compiled output | `dist/` | 176 modules, 166 declaration files |
| Charts entry | `@luc/ui/charts` | one adapter boundary; engines never leak |
| TradingView entry | `@luc/ui/tradingview` | provider wrappers only, never on the root barrel |

The barrel is a convenience, not the architecture. The subpath map is what
guarantees isolation, and `scripts/consumer-test.mjs` fails the build if a
button-only consumer pulls a chart engine, the date system or a provider host.

## 2. Naming conventions, as measured

### 2.1 Value-bearing controls

`value` / `defaultValue` / `onValueChange` is used by every control that owns a
value: `Slider`, `RangeSlider`, `Select`, `Combobox`, `RadioGroup`, `Tabs`,
`SegmentedControl`, `TagInput`, `DatePicker`, `DateRangePicker`, `Calendar`,
`TimePicker`, `DateTimePicker`, `OtpInput`, `NumberInput` (through React Aria's
contract), `DataTable` state slices.

`onValueChange?` is by far the most common callback in the package (21
declarations at the freeze). The exceptions are deliberate:

| Callback | Used by | Why it is not `onValueChange` |
| --- | --- | --- |
| `onCheckedChange` | `Checkbox`, `Switch`, menu checkbox/radio items | The value is a boolean *state*, and this is the contract Radix and React Aria already publish. |
| `onOpenChange` | `Dialog`, `Sheet`, `Popover`, `Tooltip`, `CommandMenu`, `InspectorPane` | It reports disclosure, not a value. |
| `onSelect` | menu items, combobox options | It reports *choosing*, and the menu closes as a side effect. |
| `onValueCommit` | `Slider`, `RangeSlider` | It distinguishes "moving" from "settled", which is what a caller needs to write a URL or fire a request. |
| `onRowClick` | `DataTable` | The row is not a value the table owns. |
| `onReady`, `onCursor`, `onRange` | chart engines and `ChartSyncGroup` | Engine events, documented separately in `CHART_GUIDE.md`. |

### 2.2 Disclosure

`open` / `defaultOpen` / `onOpenChange` is uniform across every overlay.
`CommandMenu` follows it; `InspectorPane` follows it (`open`, `onOpenChange`);
`Workspace` uses `focusedId` / `onFocusedIdChange` because its state is a pane
identity rather than a boolean, and that is documented in `WORKSPACE_GUIDE.md`.

### 2.3 Size vocabulary

`ControlSize = "sm" | "md" | "lg"` is the control scale and is shared by every
form control through `components/input.tsx`. Components with a narrower design
space use a documented subset:

| Scale | Components | Rationale |
| --- | --- | --- |
| `sm \| md \| lg` | `Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Combobox`, `Slider`, `Badge`, `Metric`, `StatCard`, `Heading` | The control scale. |
| `sm \| md` | `Switch`, `Progress`, `SegmentedControl`, `StatusBadge`, `EmptyState` | A larger variant would be a different component. |
| Component-specific | `Sheet` (`sm…full`), `Card` `padding` (`none…lg`), `Skeleton` `variant` | These are not sizes of a control; forcing them into `ControlSize` would be a lie. |

There is no `xs` and no `xl` in the public vocabulary. `Tabs` keeps its own
`TabsSize` alias for the same three values so the type name travels with the
component.

### 2.4 `variant` vs `tone`

The rule, applied consistently at the freeze:

* `variant` — the structural/visual *form* of a component: `Button`
  (`primary | secondary | outline | ghost | danger`), `Card`
  (`default | raised | outline | ghost`), `Link` (`default | muted | accent`),
  `Tabs` (`underline | segmented`), `Skeleton` (`text | block | circle`),
  `Separator` (`line | ornament`), menu items (`default | destructive`).
* `tone` — the semantic *colour/message intent*: `Badge`, `Alert`, `Panel`
  (`default | sunken | raised`), `Text`, `Progress`, chart series (`tone` is an
  alias for a palette slot).

`Panel` is the one component where `tone` describes a surface rather than a
message; it is retained because `Panel.tone="raised"` is the composition
vocabulary the shell and cards already use, and renaming it would break
consumers for no gain. It is recorded here as a documented exception.

### 2.5 `loading`

`loading?: boolean` is presentation state and appears on `Button`,
`IconButton` and `Combobox` (a busy option list). It never means "a form is
submitting".

Form lifecycle is separate and explicit: `Form` exposes
`status: "idle" | "submitting" | "success" | "error"` through `useLucForm()`,
`SubmitButton` owns the submit affordance, and `Field` has its own
`validating` / `success` message states. That distinction is deliberate and is
documented in `FORM_GUIDE.md`.

### 2.6 `disabled` and `readOnly`

| Support | Components |
| --- | --- |
| `disabled` | every interactive control, plus `Field`, `Form`, `WorkspaceGroup` (`locked`), `Slider`, menu items, `DataTable` rows |
| `readOnly` | text-entry controls only: `Input`, `Textarea`, `NumberInput`, `CurrencyInput`, `PercentageInput`, date/time fields, `Field` |
| Neither | display components (`Badge`, `Metric`, `Panel`, `Card`, `Skeleton`, `Progress`, `Alert`, `EmptyState`) |

`readOnly` is not added to controls where it has no meaning. Where a control is
both, the disabled state is expressed with tokens rather than a blanket
`opacity` — the V0.4 contrast defect — and `Slider` follows the same rule.

### 2.7 `className`, refs and data attributes

* `className` always lands on the element the consumer is naming. When a
  component has an inner input, the inner element gets a dedicated prop
  (`inputClassName` on `Input`).
* Every public component forwards a ref through
  `React.ComponentPropsWithRef<…>`, including the Radix wrappers, which forward
  to the underlying DOM node — never to a third-party instance.
* Every rendered root carries `data-slot="<name>"`, which is the documented hook
  for tests and for the Showcase QA suite. Internal `data-*` state attributes
  (for example `data-state` from Radix) are passthrough and are not part of the
  LUC contract.

### 2.8 Escape hatches

| Hatch | Where | Contract |
| --- | --- | --- |
| `className` / `style` | everywhere | Composition and layout only. The design-system lint rule still forbids raw colour literals. |
| `extendOption`, `onReady` | `@luc/ui/charts` | The supported way to reach an engine without touching an adapter. |
| `config?: TradingViewRawConfig` | `@luc/ui/tradingview` | Provider configuration only. It cannot replace the loader URL, the host allow-list or the attribution block. |
| `asChild` | `Button`, Radix-backed triggers | Composition, not a second component. |

There is no `renderProp`, no `styleProps`, no `getRootProps`, and no public
adapter instance. If a consumer needs one, the answer is a documented
composition rather than a new escape hatch.

## 3. Public hooks

Hooks are public only when a product genuinely composes around them:

| Hook | Entry | Why it is public |
| --- | --- | --- |
| `useControllableState` | `@luc/ui/hooks` | The controlled/uncontrolled primitive every product-owned control needs. |
| `usePersistentState` (+ `createMemoryStorage`, `createBrowserStorage`) | `@luc/ui/hooks` | Personal-state persistence, versioned and SSR-safe. |
| `useMediaQuery`, `useReducedMotion`, `useIsomorphicLayoutEffect` | `@luc/ui/hooks` | Layout and motion decisions a product must make too. |
| `useSpotlight` | `@luc/ui` and `@luc/ui/hooks` | Used by the creative surfaces. |
| `useSlidingIndicator` | `@luc/ui/hooks` only | Backs the segmented indicator; kept public because the measurement is reusable, but out of the root barrel. |
| `useTheme`, `useDensity`, `useLocale` | `@luc/ui/providers` | Reading the active theme/locale is a legitimate product need. |
| `useUrlState`, `createBrowserUrlStateAdapter`, codecs | `@luc/ui/url-state` | The shareable-state layer is router-agnostic by design. |
| `useWorkspace`, `useWorkspaceGroup`, `useWorkspaceLayout` | `@luc/ui/workspace` | A pane header, toolbar or inspector row needs the surrounding mode. |
| `useChartInspection`, `useChartInspectionContext` | `@luc/ui/charts` | The pin is consumer-owned state (it can be written to the URL). |
| `useField`, `useLucForm`, `useCommandPages`, `useCommandHotkey`, `useNavigation` | their families | Composition inside a `Field`, `Form`, command palette or shell. |

Two hooks are **not** public even though they exist internally:
`useChartId` (the SSR-safe element-id helper in `charts/core`) and the menu
internals in `components/menu-shared.tsx`. They are implementation detail and
are deliberately absent from the entry points.

## 4. Public types

Exported types are named for the consumer's job: `<Component>Props`,
domain value types (`CalendarDate`, `Time`, `ZonedDateTime`, `ChartSpec`,
`DataTableColumn`), and documented unions (`ControlSize`, `AlertTone`,
`MenuItemVariant`, `SeriesTone`).

Nothing named `Internal*`, `*Impl` or `*Config2` reaches a public entry point.
The only types that describe third-party internals are the ones a consumer must
hold to configure a chart (`EChartsInstance` is not exported; `ChartSpec` is).

## 5. Consistency findings and decisions

| Finding | Decision |
| --- | --- |
| `Panel` uses `tone` where other surfaces use `variant`. | **Keep**, documented above. Renaming it is a breaking change with no behavioural gain. |
| `Sheet` has five sizes instead of three. | **Keep**; the extra sizes are panel widths, not control sizes. |
| `Tabs` has a `TabsSize` alias for `ControlSize`. | **Keep**; the alias keeps the type readable at the call site and resolves to the same union. |
| `Delta` uses `variant: "percent" | "absolute"`. | **Keep**; it describes a numeric *format*, not a form. Documented in `data/metric`. |
| `onChange` still appears on `Input`, `Textarea` and native-like fields. | **Keep.** These deliberately behave like the native elements they render, so a product can pass an ordinary `onChange`. Controls LUC owns report through `onValueChange`/`onCheckedChange`. |
| Chart families expose `tone` and a raw `color` override. | **Keep.** `tone` is the product path; `color` exists for a prepared series that must keep its provider identity (TradingView red/green). |
| Two hooks are exported but only used internally. | **Keep** (`useSpotlight`, `useSlidingIndicator`): both are documented effects a consumer can reuse, and removing them would be a breaking change in a freeze round. |

## 6. Breaking pre-V1 cleanups in this round

Two changes are breaking *for pre-1.0 consumers*; the third is additive. All are
recorded in `MIGRATION_V1.md`:

1. **Elevation tokens renamed.** The semantic custom properties moved from
   `--shadow-*` to `--elevation-*` so Tailwind's `--shadow-*` namespace could be
   bridged to them. `shadow-sm`/`shadow-md`/`shadow-lg` now resolve to the LUC
   values instead of Tailwind's defaults, and `shadow-overlay` finally exists.
2. **Five new subpaths** (`./slider`, `./dropdown-menu`, `./context-menu`,
   `./alert`, `./empty-state`).
3. **`ChartInspectionArea` added** to `@luc/ui/charts` (additive; no existing
   prop changed), and **`isNavigationItemCurrent` added** to
   `@luc/ui/app-shell` (additive). `SidebarItem`/`SidebarSubmenu` gained a
   `data-current` attribute and now reserve `aria-current="page"` for the exact
   match; `isNavigationItemActive` is unchanged, so a suffix route still lights
   its section — see `ACCESSIBILITY.md`.

No component prop was renamed, removed or re-typed in this round.

## 7. Result

Every public family was read, not sampled. The surface is internally consistent
under the conventions in §2, every deliberate deviation is written down, and the
only accidental public API found in this round was the pair of internal menu
helpers, which were caught before the freeze because they live in a module the
barrel does not export.
