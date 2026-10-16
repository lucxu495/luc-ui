# Phase 2 — Visual Transformation, Signature Motion and Bilingual Showcase

**Date:** 2026-10-08
**Branch:** `main` · **Revision:** `9cec3c2578911629e7fcf2248d50c35f8cb35240` (uncommitted working tree)
**Scope:** `luc-ui/**` only. No public API was removed or repurposed.
**Predecessor:** [`2026-10-08-phase-2-community-edition.md`](./2026-10-08-phase-2-community-edition.md)

---

## 1. Why this cycle exists

The first Phase 2 delivery passed every engineering gate and was still judged a
**product failure**: the Showcase looked almost unchanged, the accent palettes
were useful but not a transformation, the Button sheen was too small to
remember, and the Motion section read exactly as it had before.

The diagnosis was not that the design was wrong. It was that the cycle had spent
its budget on infrastructure (catalog determinism, packaging, contrast gates,
deployment) and almost none of it on the two things a reviewer actually sees:
**distinctive interaction** and **material difference**. This cycle is the
correction. It is measured by what a person can see, press and compare.

Three commitments follow from the critique:

1. **New interactions, not new colours.** A palette is a hue change; it cannot
   make a library feel different. What can is motion, geometry, density,
   typography proportions and elevation moving together.
2. **Public APIs or it does not count.** Every effect on the Showcase is a
   `@luc/ui` export that a consuming product can call.
3. **Bilingual is a product feature.** English and Simplified Chinese are
   first-class, with the locale in the URL.

---

## 2. What shipped

### 2.1 Five new motion primitives (`@luc/ui/motion`)

| Primitive | Public API | What it does | Why it is different |
| --- | --- | --- | --- |
| `PressRipple` | `usePressRipple()` · `<RippleLayer />` · `<PressRipple>` | Press ink spawned at the pointer position, sized to the surface, one or two rings | Derived from where the finger actually landed; never on hover, never on mount; never spawns under reduced motion |
| `AuroraSurface` | `<AuroraSurface tone density speed grid vignette />` | A drifting, palette-derived atmosphere for a hero, auth screen or empty state | Fields are mixed from `--accent-default` plus one fixed hue rotation, so a palette switch re-tints the atmosphere instead of leaving a stranded gradient. Compositor-only drift on a 14s+ loop, masked and vignetted |
| `BeamFlow` | `<BeamFlow points state width speed label />` | A packet travelling a smooth path between two or more waypoints | One SVG in a 0-100 viewBox with non-scaling strokes: responsive by construction, no `ResizeObserver`, no path library. The rail stays when the packet stops |
| `MagnifyDock` | `<MagnifyDock range scale lift orientation>` · `<MagnifyDockItem>` | Pointer-proximity magnification for a dense toolbar | Cosine falloff written as two custom properties inside one animation frame; React never re-renders on pointer move; the dock is fully usable and keyboard-navigable with no pointer at all |
| `Marquee` | `<Marquee speed direction gap pauseOnHover fade>` | A seamless, pausable stream | Two copies of the track (the second `aria-hidden`), each shifted by exactly its own width; pause-on-hover is on by default because an unreadable strip is a defect |

Supporting hooks: `usePointerGlow()` (frame-throttled cursor position, written to
custom properties) and the shared `luc-cursor-light` utility.

### 2.2 The core controls now answer the pointer

- **Button / IconButton** gained press ink (two rings on a filled control, one on
  a quiet one) and a pointer-tracked highlight. Both are opt-out with
  `tactile={false}`.
- The recipe now carries `isolate`, so the ink layer paints above the fill and
  below every label without any label needing a `z-index`.
- **Input / Textarea / Select** lift on hover and take an accent border plus an
  inner highlight on focus, so the field being edited is obvious in a dense form
  at 100% zoom.
- **Slider** grows its thumb on hover and drag, and its filled range carries a
  soft accent gradient. Invalid stays flat negative, because that meaning must
  never be softened.
- **Popover, menu, select list and combobox list** unfold from their anchor
  (4px travel, scale from 0.962) instead of fading in like a floating rectangle.
  Dialogs and sheets keep the calmer overlay entrance.

### 2.3 Visual personality — a second axis beyond colour

`data-personality` moves four token groups together in `tokens.css`:

| preset | geometry | density | proportions | physics |
| --- | --- | --- | --- | --- |
| `instrument` (default) | 4/6/8/12/16/22px | 28/34/40px controls | current leading and tracking | current durations, standard curve |
| `editorial` | 6/10/14/20/26/40px | 32/38/44px | looser leading, relaxed tracking | slower (180/260/380ms), gentle curve |
| `dense` | 3/4/6/8/10/14px | 24/28/34px, 1.75rem rows | tight leading and tracking | fast (50/100/140ms) |
| `expressive` | 8/12/16/22/28/44px | 32/40/48px | heavier display weights | 60/120/180ms, fast-out curve, bouncier overshoot, stronger glow |

The attribute works on `<html>` or on any subtree, exactly like `data-palette`
and `data-typeface`, so four materials can be compared on one page. Its
theme-dependent values use the same four-selector form as the palettes, so a
personality never flattens the light/dark difference.

### 2.4 Bilingual Showcase (English + Simplified Chinese)

The locale lives in the URL:

| request | result |
| --- | --- |
| `/components/buttons` | English, served as-is — every pre-existing URL still works |
| `/zh/components/buttons` | rewritten to the same route, `lang="zh-Hans-CN"` |
| `/en/components/buttons` | explicit English alias |
| `/` from a `zh` visitor | 307 to `/zh` |

One copy of every page exists. `middleware.ts` rewrites the prefix and hands the
locale to the server through a request header; the root layout resolves it from
that header, then the cookie, then `Accept-Language`, and passes it to
`@luc/ui`'s own `LocaleProvider` (so React Aria's date segment order, week start
and clock format follow the language) and to the Showcase's `I18nProvider`.
Reading headers makes the routes dynamic. That is a deliberate trade: the
alternative is English HTML swapped after hydration, which flashes the wrong
language and tells a screen reader the wrong `<html lang>`.

Coverage, measured rather than asserted:

| surface | coverage |
| --- | --- |
| Navigation (group titles, item labels, descriptions) | 224 / 224 strings |
| Chrome (sidebar, topbar, breadcrumbs, status bar, appearance, theme, motion, language controls, command palette) | all user-visible strings |
| Page headers (title and lead) on documented routes | 97 / 97 routes |
| Long-form body copy | homepage, motion gallery, signature motion, personality |

Everything else renders in English rather than a raw key: the English dictionary
is the canonical source and the fallback, and a missing translation is reported
once per key in development. The gap is disclosed **in the product** as well:
the language switcher popover states which surfaces are translated.

### 2.5 Showcase

- **New homepage**: one AuroraSurface hero carries the page's identity, then
  quiet, scannable sections — a live signature stage (BeamFlow, MagnifyDock,
  NumberTicker, Delta), a capability marquee, four personalities side by side,
  seven live palettes, three signature interaction tiles, the bilingual pair,
  four cross-industry vignettes and engineering metrics.
- **New `/motion` gallery index**: every kinetic primitive grouped by intent
  (Signature, Pointer, Feedback, Entrance), each naming its public API, with
  inline specimens.
- **New `/motion/signature` page**: five primitives with live controls —
  intensity level, aurora tone and density, beam state, marquee speed, and a
  replay control for the one-shot effects.
- **New `/foundations/personality` page**: the same four specimens rendered in
  four personality subtrees, with a "use this one" control per column.
- **Navigation**: all three new routes are registered in `lib/navigation.ts`, the
  sidebar, the command palette and `qa/routes.mjs`. Nothing is reachable only by
  typing a URL.

### 2.6 QA tooling correction (not a product change)

The nested-list rule in `qa/behaviour.mjs` matched `<li><ul><li>`, which is valid
HTML and is exactly how the sidebar submenu and the outline drawer are built.
The pattern now stops scanning at an intervening `ul`/`ol`, so it still catches
the real defect (a list item nested directly in another) without flagging correct
markup.

---

## 3. Evidence

### 3.1 Engineering gates

| command | result |
| --- | --- |
| `pnpm verify` (workspace) | exit 0 |
| `pnpm --filter @luc/ui test` | 662 passed / 71 files |
| `pnpm --filter @luc/ui typecheck` and `lint` | pass (0 warnings) |
| `pnpm --filter @luc/showcase typecheck` and `lint` | pass |
| `catalog:generate` and `catalog:check` | 34 public paths, 10 fixtures, 0 absolute paths |
| `verify:package` and `verify:types` | pass |
| `test:consumer` (tree-shaking and budgets) | pass, see 3.3 |

New unit coverage: `motion/signature.test.tsx` (12 tests) — ink spawns at the
press point and is cleaned up, no ink under reduced motion, the hook form works
on a caller-owned element, aurora fields are decorative and freeze when static,
the beam draws a curve with a rail and no packet under reduced motion, the
marquee exposes one copy to assistive technology and collapses to one under
reduced motion, and the dock lays out every lane at rest.

### 3.2 Browser QA

A focused driver, run against both the preview server (`next start`, port 3100)
and the deployed container (`127.0.0.1:3000`), passed **26/26 checks** in both
places. The checks are behavioural, not visual: they read computed transforms,
count aria-hidden layers and press real controls.

| check | measured |
| --- | --- |
| Light theme applies through the real control | `data-theme=light` |
| Dock magnifies on hover | item 34.0px to 52.7px |
| Marquee is animating | `translate3d` changed by 27px in 900ms |
| Press ink spawns | 0 to 1 ring on a real press |
| Intensity `functional` stops ambient drift | 0 drift layers |
| Intensity `expressive` restores it | drift layers present |
| Beam draws a curve and keeps a rail when idle | path contains `C`; rail survives |
| Reduced motion collapses the marquee | 1 copy, no animation class |
| Chinese deep link renders Chinese | `<h1>` is 标志性动效 |
| `<html lang>` | `zh-Hans-CN` |
| Unprefixed URL redirects a Chinese visitor | `/zh/components/buttons` |
| Language switch updates the URL and the content | `/components/buttons`, `<h1>` is Buttons |
| Back returns to the Chinese URL | yes |
| Sidebar reachable by keyboard; Enter navigates | focus moved, navigation happened |
| Chinese mobile has no page-level overflow | -10px at 390px |
| axe on `/motion/signature`, `/foundations/personality`, `/zh/motion/signature`, `/zh/foundations/themes` | 0 serious or critical findings |
| Design Lab row selection still registers | 1 selected marker |
| Console and hydration errors | none |

The official harness (`node qa/run.mjs --mode=full`) swept **104 routes**, took
**317 screenshots**, ran **158 axe scans with 0 violations**, and passed 69 of 71
behaviour checks, with no problems recorded.

### 3.3 Bundle and performance

The tactile layer sits on `Button` and `IconButton`, so every entry point that
renders a control pays for it. Measured with the consumer smoke test (minified,
third-party modules external):

| entry | raw before to after | gzip before to after |
| --- | --- | --- |
| `button-only` | 5,803 to 11,010 | 2,104 to 3,711 |
| `date-picker` | 24,518 to 29,275 | 7,076 to 8,587 |
| `app-shell` | 25,739 to 30,354 | 7,499 to 8,944 |
| `tradingview` | 46,247 to 53,204 | 12,039 to 14,059 |
| `charts` | 60,952 to 60,507 | 18,602 to 18,532 |
| `slider` | 6,432 to 6,572 | 2,437 to 2,505 |
| `menus` | 2,516 to 2,876 | 1,049 to 1,197 |
| `barrel` | 9,368 to 14,729 | 3,315 to 4,671 |

This is a **deliberate, disclosed budget change**, not a hidden regression. The
delta is the shared tactile module (press ink, the pointer tracker, the resolved
intensity profile and the reduced-motion hook). A first attempt to trim it by
splitting the intensity profile table out of the motion token file produced no
measurable saving; the split is kept because it is better layering. `charts`
shrank. The baseline was re-recorded through the tool's own mechanism
(`LUC_UPDATE_BASELINE=1`), which is the documented way to accept a measured
change.

Mitigation if the gzip cost ever matters more than the interaction: ink can
become a centre-out CSS ring on `:active` (0 bytes), which loses the
pointer-origin behaviour that makes the press feel physical.

### 3.4 Screenshots

| file | what it shows |
| --- | --- |
| `screenshots/v2-home-dark-1440.png` | homepage, dark: hero, stage, personalities, palettes, signature tiles |
| `screenshots/v2-home-light-1440.png` | the same page in light mode |
| `screenshots/v2-home-zh-mobile-390.png` | Simplified Chinese at 390px |
| `screenshots/v2-signature-dark-1440.png` | the signature motion gallery |
| `screenshots/v2-signature-zh-1440.png` | the same page in Chinese |
| `screenshots/v2-personality-dark-1440.png` | four personality subtrees |
| `screenshots/v2-motion-gallery-dark-1440.png` | the motion index |

---

## 4. Skill use (concrete, not decorative)

| skill | where it changed a decision |
| --- | --- |
| `frontend-design` | Its list of generated-page tells is why the homepage has one orchestrated moment (the aurora hero) followed by quiet sections, why the previous hero treatment was replaced rather than restyled, and why the personality swatch previews material (corner radius) instead of another colour dot |
| `web-design-guidelines` | The language switcher is built from real links so middle-click and copy-link work; `prefetch={false}` plus a full document navigation was chosen over a soft navigation so `<html lang>`, the sidebar and the content cannot disagree; focus-visible and reduced-motion behaviour was checked for every new primitive before shipping |
| `vercel-composition-patterns` | `PressRipple` is a hook plus a layer plus a thin convenience wrapper rather than a component with five boolean props; `MagnifyDock` registers items through context and compound children; the slider and input changes reuse one shell recipe instead of adding flags |

Sources: the three installed skills under `/home/luc/.codex/skills/`
(`frontend-design`, `web-design-guidelines`, `composition-patterns`), all present
and readable on this server. Suggestions that were **not** taken: the dock was
not applied to the sidebar (navigation should not move under the pointer); the
aurora was not put behind content-bearing panels; and no third-party component
code was copied.

---

## 5. Known limitations and rejected approaches

**Pre-existing, not introduced here**

1. TradingView iframe widgets stack a second container on a theme flip (3 to 6
   containers and iframes). Reproduced identically against the previously
   deployed image on `127.0.0.1:3000` before this cycle's deploy, so it is not a
   regression; it is visible now because the full 104-route sweep runs the
   provider behaviour group.
2. The nested-list QA rule was a false positive (see 2.6). Fixed in tooling.

**Deliberately out of scope**

- Trimming the tactile module further; recorded as a measured trade-off with an
  explicit mitigation.
- Translating the long-form body of the remaining documentation routes. The
  infrastructure, the chrome, the navigation and every page header are done; the
  gap is disclosed in-product and in 2.4.
- A component-by-component visual audit of the whole forms and overlays
  families. Both were read, the defects visible in the browser were fixed, and
  the remainder was judged to already meet the quality floor. No claim of a
  complete per-component audit is made.

**Rejected**

- Another palette or a gradient theme: hue changes were the original complaint.
- Rewriting `Tabs` and `SegmentedControl`: the shared-indicator mechanics already
  work and pass; only the overlay entrance changed.
- Adding an i18n runtime dependency: the URL prefix plus dictionary approach is
  smaller, typed and fully controlled, and a runtime would not have translated a
  single string.
- Bundling new typefaces for the typography presets: the presets re-point roles
  at platform stacks, so the library stays portable.

---

## 6. Luc Web consumer impact

| change | previous | new | import path | Luc Web uses it | tested | class |
| --- | --- | --- | --- | --- | --- | --- |
| Button and IconButton tactile layer | hover fill only | press ink plus pointer light, opt-out with `tactile={false}` | `@luc/ui`, `@luc/ui/components/button` | yes | not opened this cycle | COMPATIBLE |
| Button DOM | label only | one extra `aria-hidden`, `pointer-events-none` layer inside the button | same | yes | not tested | COMPATIBLE |
| Input and Select focus treatment | border plus ring | border plus ring plus inner highlight | `@luc/ui/components/input`, `.../select` | yes | not tested | COMPATIBLE |
| Package size | - | about +5 KB raw and +1.6 KB gzip on a button-only entry | - | - | measured | COMPATIBLE, disclosed |
| `data-personality` | n/a | additive token block; an absent attribute means today's behaviour | `@luc/ui/tokens.css` | no | n/a | NONE |
| New motion exports | n/a | additive | `@luc/ui/motion` | no | n/a | NONE |

No public API was removed, renamed or repurposed. Luc Web was **not** opened,
built or tested in this cycle, so every COMPATIBLE classification above is a
source-level judgement rather than a verified consumer run.

---

## 7. Follow-ups (proposed, not started)

1. Open Luc Web against this revision, run its own checks, and confirm the button
   and input visuals there. No migration is expected.
2. Translate the long-form body of the component documentation routes using the
   existing dictionary.
3. Fix the TradingView theme-flip stacking defect.
4. Decide whether a component-by-component forms and overlays visual audit is
   worth a cycle, or whether the state grids already carry it.
