# Luc UI — design system

The rules. If something is not here, it is not part of the system yet.
Every rule is written so it can be checked in code review or in a screenshot.

**Character**: precise, calm, elegant, intelligent, technical, modern, refined,
confident, subtle, alive.
**Not**: loud, gimmicky, cheap, random, over-animated, neon, cartoonish,
template-like.

Central principle: **quiet at rest, alive on interaction.** Roughly 80%
restraint, 20% delight — and the delight is never all at once.

## 1. Layers

```
core values      (tokens.css @theme)        radius, motion, type, density, z-index
semantic tokens  (tokens.css :root/.dark)   surface, fg, line, accent, status, shadow, glow
utilities        (@theme inline)            bg-surface-default, text-fg-muted, rounded-md …
product theme    (future)                   overrides a handful of semantic tokens
```

Components read the semantic layer. A component that needs a raw value needs a
new token, not a new colour.

## 2. Surfaces

Six levels, in order. Depth is a luminance step plus a hairline — not a large
shadow.

| Token | Utility | Use for |
| --- | --- | --- |
| `surface.canvas` | `bg-surface-canvas` | Page background. One per view. |
| `surface.sunken` | `bg-surface-sunken` | Inputs, code, inset wells, segmented tracks. |
| `surface.default` | `bg-surface-default` | Cards and panels on the canvas. |
| `surface.raised` | `bg-surface-raised` | Stat cards, popovers, active segments. |
| `surface.overlay` | `bg-surface-overlay` | Dialogs, tooltips, floating menus. |
| `surface.interactive` | `bg-surface-interactive` | Buttons, hoverable rows. |

Rules:

1. Never nest more than three levels (canvas → card → well).
2. Interactive hover moves **one** level and **one** border step.
3. A selected surface must be **opaque** (`surface-selected`). Translucent
   surfaces let effect layers bleed through them.

## 3. Text

| Token | Utility | Use for |
| --- | --- | --- |
| `text.primary` | `text-fg-primary` | Titles, values, active labels. |
| `text.secondary` | `text-fg-secondary` | Body copy, descriptions. |
| `text.muted` | `text-fg-muted` | Meta, captions, table headers. |
| `text.disabled` | `text-fg-disabled` | Disabled controls and placeholders **only**. |
| `text.accent` | `text-fg-accent` | Links and active emphasis. |

1. `text-fg-disabled` on readable content is a bug, not a style choice. It is
   below 4.5:1 by design and is exempt from the contrast rule only because it is
   part of an inactive control.
2. Anything at 12–13px must clear 4.5:1 against its surface.
3. Numbers always use `luc-numeric` / `NumericText` (tabular figures).

## 4. Accent and status

One accent. It marks **selection, focus and action** — nothing else.

| Token | Use for |
| --- | --- |
| `accent.default` | Primary action fill, active indicator. |
| `accent.hover` / `accent.active` | One step brighter / darker. |
| `accent.soft` | Tinted backgrounds at low alpha. |
| `accent.on-accent` | Text and icons **on** an accent fill. |

Status colours (`positive`, `negative`, `warning`, `info`) always ship with a
label, a glyph, or both. Colour alone never carries meaning.

### 4a. Brand palettes and type roles (Phase 2)

The accent is the *brand*; the status set is *meaning*. Phase 2 makes that split
explicit and turns the brand half into a first-class, switchable layer.

- **Seven palettes** ship in `tokens.css`: `cyan` (default), `violet`, `cobalt`,
  `emerald`, `rose`, `ember`, `graphite`. They are selected with
  `data-palette="…"` on `<html>` — or on any subtree.
- A palette changes exactly ten accent tokens per mode plus everything derived
  from them (`surface.selected`, `line.accent`, `glow.*`, `calendar.*`,
  `chart.marker` / `chart.selection` / `chart.band`). It cannot change the
  surface stack, the text levels, radius, spacing, density, motion or status
  colours — the derived block in `tokens.css` is the only place those mixes are
  recomputed, so a new palette cannot smuggle in a geometry change.
- Every palette is generated from one recipe: the cyan ramp's lightness
  trajectory with a different hue and chroma. That is what keeps seven palettes
  coherent instead of seven unrelated looks.
- Accent hues stay clear of the status hues (26 / 66 / 156 / 252). `ember` (48)
  is the closest pair at ~18° from `warning`; use it where a warning semantic
  does not share the view.
- `graphite` is the monochrome option: a near-black accent in light mode, a
  near-white accent in dark. It is proof that the token layer, not a colour,
  carries the hierarchy.
- Contrast is a **gate, not a hope**: `palette-tokens.test.ts` parses the token
  file and computes WCAG ratios for `accent.on-accent` on `accent.default` and
  `text.accent` on `surface.default` in both modes, and the browser QA sweep
  re-measures the rendered page with axe.

Type is organised the same way — by **role**, never by family:

| Role | Token | Used by |
| --- | --- | --- |
| Interface / body | `--font-sans` | Body copy, labels, controls |
| Display | `--font-display` | Headings, hero numbers |
| Data | `--font-mono` | Code, identifiers, numeric contexts |

`data-typeface` selects a preset that re-points the roles together:
`editorial` (platform serif, plus the extra leading a serif needs), `technical`
(monospaced display), `humanist` (no webfont at all). LUC bundles Inter / Inter
Tight / JetBrains Mono and nothing else; a consumer with licensed brand fonts
points the three variables at their own stack and never edits a component.

`data-palette`, `data-typeface`, `data-density` and `data-motion` are one
mechanism with four names. There is no second theming API.

### 4b. Visual personality (Phase 2.1)

A palette changes hue and a type voice changes the letterforms. Neither can
change how a product *feels* to use, because both leave the material alone.
`data-personality` moves the material — four token groups at once, on `<html>` or
on any subtree:

| Preset | Geometry (radius) | Density (controls / rows) | Proportions | Physics |
| --- | --- | --- | --- | --- |
| `instrument` (default) | 4-22px | 28/34/40px | current | current durations and curve |
| `editorial` | 6-40px | 32/38/44px | looser leading, relaxed tracking | slower (180-540ms), gentle curve |
| `dense` | 3-14px | 24/28/34px | tight leading and tracking | fast (50-300ms) |
| `expressive` | 8-44px | 32/40/48px | heavier display weights | 60-420ms, fast-out curve, bouncier overshoot, stronger glow |

Rules that keep it composable rather than a fifth style system:

1. It only moves tokens that **already exist** — no preset introduces a second
   radius scale or a private shadow.
2. Theme-dependent values use the same four-selector form as the palettes, so a
   personality never flattens light/dark.
3. Behaviour is untouched: focus rings, keyboard handling, semantics and
   contrast are identical in all four. A personality is a surface property.
4. Ship **one** personality per product. The subtree form exists for comparison
   pages and for genuinely different surfaces (a marketing hero inside an
   application shell), not for mixing four looks in one screen.

### 4c. Signature motion (Phase 2.1)

The motion layer gained five primitives, all driven by the resolved intensity
profile and all collapsing to a static rendering under reduced motion:
`PressRipple` (press ink at the pointer), `AuroraSurface` (palette-derived
atmosphere), `BeamFlow` (a packet crossing a path), `MagnifyDock` (pointer
proximity magnification) and `Marquee` (a seamless stream). They follow the
rules in section 8: compositor-only properties, one gesture per surface, nothing
decorative over content that must be read, and `aria-hidden` on every effect
layer.

The same rule that governs the rest of the system applies to them: a product
scopes loudness with `MotionIntensityProvider` (`none` / `functional` /
`expressive` / `showcase`) rather than passing booleans down. Reduced motion
wins over every level.

## 5. Elevation and glow

1. Shadows: `shadow-xs`, `sm`, `md`, `lg`, `overlay`.
   The utilities are bridged to the semantic `--elevation-*` values
   (`--shadow-sm: var(--elevation-sm)`). The two names exist because Tailwind
   owns the `--shadow-*` namespace and a variable cannot reference itself —
   before V1.0 nothing bridged them, so `shadow-overlay` was not a utility at
   all and every overlay rendered with no shadow. See `V1_TOKEN_AUDIT.md` §3.
2. Dark-mode shadows include an inset top highlight; without it a surface reads
   as a hole.
3. Glow has four levels: `none` (default), `subtle` (hover or selected),
   `focus` (keyboard), `accent` (one featured surface per view).
4. Passive surfaces have **no** glow. Ever.
5. Glow is drawn on a masked 1px ring, not as a radial blob inside the surface.

### Chart colour

Charts cannot read utilities — they paint into a canvas — so they get their own
semantic layer in `tokens.css`. Same rule: components read tokens, never values.

1. `chart.series.1 … 12` is the categorical palette. It is tuned per theme and
   normalised to `rgb()`/`rgba()` before it reaches an engine.
2. `chart.positive / negative / warning / neutral` carry direction. A categorical
   series must never be used to mean "up".
3. `chart.grid`, `chart.axis-line`, `chart.crosshair`, `chart.band`,
   `chart.reference`, `chart.marker` style everything the engine draws.
4. Grid lines are `line-subtle`-weight. Major grid only; there are no minor grid
   lines anywhere in the system.
5. A chart tooltip is `ChartTooltipSurface`: overlay surface, hairline border,
   `shadow.overlay`, tabular figures. Never an engine default.
6. **Text on a coloured mark picks its ink by contrast.** `chart.ink-dark` and
   `chart.ink-light` are *absolute* tokens (declared once, deliberately not
   re-declared in `.dark`) because the choice depends on the mark's own resolved
   colour, not on the page theme: a bright green cell needs dark ink in the dark
   theme and light ink in the light theme. `readableInk()` composites the mark
   over its surface and picks the better of the two. A fixed `text-primary` ink
   fails at one end of a diverging ramp — measured 3.0:1.
7. **A mark is visible at rest.** Hover may emphasise; it must never reveal. The
   box plot's body, median, whiskers and caps are drawn from first paint.

## 6. Radius

| Token | Value | Use for |
| --- | --- | --- |
| `radius.xs` | 4px | Inline code, tiny chips. |
| `radius.sm` | 6px | Small controls, tags, kbd. |
| `radius.md` | 8px | Default control radius. |
| `radius.lg` | 12px | Cards and panels. |
| `radius.xl` | 16px | Dialogs and hero surfaces. |
| `radius.2xl` | 22px | Special showcase surfaces only. |
| `radius.full` | — | Dots, avatars, switch track. |

Do not default to pills for buttons; they read consumer, not analytical.

## 7. Spacing and density

1. The scale is 4pt: 4, 6, 8, 12, 16, 20, 24, 32, 40, 48.
2. Use tailwind's numeric utilities (`p-3`, `gap-2`) — they map 1:1.
3. Control heights come from `--control-height-*`; tables use `--density-row`.
4. Dense views opt in with `data-density="compact"` on a subtree. Never shrink
   type to make something fit.

## 8. Motion

| Token | Value | Use for |
| --- | --- | --- |
| `motion.instant` | 70ms | Pressed feedback, hover tint. |
| `motion.fast` | 140ms | Default for colour, border, opacity. |
| `motion.normal` | 200ms | Functional movement: tabs, popovers, tooltips. |
| `motion.slow` | 300ms | Surfaces entering: menus, dialogs, reveals. |
| `motion.slower` | 460ms | Rare: page-level reveal, chart entrance. |

Easing: `standard` (`0.2, 0, 0, 1`), `enter` (`0.16, 1, 0.3, 1`),
`exit` (`0.4, 0, 1, 1`), `emphasized` (indicators), `overshoot` (state delight
only — checkbox tick, radio dot).

1. Animate colour, transform and opacity. Avoid animating layout properties.
2. Exits are shorter than entrances.
3. Use the `luc-transition` utility so timing has one definition.
4. No spring overshoot on professional surfaces.

### 8.1 V1.1 — springs, distances and the research motion contract

V1.0 named durations and eases. V1.1 adds the two halves that were missing:
**interaction springs** (for things the user is touching) and **travel
distances** (so nothing invents `translateY(23px)`).

| Token | Value | Use for |
| --- | --- | --- |
| `spring.soft` | stiffness 140 / damping 20 | A large surface settling: sheet, sidebar, fullscreen panel. |
| `spring.responsive` | stiffness 320 / damping 30 | The default: a highlight, a thumb, a card that answers. |
| `spring.snappy` | stiffness 520 / damping 34 | A small, immediate acknowledgement. |
| `motion.distance.xs` | 4px | Chip/highlight travel, a swap. |
| `motion.distance.sm` | 8px | Card and grid entry. |
| `motion.distance.md` | 14px | A panel appearing in flow. |

Both halves are mirrored in `src/motion/tokens.ts` (`duration`, `easing`,
`spring`, `distance`, `transitionCss`, `chartMotion`), and the CSS custom
properties live in `tokens.css`. A component uses one or the other; it never
hardcodes a curve.

**Springs are for interaction; durations are for data.** A spring overshoot on a
number implies a precision the number does not have, which is why the chart
animation budget (§8.2) is duration-based.

### 8.2 Chart animation budget

`useChartMotion(theme, preset?, pointCount?)` resolves a `ChartAnimationPreset`
(`none` / `subtle` / `standard` / `emphasized`) into an intro/update budget:

- reduced motion → `0` for everything, immediately (never "faster");
- `none` → `0`;
- a series above `CHART_ANIMATION_POINT_LIMIT` (4000 marks) is **drawn, not
  animated**, and never morphs via universal transition;
- an update is always shorter than the entrance, because the reader is waiting.

### 8.3 The V1.1 rest/interaction principle, restated

```
REST         calm surfaces · restrained chrome · no constant motion
INTERACTION  vivid data emphasis · responsive motion · state continuity
             rich hover/focus · animated meaningful transitions
```

Motion is never a loop. The only infinite animations in the system are
functional indicators (shimmer, spinner, indeterminate progress), and they opt
in through `data-motion-essential` so the reduced-motion clamp can keep them
meaningful.

### 8.4 V1.2 — the design statement

V1.1 was deliberately conservative. V1.2 keeps every token, primitive and
reduced-motion guarantee, and raises the ceiling on purpose:

```
QUIET AT REST              ← data remains readable; chrome stays calm
ALIVE ON INTERACTION       ← responsive physical feedback; depth; continuity
MEMORABLE AT THE MOMENT    ← occasional premium surprise, deliberately rare
```

Three rules keep the louder system coherent:

1. **Intensity is a profile, not a literal.** `MotionIntensityProvider` resolves
   one of `none | functional | expressive | showcase` to a concrete
   `{ pointer, ambient, travel, glow, depth, stagger }`. Reduced motion always
   resolves to `none`. Components read the profile; they never invent a value.
2. **Loops must mean something.** Ambient motion is allowed again — a border
   trail, a pointer-reactive research grid, a current-point ripple, a
   signal-active pulse — but one loud element per view, never on data truth, and
   always CSS where possible so it costs nothing off-screen.
3. **The memorable tier is scarce.** `showcase` exists for the Home hero, a
   flagship visualisation, a morphing panel, a decode status. A page made of
   showcase-tier interactions is a page nobody can read.

The full contract lives in [`docs/MOTION_GUIDE.md`](./docs/MOTION_GUIDE.md) and
[`docs/INTERACTION_MATRIX.md`](./docs/INTERACTION_MATRIX.md).

### 8.5 V1.3 — the chart axis rule

One rule a reader can point at, because the alternative is a chart that looks
arbitrary:

```
SINGLE Y AXIS → RIGHT      ← price, %, ratio, on-chain, macro: one visual edge
SECOND AXIS → LEFT         ← only for a genuinely different unit, on purpose
```

Corollaries: a logarithmic axis is a *presentation* choice over the same real
values and is only offered when the data is strictly positive; the padded edge of
a domain is headroom, and headroom is never labelled; stacked charts share one
plot rectangle. The full contract — including the domain padding rules and the
anti-patterns — is in [`docs/CHART_GUIDE.md`](./docs/CHART_GUIDE.md) §20 and
[ADR-027](../.context/docs/decisions/ADR-027-chart-axis-scale-and-domain.md).

### 8.6 V3.0 — space, material and continuity

The spatial generation adds depth as a **coordinate system**, and it is governed
by four rules rather than a component list:

1. **Depth is decoration's business.** A `ParallaxScene` publishes one pointer
   offset; layers take as much of it as their role deserves. The layer carrying
   text sits at `depth={0}`, and a scene that only works while the pointer moves
   is a broken scene.
2. **Material is derived.** `--glass-surface` is a thinned `--surface-overlay`,
   never a literal white blur, so a palette or a personality re-tints it and
   light/dark stay independently designed. The strong variant is used wherever
   text sits on glass, and glass is never stacked on glass — overlapping
   translucent surfaces show each other's text.
3. **Continuity beats choreography.** A surface that becomes more should grow out
   of itself (`ExpandableSurface`, one shared layout identity, in flow) rather
   than be replaced by a modal; the trigger stays mounted because it is where
   focus returns.
4. **A moving control is a defect.** Rings rest on hover and `focus-within` and
   their labels rest with them; nothing that must be pressed is allowed to
   travel.

The measurable contract is in
[`docs/MOTION_GUIDE.md`](./docs/MOTION_GUIDE.md) §"V3.0 — spatial motion",
including one measured fact: pointer movement writes the scene's custom
properties and **zero** style writes anywhere else in the document.

### 8.7 V4.0 — one spatial language for the *whole* library

V3.0 added spatial effects in one gallery. V4.0 makes the grammar universal, and
the rule is short: **a surface names its layer, it never picks a shadow.**

1. **One depth scale.** `--spatial-depth` is the only scale; a personality sets
   the resting distance unit (`--spatial-lift-unit` / `--spatial-sink-unit`:
   instrument 2px, editorial 3px, dense 1px, expressive 4px) and
   `data-space="flat|layered|deep"` overrides the scale for a subtree
   (`0` / `1` / `1.6`). Travel is `calc(unit × depth)`, `transform`-only, so a
   `flat` subtree keeps every state and loses only the movement.
2. **Four rungs plus a well.** `--elevation-rest`, `-hover`, `-active`,
   `-float` are the ladder; `--layer-2-shadow` / `--layer-3-shadow` are the two
   stacked steps (a floating menu, then a modal); `--well-shadow` is the sunken
   surface. `shadow-sm` and `shadow-md` are no longer written by hand anywhere in
   `src/components`, `src/table`, `src/data`, `src/workspace`,
   `src/app-shell` or `src/datetime`.
3. **A field is a well, a button is a surface.** Text fields, Select triggers,
   Combobox shells, InputGroup, progress tracks, SegmentedControl and Tabs
   tracks, and a pressed Toggle take `--well-shadow`; everything clickable takes
   a rung. That single distinction is what stops a form row from reading as a
   row of buttons.
4. **A row moves least.** A DataTable row takes the surface step plus the next
   rung and no travel. A row that moved would break column alignment for the
   whole row, which is worse than any amount of depth.
5. **Overlays are one material.** Dialog, Sheet, Command, Popover, Tooltip,
   Menus, Select/Combobox content and the Slider tooltip all now use the shared
   float rungs rather than a per-component shadow, so two overlays from different
   families can never disagree about how far above the page they are.
6. **Reduced motion keeps the end state.** The clamp in `base.css` collapses the
   travel; `luc-lift` is gated behind `prefers-reduced-motion: no-preference` so
   there is no lift at all. Nothing is hidden or dimmed to compensate — contrast,
   focus visibility and layout are identical.

Public surface: the utilities `luc-rest`, `luc-hover`, `luc-float`,
`luc-float-high`, `luc-well`, `luc-settle`; the tokens above; and the
`data-space` attribute. The Showcase page is `/foundations/spatial`, which shows
the pre-V4 recipe beside the current one and gives `data-space` a live switch.

### 8.8 V7.0 — layer C is the same grammar, one level up

`@luc/ui/experiences` (added in Phase 8) publishes the assemblies a *page* is
made of: `ProfileHero`, `SocialLinks`, `ExperienceTimeline`, `ProjectShowcase`,
`PublicationList`, `ReadingShelf`, `NowSection`. They are not a second design
language and they do not get their own tokens:

1. **A composite names a layer, exactly like an atom.** Every one of the seven
   styles itself with the same utilities — `luc-rest`, `luc-hover`, `luc-float`,
   `luc-well`, `luc-focus` — so `data-palette`, `data-typeface`,
   `data-personality` and `data-space` on any ancestor restyle a whole product
   page with no per-composite work. The reference experiences at `/experiences`
   are the proof: each one pins a different palette/personality/depth pair and
   none of them writes a shadow, a radius or a colour by hand.
2. **Depth still means something.** A portfolio hero is `deep` and uses a real
   `ParallaxScene`; a console table is `flat` and takes the surface rung and no
   travel. The rule from §8.7.4 — a row moves least — is why the SAAS and quant
   experiences pin `flat`, and it is a design decision, not a demonstration of
   an attribute.
3. **The hierarchy is the composite's job.** `ProfileHero` owns the `h1`;
   `ExperienceTimeline` is an `<ol>`; `PublicationList` is an `<ol>` with facets
   derived from its own entries. Where a composite owns structure, it owns the
   accessibility of that structure too — that is the reason it is published
   rather than left as a recipe.
4. **Layer C never imports layer A.** No composite reaches a chart engine, a
   date system or a provider, and the consumer test asserts it.

The published/recipe boundary — and the reason a pricing table is not a
component — is in [`docs/EXPERIENCE_GUIDE.md`](./docs/EXPERIENCE_GUIDE.md).

## 8a. Overlay opacity (the rule the chart tooltip bug created)

An **information surface must be readable on its own**. Tooltips, menus,
combobox lists, command palettes, toasts and sheets render content the user has
to read while the thing underneath is still moving and busy.

1. Foreground content surfaces are **opaque**. Use `surface-overlay`, or the
   dedicated `--chart-tooltip-surface` for chart tooltips.
2. Translucency is allowed only on **decorative** shells — scrims, hairline
   highlights, glow layers — never on the surface that carries text.
3. A backdrop blur is an enhancement, never the readability mechanism. If the
   panel is unreadable with the blur switched off, it is broken. (The chart
   tooltip shipped that bug: `backdrop-filter: blur(10px)` on a 96% background,
   plus a stylesheet reset that zeroed the panel background entirely, so grid
   lines showed through the numbers.)
4. Pinned/sticky table cells follow the same rule: a sticky cell must paint an
   opaque background, including its hover and selected states, because the row
   background cannot paint underneath it.

## 8b. Layer order

One vocabulary, no ad-hoc `z-index` values in components.

| Token | Value | Layer |
| --- | ---: | --- |
| `z.base` … `z.raised` | 0 / 10 | Page content, sticky cells inside a table |
| `z.sticky` | 20 | Sticky headers, page header |
| `z.overlay` | 40 | Scrims behind a modal or sheet |
| `z.modal` | 50 | Dialog, Sheet, CommandMenu |
| `z.popover` | 60 | Select, Combobox, Popover, facet menus |
| `z.toast` | 70 | Toasts |
| `z.tooltip` | 80 | Tooltips |

A popover sits above a modal on purpose: a Select inside a Sheet must open
above the panel it lives in. Anything inside a scrolling container (a table's
sticky header, a chart's tooltip) declares a local stacking context with
`isolation: isolate` so its large internal indices cannot escape.

## 9. Component anatomy contract

Every component defines, in this order:

1. **Anatomy** — which slots exist and who owns the ids and ARIA wiring.
2. **Variants** — the smallest set that covers real cases (Button has five).
3. **States** — default, hover, focus-visible, active, disabled, and where
   relevant loading, selected, invalid.
4. **Keyboard** — every reachable action has a key path.
5. **Motion** — the tokens used, and the reduced-motion answer.

## 9a. Data display

Tables and charts are the busiest surfaces in the system, so they get their own
rules. The first principle is the same one the charts follow: **format, never
compute**. A column or a series renders what the caller prepared.

### Tables

1. **One row rhythm.** `density="comfortable"` is 40px, `compact` is 32px.
   A table never sets its own row height.
2. **Hairlines, not cells.** A 1px separator under each row, a 1px header
   border, and column borders only on request (`showColumnBorders`).
3. **Numbers align right and never jitter.** `numericColumn` and friends apply
   tabular figures; `text-fg-disabled` is never used for a value.
4. **Headers stay quiet.** Micro caps, `text-fg-muted`, one sort affordance.
   A column that cannot sort renders plain text — no fake clickable header.
5. **Hover moves one step** (`surface-interactive-hover`); selection is the
   opaque `surface-selected`. Both must be mirrored on pinned cells.
6. **Sticky and pinned surfaces are opaque**, including hover and selected
   states, because the row background cannot paint underneath them.
7. **States are first class.** Loading keeps the column structure with skeleton
   cells; empty and error are messages inside the table, not a spinner over it.
8. **DataTable is a table.** `table/thead/tbody/tr/th/td`, keyboard-reachable
   controls, `aria-sort` on sortable headers. Editing, fill handles, range copy
   and canvas cells belong to a future DataGrid.
9. **Virtualise only the body** and only when the row count justifies it. Keep
   real `<tr>` elements and spacer rows; never `display: block` rows.
10. **The table never fetches.** Rows and state in, events out.

### Selection semantics

| Control | The question it answers | Never |
| --- | --- | --- |
| `Select` | "Which one of these few?" | Search, navigation, or a long list |
| `Combobox` | "Search, then which one?" | Executing an action |
| `CommandMenu` | "Run which thing?" | Choosing a field value |
| `FacetFilter` | "Which of these many values?" | Single-choice semantics |
| `Popover` | "Show me a small surface" | Holding a form |

### Chart to table

A canvas chart cannot describe itself, so the chart and its numbers are paired:
**view data table** exposes the same prepared rows in a semantic table. It is
opt-in, it respects the chart's own series visibility, and it is documented as
an improvement rather than a fix — see `docs/ACCESSIBILITY.md`.

## 9b. Forms

Forms are where a design system earns its keep: the states are many, the rules
are the same every time, and almost nobody wants to re-decide them. See
`docs/FORM_GUIDE.md` for the full contract.

### Field anatomy

One control, one label, one message slot. `Field` owns the ids; a control never
invents one.

```
label / legend          text-label, text-fg-secondary, required marked with one
                        accent asterisk (never the negative colour)
control                 the control's own chrome
message                 exactly one of: error | validating | success | description
```

1. **One message renders at a time**, in that order. A field never stacks four
   lines of explanation.
2. **Descriptions are readable.** `text-fg-muted`, never `text-fg-disabled`.
3. **Validating is quiet**: a 14px arc and one line, `aria-busy` on the control.
4. **Success is rare.** Only for a value that was actually checked — an
   availability probe, a verified handle. A completed field does not turn green.
5. **Required is a state, not an error.** The asterisk is accent; the `required`
   attribute carries the meaning for assistive tech; optional fields are simply
   unmarked.
6. **Disabled never dims text.** `opacity` on a field composites the label, the
   message and any chip or segment below 4.5:1 — and it fires whenever *any*
   descendant (a stepper at its max) is disabled. Disable the control's surface
   and value instead.
7. **Numbers are canonical.** A number input reports a plain number; formatting
   is presentation. A percentage input must state its `scale`; a step is opt-in,
   because setting a step also *snaps* typed input onto it.

### Submit lifecycle

```
idle ──▶ submitting ──▶ success
                └──▶ error
```

`Form` owns it; `SubmitButton` reads it; `FormActions` positions the row (a
sticky row is opaque). A failed submit produces a `FormErrorSummary` whose rows
link back to the offending fields. Toasts confirm; they never report failures on
their own.

## 9c. Date and time

Four kinds of value, four types, no implicit conversion. The full rules are in
`docs/DATE_TIME_GUIDE.md`; the parts that change how components are built:

1. **Date-only values are `CalendarDate`.** Not `Date`, never `new
   Date("YYYY-MM-DD")`. A date-only formatter anchors at UTC noon so the day
   cannot move.
2. **A range is a pair of dates**, inclusive at both ends, never nudged to
   `23:59:59`.
3. **A calendar is a surface, not a scatter of pills.** Today is a 1px ring;
   selection is filled; a range is a continuous band with squared-off middle
   days and rounded ends; unavailable days are struck through and stay readable.
4. **Month and year are reachable in one step.** Clicking the header opens
   month and decade grids — the same `MonthPicker`/`YearPicker` components a
   product can use on their own.
5. **Locale decides the grid.** Segment order, weekday names, first day of week,
   clock and numerals all come from the locale; pass it explicitly in a
   server-rendered app.
6. **Presets are data.** `{ id, label, range }`, where `range` may be a factory
   that receives today. The active preset is derived from the value, never a
   second source of truth.
7. **`Intl.formatRange` is not portable.** Node and the browser disagree about
   its separator; the LUC range helpers build their string from two formats.

### Calendar tokens

The only component-specific semantic set in the system, because a date grid has
states no generic surface expresses:

| Token | Use for |
| --- | --- |
| `calendar.range` | The middle of a selected range. Opaque: it is mixed onto the overlay surface so the day number has one known background. |
| `calendar.range-edge` | The first and last day of a range. |
| `calendar.today-ring` | The inset ring on today. Never a fill — today must survive being selected. |
| `calendar.unavailable` | An unavailable day. Readable, because it is still focusable. |

## 9d. The application shell

The shell is a component, not a page convention. Full contract in
`docs/APP_SHELL_GUIDE.md`.

1. **Geometry is tokenised.** `--shell-topbar-height`, `--shell-sidebar-width`,
   `--shell-sidebar-rail-width`, `--shell-statusbar-height`. A page never writes
   a sidebar width.
2. **One named landmark per region.** The sidebar's scrolling region *is* the
   `nav`; the topbar is the `header`; the content is the `main`.
3. **The topbar is opaque.** A translucent bar carrying text is §8a's bug with
   a different component name.
4. **The rail keeps the label in the DOM** (`sr-only`) and reveals it with the
   existing tooltip. Removing it removes the accessible name.
5. **Nested navigation is one level.** A parent in rail mode expands the rail
   before it opens the tree; a deeper tree wants search.
6. **Collapsed state is personal**, so it persists locally and never enters the
   URL. The mobile drawer is the existing `Sheet`, not a second drawer.

## 9e. The workspace

Full contract in `docs/WORKSPACE_GUIDE.md`.

1. **A workspace is not a dashboard.** Panes exist because the code says so;
   nothing floats, docks or drags.
2. **The handle is a separator.** It keeps the engine's `role`, `aria-valuenow`
   and arrow-key resizing, and reads the engine's own
   `data-separator="inactive|active|focus"` for its visual state.
3. **A pane body is focusable**, because a scroll region that cannot be reached
   by keyboard is a defect.
4. **Sizes are versioned, validated and keyed by pane set.** An incompatible
   stored layout is discarded, never migrated.
5. **Below 64rem panes stack** and the handles disappear. The inspector becomes
   a `Sheet` or a switch, not a 200px column.
6. **Escape has one owner per layer** — overlay, then workspace focus, then the
   pinned inspection. A library component does not decide this; the page does.

## 9f. Shareable state

Full contract in `docs/URL_STATE_GUIDE.md`.

1. **Three kinds of state, three homes.** Shareable to the URL, personal to
   local storage, ephemeral nowhere.
2. **Defaults are omitted**, so a link to the default view stays short.
3. **Invalid input is not an error.** A codec returns `undefined` and the
   default is restored; a URL is user input.
4. **Deterministic serialization.** Declaration order, no JSON blobs, and
   unrelated parameters survive an update.
5. **History is a decision**: `push` for a meaningful navigation, `replace` for
   a scrub.
6. **Dates stay dates.** `YYYY-MM-DD` in the URL, `CalendarDate` in state, never
   a JavaScript `Date`.

## 9g. Package boundaries

Full contract in `docs/PACKAGING_GUIDE.md`.

1. **The package is compiled**: ESM, declarations, curated subpaths, one public
   stylesheet, `"use client"` preserved.
2. **A subpath import stays a subpath import.** A Button import must not pull a
   chart engine or the date system, and a test asserts it.
3. **Consumers import `@luc/ui/...`**, never `src/` or `dist/`.
4. **Consumers change layout, not looks.** Width, margin and placement are
   theirs; colour, radius, shadow, padding and motion belong to the component.

## 9h. Provider content (TradingView)

Full contract in `docs/TRADINGVIEW_GUIDE.md`; provider policy audit in
`docs/research/v0.6-tradingview-policy-audit.md`.

1. **The provider is named.** TradingView widgets are provider data, presented in
   Luc UI's layout. LUC never claims the data, and never hides or covers provider
   attribution. Nothing is placed over a widget box.
2. **Two depths, kept apart.** Web Components are themed through the provider's
   published custom properties and a `theme` attribute. iframe widgets take only
   the provider's own configuration keys. The difference is documented and
   visible rather than papered over.
3. **Only symbol links are redirected**, through the provider's `symbol-url`
   template or its `tv-link-open` event. Data-source, logo and legal links always
   point at TradingView.
4. **No scraping, ever.** A widget is a display integration, not a data API.
5. **A heatmap keeps its red/green.** In a financial heatmap the colour *is* the
   data; LUC themes the surrounding chrome and leaves the semantics alone.
6. **Nothing loads until a wrapper renders**, and then only within 200px of the
   viewport. A product that never imports `@luc/ui/tradingview` never contacts a
   provider host.
7. **Failure is a state.** Unreachable provider → a LUC error surface with a
   retry, never invented market data, and never a broken page.

## 9i. Final primitives — sliders, menus, messages

1. **A slider is a groove, not a knob.** The visible thumb is small
   (`size-3`–`size-4` by size) and the hit target is far larger (`before:-inset-2`).
   The track is quiet at rest; only the filled range carries the accent. A
   disabled slider changes *colour*, never the whole control's opacity, and the
   value bubble is a quiet overlay that appears on hover, focus and drag — not a
   permanent label standing in for the field's name.
2. **The value is the consumer's.** `Slider` takes and returns a number;
   `RangeSlider` takes and returns a sorted inclusive pair. Nothing rescales a
   unit, and `formatValue` is display-only.
3. **One menu language, two triggers.** `DropdownMenu` and `ContextMenu` share
   the surface, the row rhythm, the indicators and the shortcut slot. A menu
   surface is opaque (`surface-overlay`) with the overlay shadow — a translucent
   menu over chart noise is a bug, not a style.
4. **Density over decoration.** Rows are `py-1.5` at `text-label`, not 48px.
   Group with labels and separators once there are more than about five items.
5. **Destructive is a tone, not a fill.** A destructive row is a negative
   *label* with a negative wash on hover. Filling the row red implies the action
   has already happened.
6. **Menus run actions; they are not form fields.** A value a form owns belongs
   to `Select` or `Combobox`. `CommandMenu` is global navigation and search.
   The four are documented together on `/components/menus`.
7. **A message is a surface with a semantic edge.** `Alert` and `Callout` use a
   2px tone-coloured left edge, a tone icon and the normal surface — never a
   flooded panel. One page-level alert, not two competing ones.
8. **Live semantics are opt-in.** `live="off"` is the default for both `Alert`
   and `Callout`; `polite`/`assertive` are chosen by the caller. Static content
   is not an interruption.
9. **Empty is static.** `EmptyState` invents no live region, keeps its heading
   level under the caller's control, and offers one obvious next step. Domain
   empty states (chart, DataTable) keep their own wording and actions.

## 10. Anti-patterns (each of these has been a real bug somewhere)

- A component inventing a radius, shadow, duration or colour.
- A translucent surface under an effect layer.
- `text-fg-disabled` used for content a user must read.
- A disabled field dimmed with `opacity`, dragging its label, message and chips
  below 4.5:1 (and dimming at random whenever a stepper hit its max).
- Two accent-coloured elements competing in one region.
- Colour as the only signal for direction or status.
- A component wrapper that adds a layer without adding value.
- Animation that is not a response to a user action or a state change.
- A loading indicator that hides a layout the client already knows.
- A chart using an engine default theme, tooltip or legend.
- A chart that computes an indicator, or silently drops points.
- Two chart families inventing their own axis weight, palette or tooltip.
- A translucent surface that carries text: tooltip, menu, toast, table cell.
- A sticky or pinned cell that lets scrolled content show through it.
- A table that fetches, computes or silently converts units.
- A Select wired to navigation, or a CommandMenu used as a form field.
- A Combobox that drops keystrokes because React, not the browser, owns the text.
- Virtualising a table that fits on one screen.
- A page-local sidebar or topbar stylesheet when `AppShell` exists.
- A translucent topbar, or a sidebar with an arbitrary per-page width.
- Putting pane sizes or hover state in the URL.
- Encoding the whole view as one JSON parameter, or writing defaults into a link.
- Importing a router inside `@luc/ui`, or a source path from a product.
- A workspace where a page would do — and a page where the reader needs panes.

## 11. QA checklist

Before a component or page is considered done:

- [ ] Dark **and** light checked, with a screenshot in both.
- [ ] Keyboard path works; focus is visible and never lost.
- [ ] Reduced motion verified (no travel, meaning preserved).
- [ ] axe reports no serious or critical violations on the page.
- [ ] No console errors; no layout shift when data arrives.
- [ ] Every value in the diff resolves to a token.
- [ ] The component's showcase page shows variants, sizes and states.
- [ ] Any surface carrying text is opaque, with and without backdrop blur.
- [ ] A table renders loading, empty and error without losing its columns.
- [ ] A new overlay declares which layer it belongs to, from the `z.*` table.
- [ ] A form's field wiring is `Field`'s, not hand-rolled: label, description,
      error and status all referenced by `aria-describedby`.
- [ ] A disabled field dims its control, not its text.
- [ ] A date-only value never passes through a JavaScript `Date`.
- [ ] A shell is an `AppShell`, not page-local layout CSS.
- [ ] A workspace pane has a focusable body and a named separator.
- [ ] Shareable state is in the URL, personal state is local, hover is nowhere.
- [ ] A subpath import pulls only what it needs (`pnpm test:consumer`).
