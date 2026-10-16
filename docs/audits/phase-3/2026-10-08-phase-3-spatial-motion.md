# Phase 3 — Spatial & Creative Motion

**Date:** 2026-10-08
**Branch:** `main` · **Base revision:** `9cec3c2` (the Phase 2 tree; the Phase 3
work is an uncommitted working tree on top of it)
**Scope:** `luc-ui/**` only. No public API was removed or repurposed, and the
Phase 2 signature-motion system was extended rather than replaced.
**Predecessor:** [`2026-10-08-phase-2-visual-transformation.md`](../phase-2/2026-10-08-phase-2-visual-transformation.md)

---

## 1. What this cycle was for

Phase 2 was accepted as a *baseline*: the user confirmed that the signature
interactions had reached the minimum aesthetic standard. The next objective was
explicitly not "more of the same", but **spatial presence** — depth, geometry,
continuity and material — with a hard requirement that every effect is a public
export a product can adopt, and that nothing becomes inaccessible or expensive.

The work was ordered as the brief demanded: implement first, then quality, then
research. Six capability families had to end with a real public implementation
or a verified existing primitive.

## 2. The six families, and what shipped

| # | Family | Public result | Where it lives |
| --- | --- | --- | --- |
| A | Spatial surfaces & materials | `ParallaxScene` + `ParallaxLayer`; `useParallax`; `TiltSurface material="glass"`; `luc-glass` and the `--glass-*` / `--layer-shadow` token tier | `motion/parallax-scene.tsx`, `hooks/use-parallax.ts`, `motion/tilt-surface.tsx`, `tokens/tokens.css`, `styles/utilities.css` |
| B | Geometric motion | `OrbitField`, `OrbitFieldRing`, `OrbitFieldNode`, `OrbitFieldCore` | `motion/orbit-field.tsx` |
| C | Morphing & continuity | `ExpandableSurface`, `ExpandableSurfaceTrigger`, `ExpandableSurfaceContent`, `ExpandableSurfaceClose` | `motion/expandable-surface.tsx` |
| D | Kinetic typography | `KineticHeadline` | `motion/kinetic-headline.tsx` |
| E | Depth, perspective & navigation | `CardStack`, `CardStackItem`, `CardStackControls`, `useCardStack` | `motion/card-stack.tsx` |
| F | Interactive data motion | `SelectionBeam` | `motion/selection-beam.tsx` |

Every one of them reads the existing resolved intensity profile
(`useMotionProfile()`), so a product can scope a page to `functional` or `none`
without touching a call site, and reduced motion resolves in one place.

### A. Depth is a coordinate system, not an effect

The interesting design decision in `ParallaxScene` is *where the value lives*.
A scene needs one pointer offset that every layer multiplies by its own depth.
React state would re-render the subtree per frame; a `MotionValue` would force
every layer to be a motion component owning a subscription. Instead the scene
writes four custom properties (`--luc-parallax-x/y/rx/ry`) on one element, and a
layer is a plain `<div>` whose transform is
`translate3d(calc(var(--luc-parallax-x) * depth), …, z)`.

Consequences, all of them verifiable on the page:

- one rAF loop for the whole scene, started on pointer enter and stopped when
  the motion settles, so an idle page pays nothing;
- **measured**: 21 pointer positions produced 82 style writes on the scene and
  **0** writes anywhere else in the document (Showcase QA, `spatial` group);
- readable content sits at depth `0`, so nothing a person reads moves;
- without a pointer the layers keep their `translateZ` separation, which is what
  a touch device, reduced motion and print receive.

The material tier is derived, not literal: `--glass-surface` is
`color-mix(in oklab, var(--surface-overlay) 72%, transparent)`, so a palette
switch or `data-personality` re-tints it. `luc-glass` adds the hairline top
highlight and one shadow; the strong variant is used wherever text sits on it.

### B. An orbit is a layout

`OrbitField` is a compound component: a container, a ring, a seat, and a hub.
Rings are sized in percentages of the field's width, rotate with a CSS
animation, and are centred with negative percentage margins because a
`translate` utility would be overwritten by the rotation the moment it starts.

Three decisions that turned a demo into a component:

1. **Seats can be real controls.** Passing `onSelect` renders a
   `<button type="button">` with `aria-pressed`, so click, Tab and Enter all
   work and the choice is announced.
2. **Labels counter-rotate at the ring's exact period.** This is subtler than it
   looks: `animation-direction: reverse` runs a *rotating* keyframe set
   backwards, so a reversed ring's angle is `-360t/T` and its labels need the
   **forward** keyframe set, not the inverse one. The first implementation got
   this wrong and every label arrived tilted by the live angle; the fix and the
   reason are now both in the source and covered by a unit test.
3. **A moving control is a defect.** `luc-orbit-rest` pauses the ring — and its
   labels — on hover and `focus-within`. QA asserts
   `ring=paused counter=paused` while the pointer rests on a seat, and the
   `Freeze the orbit` control exists because waiting for a turning chip to come
   back is not an interaction.

### C. Continuity without a portal

`MorphingDialog` already solved "open this elsewhere". `ExpandableSurface`
solves "become more, right here": the compact face and the expanded face occupy
the same grid cell and share one `layoutId`, so the surface grows out of its own
rectangle. There is deliberately no `<AnimatePresence>` — when the panel
unmounts, motion already knows the last rectangle that carried the identity, so
the trigger grows back out of it and a closed surface leaves *nothing* behind
(no hidden `role="region"`, no linger before the trigger is interactive).

Focus is moved deliberately and verified: opening focuses the panel, Escape
closes it and returns focus to the trigger. Under reduced motion the shared
layout is dropped rather than slowed, and the surface simply swaps.

### D. Typography that acknowledges a change

`KineticHeadline` animates a change of *words* with a direction and a stagger —
a rotating value proposition, a wizard step, a live status line. Word
granularity, real text nodes, and exactly one accessible string: the animated
layer is `aria-hidden` and a visually hidden copy carries the text and announces
it politely when `live` is set. The page shows both treatments side by side, so
the kinetic version can be checked against the static one rather than admired in
isolation.

### E. Depth as navigation

`CardStack` deliberately is not a carousel: there is no track, no autoplay and
no slide transition. The active card is largest and closest, the cards behind it
recede on three axes, and stepping moves the whole deck — which answers "how
much is left" without a progress bar. Arrow keys, Home and End step it, a 48px
horizontal drag steps it on touch (`touch-action: pan-y`, so vertical scrolling
stays native), and every card behind the active one is `inert`, so Tab can never
land inside a card the user cannot see. A polite live region announces
`n / total`.

`CardStackControls` is a **separate component** rather than a `controls` boolean
(the composition rule from the Vercel composition-patterns skill): it reads the
same context and can be placed under the deck, beside it, or in a toolbar.

### F. The link between selection, marker and inspector

`SelectionBeam` takes two refs and measures them; it knows nothing about tables
or charts, which is what keeps it general. The overlay is `position: fixed`, so
it needs no positioned ancestor and cannot be clipped by one; measurement is
rAF-coalesced and re-runs on resize and on any scroll (captured at the window,
so a beam inside a scrolling pane stays attached); nothing renders until the
first measurement, so SSR output is empty.

The one non-obvious API is `revision`: selecting a different row moves the
anchor without changing either ref object or either box size, so the component
needs the caller to say "the anchor changed identity".

## 3. Rejected alternatives

| Rejected | Why |
| --- | --- |
| A WebGL/canvas layer for the depth scenes | Nothing here needs it: three layers, one pointer offset and a `perspective()` give the same read at a fraction of the cost, with no SSR problem and no new dependency. |
| `SpatialCard` as a new wrapper | `Card` + `TiltSurface material="glass"` + `ParallaxLayer` composes the same thing from primitives that already work, and a fourth card component would fork the surface hierarchy. |
| Glass on the card deck | Overlapping translucent surfaces show each other's text. The deck is opaque on purpose and the page says so. |
| Parallaxing a text layer | Moving what a person is reading is the classic "cheap page" tell. Content stays at depth 0. |
| A modal for the expandable surface | Taking the page away destroys exactly the context that makes the detail meaningful. |
| `animation-direction: reverse` for the counter-rotation | Wrong by construction (see B.2); replaced by explicit opposite keyframe sets. |
| Continuous motion with no rest state | A control that will not hold still is unusable; every orbit now rests on hover and focus. |

## 4. Showcase

**Route:** `/motion/spatial` (registered in `lib/navigation.ts` under *Motion*,
in `qa/routes.mjs`, and in the QA `spatial` behaviour group).

The page is a gallery, not a fixture list: one **control board** drives all six
families at once — depth (0–48px), tilt (0–14°), orbit speed (0.4–2.4×), the
glass material, freezing the orbit, and the intensity level — so two treatments
can be compared under identical settings instead of hunting for per-demo knobs.
Each section states what the public API is, what the note is, and what was
rejected. The masthead, the copy and the controls are bilingual (see §6).

Before/after evidence is captured as screenshots of the deployed container:

| Screenshot | What it shows |
| --- | --- |
| `artifacts/screenshots/motion-spatial-orbit-dark-desktop.png` | The full page with the orbit mid-turn and a seat selected |
| `artifacts/screenshots/motion-spatial-deck-dark-desktop.png` | The deck after keyboard stepping, with the controls composable slot |
| `artifacts/screenshots/motion-spatial-data-dark-desktop.png` | The beam re-anchored from the APAC row to the inspector |
| `artifacts/screenshots/motion-spatial-reduced-dark-desktop.png` | The same page under reduced motion: composition intact, pointer effect off |

The Phase 2 motion gallery (`/motion`) also gained a *Spatial* group, so the new
work is discoverable from the gallery index as well as the sidebar.

## 5. Verification

Exact commands, run against the built Showcase image on `127.0.0.1:3000`:

| Command | Result |
| --- | --- |
| `pnpm --filter @luc/ui typecheck` | exit 0 |
| `pnpm -r --filter='!luc-ui-workspace' lint` | exit 0 |
| `pnpm --filter @luc/ui test` | **674 passed / 72 files** (12 of them new, in `motion/spatial.test.tsx`) |
| `node scripts/qa-server.mjs --mode=behaviour` | **81/81 checks**, 51 screenshots, 0 console errors, 0 hydration mismatches |
| `node scripts/qa-server.mjs --mode=providers --provider-mode=live` | 6/6 checks, 0 a11y violations, 147 widgets ready |
| `pnpm --filter @luc/ui catalog:generate` + `catalog:check` | catalog regenerated (392 new entries) and verified |
| `node scripts/consumer-test.mjs` | all entry points isolated; new `motion-spatial` entry **6.2 KB raw / 2.2 KB gzip** |

The spatial behaviour group asserts, on the real page:

1. `ParallaxScene` publishes a **non-zero** pointer offset as custom properties
   (off-centre on purpose: a check that accepts `0.000px` would pass while the
   scene did nothing).
2. Pointer movement writes the scene and **nothing else in the document**.
3. An orbit ring and its labels pause while the pointer rests on a seat.
4. A seat is a button: clicking EMEA moves the hub from `APAC 412` to
   `EMEA 356` with `aria-pressed="true"`.
5. `ExpandableSurface` opens in place, moves focus into the panel, closes on
   Escape and returns focus to the trigger.
6. `KineticHeadline` swaps the accessible string and keeps real text nodes.
7. `CardStack` steps from the keyboard and from its controls, clamps at the end,
   and keeps exactly the hidden cards `inert`.
8. `SelectionBeam` re-anchors: the path's `d` changes when the selected row
   changes.
9. Reduced motion keeps the arrangement (`data-parallax="off"`, 3 deck layers).

### What is not proven

- Automated a11y scans cover the page's DOM; the *quality* of the motion is a
  human judgement, and the screenshots above are the evidence for it.
- Touch behaviour is asserted through `touch-action`/pointer-type contracts and
  the mobile screenshot, not through a real device.
- The 82-writes measurement is one Chromium run; it is a sanity metric, not a
  benchmark.

## 6. Bilingual coverage after this cycle

`apps/showcase/scripts/i18n-coverage.mjs` measures this from the real registries
rather than asserting it. On this tree:

| Surface | Coverage |
| --- | --- |
| Routes on disk | 106 (105 registered in QA) |
| Page headers (title + lead) | 106 / 106 |
| Navigation labels | 120 / 120 |
| Navigation descriptions | 107 / 107 |
| Chrome strings | 78 / 78 |
| Long-form content keys | 191 / 191 in both dictionaries |
| **Page bodies** | **4 / 106** (homepage, `/components`, `/motion/spatial`, `/foundations/personality`) |

The gap is real and is reported as it is: everything a visitor navigates by is
Chinese, and most long-form prose is still English. It is disclosed in the
product itself — the language switcher states which surfaces are translated —
and the mechanism for closing it is mechanical: a page joins the translated set
by calling `tc(key)` and adding the key to both dictionaries. The script fails
on a key that exists in English without a translation, and on an orphaned
translation, so the two dictionaries cannot drift.

## 7. Consequences for consumers

Additive public surface only. The one behaviour change is that `Button` and
`IconButton` continue to render their Phase 2 press-ink layer, and `TiltSurface`
gained a `material` prop that defaults to today's behaviour. See the
compatibility section of the server handoff report for the full classification.
