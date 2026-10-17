# Luc UI — accessibility

Accessibility is part of how a component is built, not a pass at the end. This
document is written as acceptance criteria so it can be tested, not admired.

## What is already guaranteed

1. **Behaviour comes from Radix.** Dialog focus trap and restore, tooltip and
   popover arrow-key semantics, tab roving focus, checkbox
   `aria-checked="mixed"`, switch and radio-group keyboard models. We style
   `data-state`; we do not re-implement behaviour.
2. **A single focus language.** `:focus-visible` gets a 2px
   `var(--focus-ring)` outline with a 2px offset, defined once in `base.css`.
   Components clipped by `overflow: hidden` use the `luc-focus-inset` utility
   (a ring shadow) instead.
3. **A single reduced-motion policy.** See `MOTION_GUIDE.md`.
4. **Names are required, not optional.** `IconButton` takes `label` as a
   required prop. `StatusBadge` always renders a label next to its dot.
5. **Numbers are readable and stable.** `luc-numeric` gives tabular figures so
   values do not reflow, and formatters render an em dash instead of `NaN`.

## Acceptance criteria per component

**Button** — reachable by Tab; `Enter`/`Space` activate; `loading` sets
`aria-busy`, blocks the click, and keeps the button focusable with its label in
the DOM.

**IconButton** — has an accessible name; the icon itself is `aria-hidden`.

**Field + controls** — the label is associated via `htmlFor`/`id`; description
and error are wired through `aria-describedby`; `error` sets `aria-invalid` and
renders a `role="alert"` message.

**Checkbox** — Space toggles; `checked="indeterminate"` exposes
`aria-checked="mixed"`.

**Radio / RadioGroup** — arrow keys move within the group; exactly one option is
selected.

**Switch** — Space toggles; exposes `aria-checked`; the label is clickable.

**Tabs** — arrow keys move; Home/End jump; every trigger's `aria-controls`
resolves to a rendered panel.

**SegmentedControl** — single selection through a toggle group; every item has a
name (text or `aria-label`).

**Tooltip** — opens on hover and on focus; content is a clarifying sentence,
never the only place a label exists.

**Popover** — keyboard reachable; Escape closes and returns focus to the trigger.

**Dialog** — focus moves in on open, is trapped, and returns to the trigger on
close; Escape and outside-click close; `DialogTitle` supplies the accessible
name.

**Progress** — has an accessible name; the indeterminate state is announced as a
value-less progress bar.

**Skeleton** — decorative (`aria-hidden`); the busy region announces itself with
`aria-busy`.

**Spinner** — announces once (`role="status"`); pass `label={null}` when an
ancestor already announces.

**StatusBadge / FreshnessBadge** — colour is never the only signal; there is
always a text label.

**Metric / StatCard** — the label precedes the value in reading order; deltas
carry a glyph as well as colour.

**Chart surfaces** — every chart renders `role="img"` with an `aria-label`
(falling back to the family and its visible series), plus a visually hidden
description wired through `aria-describedby` when one is supplied. The financial
surface uses `role="figure"` because its canvas is focusable and the required
attribution notice is a link. A chart in the loading, empty or error state never
initialises an engine, so a screen reader reaches the state message rather than a
silent canvas.

**Chart legend** — each series toggle is a button with `aria-pressed` and the
series label as its accessible name.

**Range selector** — a single-selection radio group; every item has a name.

**Fullscreen research view** — a dialog with a title and a description; Escape
closes it, focus moves in on open and returns to the trigger on close.

## Colour and contrast

1. Body and meta text must clear **4.5:1** against its actual surface. The
   light-theme `--fg-muted` is deliberately dark enough (about 4.8:1) to be used
   at 12px.
2. `--fg-disabled` is exempt (inactive controls) and is therefore **never** used
   for content. This was a real defect found by the visual QA harness.
3. Status colour is always paired with a label or a glyph.
4. Focus indicators must be visible against both the control and the surface
   behind it; `--focus-ring` is tuned separately per theme.

## Target sizes

- Controls are 28 / 34 / 40px tall (`--control-height-*`); compact density
  lowers them to 26 / 30 / 36px.
- An icon-only control is at least 28×28px, and its hit area includes the label
  where one exists.

## How this is verified

Automated, in this repository:

```bash
pnpm --filter @luc/ui test              # behaviour: keyboard, ARIA, focus, reduced motion
pnpm --filter @luc/showcase qa:visual   # axe-core across 36 page scans (dark + light)
pnpm --filter @luc/showcase qa:mobile-a11y  # axe at 1440 and at 390 px, both locales
pnpm --filter @luc/showcase qa:reduced-motion  # does anything move, is any copy hidden
```

The harness fails the run on any `serious` or `critical` axe violation, on any
console error, and on any failed interaction check. Current state: **0
violations across 186 scans** (93 routes × desktop and 390 px), **155/155**
behaviour checks passing, and **0 findings across 16 routes** under
`prefers-reduced-motion: reduce` — where the probe samples the geometry until it
comes to rest and reports anything still moving, then does the same page again
with motion allowed to prove the reduced run actually reduced something.

Manual, per release:

1. Tab through the page — the focus ring must be visible at every stop and must
   never disappear into a surface.
2. Open a dialog, press Escape, confirm focus returns to the trigger.
3. Switch to light theme and re-read the page at 100% zoom.
4. Enable reduced motion (or use the Showcase control) and confirm no content is
   hidden or unreadable.

## Known gaps for V0.2

- No screen-reader session (VoiceOver/NVDA) has been recorded yet; the axe pass
  is automated and structural.
- The mobile navigation sheet traps focus via Radix Dialog but has not been
  tested with a mobile screen reader.
- **Chart content is not exposed as an accessible table.** A canvas chart carries
  a label and a description, not its numbers. Supply `ariaDescription` with the
  takeaway, and give the reader the prepared values somewhere real, such as a
  `Metric` or a table. A DataTable fallback for charts is planned with the V0.3
  data table, and is not claimed here.
- Crosshair and tooltip values are pointer-only. Keyboard equivalents exist for
  the *controls* (legend, range, fullscreen), not for reading a data point.

## V0.3 — data table, overlays and feedback

### What was added

| Component | Guarantee |
| --- | --- |
| `DataTable` | Real `table/thead/tbody/tr/th/td`. `aria-sort` on sortable headers, a `<caption>` (or `aria-label`) on the table, `<th scope="col">`, checkboxes with `Select row n` / `Select all rows on this page` names, and a keyboard path for every control. |
| `VirtualDataTable` | Same markup for the **visible** rows — real `<tr>` elements spaced by two `aria-hidden` rows — so semantics survive virtualisation. |
| `Select` | Radix: `role="combobox"` trigger, `role="listbox"` menu, `role="option"` with `aria-selected` and `aria-disabled`. The `Field` label binds to the trigger, so a labelled Select needs no `aria-label`. |
| `Combobox` | Downshift: `role="combobox"` input with `aria-expanded` and `aria-activedescendant`, plus `aria-autocomplete="list"`. Disabled options are announced, not merely dimmed. |
| `Sheet` | Radix Dialog: focus trap, focus restore, Escape, `aria-modal`, labelled by its title. |
| `Toast` | Sonner's live region announces each toast; the close button is labelled, and actions are real buttons. |
| `CommandMenu` | Dialog shell with an `aria-label`, listbox results and option rows; global hotkey is optional and page-scoped where a page owns its own palette. |
| `ChartDataTable` | The chart's numbers in a semantic table, reachable through a segmented control, filtered by the legend's visible series. |
| `Field` / `Fieldset` | `Field` owns the `for`/`id` pair, `aria-describedby` and `aria-invalid`; `Fieldset` renders a real `<fieldset>`/`<legend>` with the description referenced by `aria-describedby`. |
| `Form` / `FormErrorSummary` | A failed submit produces a `role="alert"` summary with `aria-live="assertive"`; each row is a button that moves focus to the offending control. The summary never steals focus on mount. |
| `NumberInput` | React Aria's spinbutton semantics, `aria-valuenow`/`aria-valuetext`, labelled increment/decrement buttons, locale-aware parsing. |
| `PasswordInput` | Real `type="password"` for password managers, a labelled reveal toggle with `aria-pressed`, paste never blocked. |
| `OtpInput` | One `<input autocomplete="one-time-code">` behind visible slots — a screen reader hears one labelled field, not six boxes. |
| `FileInput` / `DropZone` | The picker is a `<button>` that consumes the `Field` label; rejected files are listed with a name and a reason in text. |
| `TagInput` | Chips are text; every remove control is a labelled button; the text input keeps the field's label. |
| `Calendar` / `RangeCalendar` | React Aria grids: `role="grid"`, roving focus, arrow/Page/Home/End keys, `aria-selected`, unavailable days focusable and announced, plus a polite live region announcing the visible month. |
| `DateField` / `DatePicker` / `DateRangePicker` | Every segment is a labelled spinbutton; the group is named by the `Field` label through `aria-labelledby`; the popover is a dialog with focus restore. |
| `TimePicker` | Segmented time field plus an ARIA listbox column pair (`role="listbox"`/`role="option"` with roving focus) for coarse entry. |
| `LocaleProvider` | Sets the locale for date and number controls so server and client output agree. |

### Defects the harness caught in this round

1. **An ECharts tooltip whose panel background resolved to transparent**, so grid
   lines showed through the values. Root cause: a stylesheet reset
   (`.luc-chart-tooltip-shell > div`) that matched our own panel and zeroed its
   background with `!important`, plus a 96% base and a backdrop blur. Fixed with
   a dedicated opaque token; asserted in browser QA by reading the computed
   alpha of the panel.
2. **A labelled Select with no accessible name**, because the trigger was not
   consuming the `Field` id. `aria-label`-less triggers are now caught by axe.
3. **Placeholder text using `--fg-disabled`** inside a live control, which fails
   contrast. The Select placeholder now uses `--fg-muted`; the rule that
   `--fg-disabled` is never used for content still holds.
4. **A 20px clear button** below the WCAG 2.2 target-size minimum. The Combobox
   clear and chevron buttons are now 24×24.
5. **A Combobox that dropped keystrokes** when two characters arrived in one
   React batch, because the field was controlled from state. The DOM now owns
   the text and React only writes it on select, clear or caller-driven change.

### Known gaps after V0.3

### Defects the harness caught in V0.4

1. **Disabled fields dimmed with `opacity`** (six violations across four
   routes). Compositing pushed labels, descriptions and tag chips to 4.33:1, and
   the `has(:disabled)` selector fired whenever a *stepper button* was disabled
   at a maximum value. Disabled is now expressed by surface, border and value
   colour; no field text is ever dimmed.
2. **Date-segment placeholders on `--fg-disabled`.** Segments are focusable
   spinbuttons, so they are not exempt: the placeholder colour is now
   `--fg-muted` (the same fix the Select placeholder needed in V0.3).
3. **A hand-written `id` on a plain `<Input>`** inside a `Field`, which left the
   generated `<label for>` pointing at nothing (axe: *label*, critical). The
   demo now lets `Field` own the id.
4. **Six hydration mismatches** on the new routes, from `Intl.formatRange`
   needing a different separator in Node than in Chromium, a live clock rendered
   during SSR, and ICU's `AM` separator. Fixed by formatting each range end
   separately, reading clocks in an effect (or not at all), and normalising
   literal segment text.

### Known gaps after V0.4

- No recorded screen-reader session yet (VoiceOver/NVDA); the automation is
  structural (axe, keyboard paths, focus assertions, hydrated-render checks).
- Mobile date selection uses the same popover, sized to the viewport. A
  Sheet-based picker on narrow screens was evaluated and left as a future
  improvement rather than a second behaviour.
- `MonthPicker`/`YearPicker` are LUC ARIA grids rather than React Aria
  components (React Aria has no month grid); they follow the APG grid pattern
  with roving focus but have not had a screen-reader session.
- File upload progress and retry are out of scope: the components select files
  and validate them, they never upload.
- Masked text input (phone, card numbers) is deferred; it is domain-specific and
  a naive implementation breaks the caret.

- Still no recorded screen-reader session (VoiceOver/NVDA). The automation is
  structural: axe, keyboard paths, focus assertions.
- Crosshair values remain pointer-only. The chart-to-table view is the honest
  workaround: it exposes the same prepared numbers in text, but it is opt-in and
  a product decides where the toggle lives.
- `DataTable` has no cell editing, no range selection and no keyboard cell
  navigation grid. That is a DataGrid, and it is deliberately out of scope.
- Multi-select Combobox (tag/chip entry) was evaluated and deferred; the
  single-select Combobox is the one that ships.
- Toast timing is not animated under reduced motion beyond the global clamp;
  the stack still appears, it simply does not travel.

## V0.5 — application shell and workspace

What the application layer adds, and what was checked.

- The sidebar's **scrolling region is the `nav` landmark** and it carries a
  name, so a screen-reader user can jump straight to it. There is exactly one.
- Collapsing to the rail keeps every label **in the DOM** as `sr-only` and
  reveals it with the existing tooltip: the accessible name never disappears.
- The mobile drawer is the existing `Sheet`, so focus trapping, focus restore,
  Escape and the scrim are the behaviour V0.3 already verified.
- A workspace separator keeps `role="separator"`, `aria-valuenow`, `aria-min`,
  `aria-max` and **arrow-key resizing**; LUC only styles it, reading the
  engine's own `data-separator` state.
- A pane body is **focusable**, because a scroll region that cannot be reached
  by keyboard is a defect. (axe flagged exactly this on `/application/workspace`
  during V0.5 QA; `tabIndex={0}` is the fix.)
- Escape has one owner per layer, and the flagship page demonstrates the guard:
  an open overlay keeps Escape, otherwise the pinned inspection clears.
- Share View is a button, not a gesture: keyboard-operable, and it confirms with
  a live-region toast.

Known limitations:

- The workspace is keyboard- and pointer-resizable, but the engine does not
  announce a separator's value as it changes; `aria-valuenow` is read on focus.
- Below 64rem the workspace stacks; there is no separate mobile interaction for
  resizing, on purpose.
- ~~A pinned inspection is pointer-initiated.~~ **Closed at V1.0** — see
  `ChartInspectionArea` below. The pointer gesture and the keyboard path share
  one pinned cursor, and `ChartDataTable` remains the complete semantic
  representation.

## V0.6 — provider content, and three accessibility fixes

### Fixed this round

| Defect | Cause | Fix |
| --- | --- | --- |
| Hydration mismatch on every page with a described chart (`/charts`, `/charts/radial`) | `useChartId` used a module-level counter, so the client produced different `id` / `aria-describedby` values than the server | `useId()` — stable across both renders |
| React key collisions in `OtpInput` slots | two empty slots in one group produced the same key | the slot index is part of the key |
| React warning: an input with both `value` and `defaultValue` | `input-otp` seeds from `defaultValue` and then spreads it onto the real `<input>` while setting `value` | LUC owns the initial value and keeps the underlying input controlled |

### Third-party boundaries

The TradingView integration contains DOM LUC does not own, and the automated axe
sweep excludes exactly that:

| Region | Owner | In the axe gate? | Why |
| --- | --- | --- | --- |
| The LUC widget box (`role="group"` + name, loading skeleton, error + retry) | LUC | **yes** | Our markup, our semantics. |
| `.tradingview-widget-container` (the provider's own wrapper) | TradingView | **no** | The iframe it creates is a separate document injected by the provider, and the copyright block's colours are set by the provider's embed script with `!important`. |

Measured, on the provider's own attribution block: `.blue-text` (`#2962FF`) on
Luc UI's dark raised surface (`#181B20`) is ~2.6:1, and `.trademark` (`#B2B5BE`) on
the light surface is ~4.0:1 — both below AA. The provider sets those colours with
`!important`, and they fail against TradingView's own dark background too, so this
is a provider-owned limitation rather than something LUC can fix without breaking
the rule against fighting an upstream stylesheet. It is recorded here instead of
being silently excluded: the exclusion is one selector, it is documented, and the
measured numbers are above.

What LUC *does* guarantee around provider content: a named `role="group"` box, a
`role="status"` skeleton while loading, a `role="alert"` error surface with a
keyboard-operable retry, and no overlay that could cover provider attribution.

Live provider QA (2026-09-27, production build): **122 axe scans, 0 violations,
58/58 behaviour checks, 0 console errors, 0 hydration mismatches** across 86
routes.

## V1.0 — four new primitives, a keyboard chart path, and the separator contract

### Keyboard chart inspection

`ChartInspectionArea` (`@luc/ui/charts`) closes the V0.5 gap. It wraps a plot in
a labelled `role="group"` region that is focusable and steps a cursor across the
**prepared** x values the consumer already owns:

| Key | Effect |
| --- | --- |
| ArrowLeft / ArrowDown | step one point back |
| ArrowRight / ArrowUp | step one point forward |
| Home / End | jump to the first or last point |
| Enter / Space | pin the current point, or clear the pin |
| Escape | clear the pin |

Every step publishes to the same sync bus the pointer uses, so both engines draw
the crosshair, and each step is announced through a visually hidden
`role="status"` line. Stepping clamps at the ends rather than wrapping. The
inspected region is not the accessible representation of the data — that is
`ChartDataTable`, which stays the documented fallback and is unaffected.

### The workspace separator contract

The resize handle is the engine's real separator, and the unit suite now asserts
the whole contract rather than one attribute: `role="separator"`,
`aria-orientation="vertical"` for side-by-side panes, `aria-valuenow`,
`aria-valuemin`, `aria-valuemax`, `aria-controls`, `tabindex="0"` and arrow-key
resizing. The visible rule is a hairline (`--workspace-handle-size`) inside an
11px hit area (`--workspace-handle-hit-size`), and focus paints the rule with
the accent rather than relying on a ring that a 1px element cannot show.

Every separator must be *named for what it resizes* — "Resize inspector",
"Resize chart and table" — not "Separator". The default is "Resize panes", and
the Showcase uses a specific label at each call site.

### The four new primitives

| Family | Semantics we own | Evidence |
| --- | --- | --- |
| `Slider`, `RangeSlider` | One `role="slider"` per thumb with `aria-valuemin/max/now`, arrow/Home/End/PageUp stepping, a required accessible name (a `Field` label is used automatically for a single thumb, and `label`/`thumbLabels` name a range's two thumbs), and a disabled state expressed with colour rather than dimming the whole control. | `slider.test.tsx` (10 cases) |
| `DropdownMenu`, `ContextMenu` | Radix owns roving focus, typeahead, submenu intent, Escape and focus restore. LUC owns the row rhythm, a destructive *tone* instead of a filled red row, and one shared surface for both triggers. | `menu.test.tsx` (9 cases incl. keyboard submenu and the context-click path) |
| `Alert`, `Callout` | **No live role is forced.** `live="off"` (the default) renders a plain container, `polite` renders `role="status"` and `assertive` renders `role="alert"`. A static page notice is never announced as an interruption. | `alert.test.tsx` (6 cases) |
| `EmptyState` | Static content with no invented live region, a controllable heading level (`titleAs`, default `p`), and actions in the normal tab order. | `empty-state.test.tsx` (4 cases) |

### Updated known gaps

- The TradingView iframe interior and the canvas interiors of the chart engines
  remain outside Luc UI's audit; both boundaries are documented above and in
  `TRADINGVIEW_GUIDE.md`.
- The workspace has no pointer-resize affordance below 64rem because the panes
  stack; that is a layout decision, not a missing keyboard path.
- `ChartInspectionArea` is an enhancement over prepared data. A chart that has
  not been given its x values renders as it did before — the table fallback is
  still the answer for a consumer who does not opt in.

### One current page in the navigation

The sidebar used to set `aria-current="page"` on any item whose href was a
prefix of the route, so `/components/alert` produced two "current page"
announcements ("Overview" and "Alerts") and two visually selected rows.

`isNavigationItemCurrent(pathname, href)` now makes the exact-match claim and is
exported from `@luc/ui/app-shell`. The section ancestor keeps a quiet accent
label — the map still shows where the reader is — but the selected surface, the
accent edge and `aria-current="page"` belong to one row. The Showcase QA asserts
exactly one `aria-current` inside the sidebar landmark on a detail route, and
two unit tests pin the prefix/exact distinction.
