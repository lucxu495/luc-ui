# LUC UI V1 — token audit and freeze

Everything here was measured against `packages/ui/src/tokens/tokens.css` at the
V1 freeze (566 lines before this round, 5 more after). Counts are declarations,
not unique values; a token appearing in both themes is counted once per block
because that is how it is maintained.

The token layer is the only place in LUC UI where a raw colour may appear, and
that rule is enforced by `luc/no-raw-color-literals` (see `SOURCE_POLICY.md`).

## 1. The layers

| Layer | Location | Declarations | Consumed by |
| --- | --- | --- | --- |
| Core | `@theme` (theme-independent) | 79 | Typography, radius, motion, density, layout, shell, workspace |
| Semantic — light | `:root` | 111 | Components and utilities |
| Semantic — dark | `.dark, [data-theme="dark"]` | 101 | Components and utilities |
| Density override | `[data-density="compact"]` | 7 | The eight control/density values only |
| Utility bridge | `@theme inline` | 72 | Tailwind utility names (`bg-surface-overlay`, `text-fg-muted`, `shadow-md`, …) |
| Charts | `:root` + `.dark` chart blocks | 26 + 25 | Engine adapters, resolved once per theme via `getComputedStyle` |
| Chart ink | one `:root` block, deliberately not themed | 2 | Contrast-aware labels printed on coloured marks |

The order matters and is documented at the top of `tokens.css`: core → semantic
→ utility bridge. A component may only read the semantic layer; the bridge
exists so Tailwind class names point at live variables and a runtime theme
switch costs nothing.

## 2. Naming convention

| Prefix | Meaning | Example |
| --- | --- | --- |
| `--surface-*` | Backgrounds, in luminance order | `--surface-canvas` → `--surface-overlay` |
| `--fg-*` | Text and icon ink | `--fg-primary`, `--fg-muted`, `--fg-disabled` |
| `--line-*` | Borders and separators | `--line-subtle`, `--line-accent` |
| `--accent-*` | The single brand hue and its states | `--accent-default`, `--accent-soft` |
| `--positive/negative/warning/info` (+ `-soft`, `-strong`, `-line`) | Semantic status | `--negative-line` |
| `--elevation-*` | Shadows | `--elevation-overlay` |
| `--glow-*` | Accent light effects | `--glow-focus` |
| `--motion-*`, `--ease-*` | Duration and easing | `--motion-fast`, `--ease-enter` |
| `--control-height-*`, `--density-*` | Control scale and density | `--control-height-md` |
| `--shell-*`, `--workspace-*` | Application geometry | `--shell-topbar-height` |
| `--chart-*` | Chart-only semantics | `--chart-series-1`, `--chart-ink-dark` |
| `--z-*` | Layer order | `--z-popover` |
| `--luc-*` | Non-design house constants | `--luc-token-version` |

Raw palette values exist only inside this file. The Tailwind bridge renames the
namespace (`--surface-*` → `--color-surface-*`) which is what lets a semantic
variable and a Tailwind theme key coexist without a self-referencing
`var(--x): var(--x)` cycle.

## 3. The elevation bridge — a real defect, found and fixed in this round

The semantic shadow values have always been declared as `--shadow-xs|sm|md|lg|overlay`.
Tailwind's own `--shadow-*` theme namespace uses the *same* names, so the theme
block could not alias them, and nothing did. The measured consequences in the
V0.6 build were:

* `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xs` compiled to **Tailwind's
  default grey shadows** (`0 1px 3px 0 #0000001a` …) instead of the LUC values.
  In the dark theme those LUC values carry an inset highlight and much deeper
  spread — the difference was not subtle in intent, only in size.
* `shadow-overlay` **was not a utility at all**. It was used by `Dialog`,
  `Sheet`, `Popover`, `Tooltip`, `Select`, `Combobox`, `Command`, `Calendar`,
  `DatePicker` and the chart tooltip, and every one of them rendered with no
  shadow. (`rg "\.shadow-overlay\{" built.css` returned nothing.)

Fix: the semantic layer was renamed to `--elevation-*` and the bridge now reads

```css
@theme inline {
  --shadow-sm: var(--elevation-sm);
  --shadow-overlay: var(--elevation-overlay);
  /* …xs, md, lg, inset-top, inset-top-none */
}
```

The four `var(--shadow-*)` call sites that used the variable directly
(`button-variants`, `card`, the glow page, `toast.css`) were moved to
`var(--elevation-*)` so there is one name per concept. This is a breaking change
for anyone who referenced the custom properties; it is recorded in
`MIGRATION_V1.md`.

## 4. Shell and workspace reconciliation

`--shell-*` (5) and `--workspace-*` (4) were the V0.6 open item. The review
found **no duplication with the spacing or density scales** — they are
application geometry, not control metrics:

| Token | Value | Relationship to the system |
| --- | --- | --- |
| `--shell-topbar-height` | 3.25rem (52px) | Not `--control-height-lg` (40px); a topbar is a landmark, not a control. |
| `--shell-sidebar-width` / `-rail-width` | 16rem / 3.5rem | Rail is 3.5rem so it aligns to a 4pt rhythm and fits a `md` IconButton plus padding. |
| `--shell-statusbar-height` | 1.75rem (28px) | Deliberately below `--control-height-sm`, because the status bar carries text, not controls. |
| `--shell-mobile-nav-width` | 19rem | One value, used by the mobile `Sheet` composition. |
| `--workspace-handle-size` | 1px | The visible hairline. |
| `--workspace-handle-hit-size` | 11px | The drag target — 11× the visible rule, which is the point of splitting them. |
| `--workspace-pane-min-size` | 12rem | Below this a pane is no longer a pane. |
| `--workspace-inspector-width` | 22rem | The inspector's default, not a maximum. |

Decisions:

1. **They stay where they are** — in the core `@theme` block, under labelled
   `Application shell` and `Workspace` headings — because they are
   theme-independent like radius and motion.
2. **They do not participate in the density switch.** Compact density changes
   control heights and paddings inside a panel; it must not silently resize the
   chrome a product and its users share. The one exception already documented is
   that a product may override a `--shell-*` value for its own layout.
3. **No `--app-*` alias is introduced.** A second name for the same value is how
   a system grows two truths.

## 5. Chart ink tokens

`--chart-ink-dark` and `--chart-ink-light` are declared **once**, in a dedicated
`:root` block after the chart section, and are intentionally *not* re-declared
in the dark theme.

They are contrast primitives, not text colours: a correlation cell that is
strongly green in the dark theme needs light ink, and the same palette slot in
the light theme needs dark ink, so `readableInk()` picks between two absolute
values based on the *cell's own* resolved colour and the measured WCAG ratio.
Promoting them into `--fg-*` would break that contract, because `--fg-*` is
theme-relative by definition. They are documented in `CHART_GUIDE.md` §6b.

## 6. Duplicates, overlaps and near-duplicates

| Pair | Verdict |
| --- | --- |
| `--elevation-overlay` vs `--chart-tooltip-shadow` | **Keep both.** The chart tooltip renders into a portal above a canvas and needs a shadow that reads on both themes without the page's overlay treatment; the chart layer is documented as its own axis in `CHART_GUIDE.md`. |
| `--glow-focus` vs `--focus-ring` | **Keep both.** `--focus-ring` is the colour (used by `outline: 2px solid`), `--glow-focus` is the soft ring used where an outline would be clipped (`luc-focus-inset`, inputs). |
| `--glow-subtle` and `--shadow-glow-subtle` | **Not duplicates.** The latter is the Tailwind bridge name; the former is the semantic value. Same pattern as surface/colour. |
| `--chart-positive/negative` vs `--positive/negative` | **Keep both.** The chart aliases exist so an engine adapter reads one namespace; they currently resolve to the same values, and that is intentional rather than accidental. |
| `--surface-selected` vs `--accent-soft` | **Keep both.** One is a surface (opaque by contract, §8a), the other is a wash for non-text chrome. |
| `--elevation-inset-top` / `-none` | **Keep, currently unused internally.** They are declared, bridged and documented; removing them in a freeze round would be a breaking change for no benefit. Flagged here so the next round can decide with data. |
| `--effect-*-strength` / `--effect-shimmer-tint` | **Keep.** They are the only knobs the creative surfaces expose to a product theme. |

No token was found with two names for the same decision after the elevation
rename. The remaining overlaps are deliberate axes, not accidents.

## 7. Raw-value audit

The `luc/no-raw-color-literals` rule reports on both class names and inline
style objects, and the sole documented exemption is Next's `themeColor`
metadata in `apps/showcase/app/layout.tsx`. At the freeze the rule reports zero
violations across `packages/ui` and `apps/showcase`.

What remains literal, and why it is legitimate:

* **Internal geometry**: `-inset-2` (a thumb's hit target), `w-[2px]` (an alert's
  semantic edge), `size-3.5`, `h-40` (a vertical slider's default track height).
  These are implementation constants inside one component, not design decisions
  shared across the system.
* **Keyframe percentages and transform maths**, which have no token vocabulary.
* **The `oklch()` values inside `tokens.css`**, which is the one file allowed to
  hold palette values.

Design decisions — colour, radius, shadow, duration, easing, z-index — are
tokens everywhere else, and the lint rule is what keeps that true.

## 8. Token version

`--luc-token-version: 1` in CSS and `LUC_UI_TOKEN_VERSION = 1` in TypeScript
(`src/tokens/version.ts`, exported from `@luc/ui`). The number changes only when
a token is added, renamed or removed in a way a consumer can observe. The
`--shadow-*` → `--elevation-*` rename above did not change the *version* number
because V1 is the first published schema; the rename is recorded in
`MIGRATION_V1.md` instead.

## 9. Frozen contract

1. Three layers, one direction: core → semantic → utility bridge.
2. Components read semantic tokens only.
3. Dark is the reference theme; light is designed, not inverted.
4. Application geometry (`--shell-*`, `--workspace-*`) is its own axis and is
   not density-scaled.
5. Chart tokens are a separate axis with their own adapter contract; the ink
   pair is deliberately theme-independent.
6. A new decision gets a new token, never a literal.
