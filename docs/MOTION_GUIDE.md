# LUC UI — motion guide

Motion in LUC UI answers a question the user already has: *did that work?*
It is never the product.

## Vocabulary

| Token | Value | Use for |
| --- | --- | --- |
| `--motion-instant` | 70ms | Pressed feedback, hover tint, icon swap. |
| `--motion-fast` | 140ms | Default: colour, border, opacity, small transforms. |
| `--motion-normal` | 200ms | Functional movement: tabs, popovers, tooltips, dialogs. |
| `--motion-slow` | 300ms | Larger surfaces entering. |
| `--motion-slower` | 460ms | Rare: page-level reveal, chart entrance. |

| Easing | Curve | Use for |
| --- | --- | --- |
| `standard` | `cubic-bezier(0.2, 0, 0, 1)` | Everything by default. |
| `enter` | `cubic-bezier(0.16, 1, 0.3, 1)` | Elements arriving. |
| `exit` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving (shorter than entry). |
| `emphasized` | `cubic-bezier(0.3, 0.85, 0.15, 1)` | Indicators that slide and resize. |
| `overshoot` | `cubic-bezier(0.34, 1.32, 0.64, 1)` | State delight only: checkbox tick, radio dot. |

### V1.1 — springs and distances

The duration/easing scale above is for **data and surfaces**. Things the user is
*touching* move on a spring instead, and travel distances are named so no
component invents its own offset.

| Spring | Value | Use for |
| --- | --- | --- |
| `spring.soft` | 140 / 20 | A large surface settling (sheet, sidebar, fullscreen). |
| `spring.responsive` | 320 / 30 | Default: a highlight, a thumb, a card that answers. |
| `spring.snappy` | 520 / 34 | A small, immediate acknowledgement. |

| Distance | Value | Use for |
| --- | --- | --- |
| `motion-distance-xs` | 4px | Highlight travel, a state swap. |
| `motion-distance-sm` | 8px | Card and grid entry. |
| `motion-distance-md` | 14px | A panel appearing in flow. |

Import them from `@luc/ui/motion` (`duration`, `easing`, `spring`, `distance`,
`transitionCss`) rather than writing a literal. `tokens.css` carries the same
values as custom properties for CSS-only components.

**Springs are for interaction; durations are for data.** A spring that overshoots
a number implies a precision the number does not have.

## Tiers

| Tier | Budget | Examples | Rule |
| --- | --- | --- | --- |
| 1 — Functional | 140–220ms | Tabs, tooltip, popover, dialog, switch, selection | Keep it. Never removed, only shortened. |
| 2 — Micro delight | 180–480ms | BorderGlow, shimmer, hover lift, number ticker, spotlight | At most one per view. Must degrade to a static state with no loss of meaning. |
| 3 — Atmospheric | 2s+ | Hero backgrounds, report covers, AI surfaces | Landing pages and reports only. Never in dense application UI. |

## Reduced motion

Three mechanisms, in order of reach:

1. **CSS clamp** (`packages/ui/src/styles/base.css`): under
   `prefers-reduced-motion: reduce`, every animation and transition is clamped
   to ~0ms.
2. **`data-motion-essential`**: the only exception. Spinners and live status
   dots keep a slow opacity pulse so the indicator still means "active". Never
   used for travel or rotation.
3. **`useReducedMotion()`**: behavioural decisions the CSS cannot make — the
   number ticker jumps instead of rolling, BorderGlow stops travelling,
   SpotlightSurface attaches no listeners at all.

Guarantee: **no information is carried by motion alone.** A reviewer with motion
reduced sees the same states, just without the travel.

### Overriding motion for review

The Showcase top bar has a `Motion auto / Reduced` control. It writes
`data-motion="reduced"` (or deletes it) on `<html>`; `useReducedMotion()` treats
that override as higher priority than the OS preference. Use it to review both
paths without touching system settings.

## Per-component answers

| Component | Full motion | Reduced motion |
| --- | --- | --- |
| Tabs | Indicator slides and resizes at 200ms `emphasized` | Indicator jumps; active label styling unchanged |
| Tooltip / Popover / Dialog | Enter 200ms `enter`, exit 140ms `exit` | Fade only (clamped) |
| Checkbox | Tick draws over 200ms | Tick appears |
| Radio | Dot scales with `overshoot` | Dot appears |
| Switch | Thumb slides 140ms `emphasized` with a press squish | Thumb moves instantly |
| Spinner | 760ms rotation | Slow opacity pulse (`data-motion-essential`) |
| Progress (indeterminate) | Single sweep | Sweep stops; the bar remains visible |
| BorderGlow | Travel mode sweeps the perimeter | Static ring; pointer light disabled |
| SpotlightSurface | Pointer-tracked light | Flat surface, no listeners |
| Shimmer | Highlight sweeps | No sweep |
| NumberTicker | 0.55s tween to the new value | Value snaps; still updates |
| Reveal | Fade + 8px travel, once | Content simply present |
| StaggerGroup / StaggerItem | ≤60ms per item, capped at 8 | Every item present, no cascade |
| Collapse | Height + opacity, 300ms `enter` | Opens immediately |
| SharedHighlight | Indicator glides 200ms `emphasized` | Indicator jumps; active styling unchanged |
| FadeSwap / Presence | Fade + 4px, 200ms | New state present immediately |
| MotionSurface | 1px lift + border step on hover | No lift |
| DataChangeFlash | 720ms semantic tint | Never flashes |
| Chart entrance | 520ms `standard` (preset-scaled) | Final frame immediately |

## Performance rules

1. Animate `transform` and `opacity`. Never animate `width`, `top`, `filter` or
   shadow blur per frame.
2. Pointer effects are rAF-throttled and write CSS variables — no React state
   per mouse move.
3. Effects are opt-in per surface. A 60-row table never attaches 60 listeners.
4. Atmosphere (tier 3) is allowed on exactly one element per page, and the
   Showcase hero is the only place in V0.1 that uses it.

## Anti-patterns

- A spring that overshoots on a professional surface.
- Motion that runs without a user action or a state change.
- Using animation to disguise a slow data load.
- Two different durations for the same class of interaction on one screen.
- Hiding content behind a scroll-triggered animation that might never fire.

---

## V1.2 — premium motion and kinetic interaction

V1.1 established the vocabulary and then used it sparingly. V1.2 keeps every
token and every primitive, and raises the *ceiling*: the system is now allowed
to be expressive, as long as the expressiveness is a decision rather than an
accident.

The design statement is:

> **Quiet at rest. Alive on interaction. Memorable at the moment of interaction.**

### 1. Intensity, not per-component sliders

Every cursor-reactive and ambient effect reads one resolved profile from
context. A component never takes "how loud am I" from a literal.

```tsx
import { MotionIntensityProvider } from "@luc/ui";

<MotionIntensityProvider intensity="showcase">
  <Hero />
</MotionIntensityProvider>
```

| Level | Pointer effects | Ambient loops | Travel × | Glow × | Depth × | Use for |
| --- | --- | --- | --- | --- | --- | --- |
| `none` | off | off | 0 | 0 | 0 | print, export, reduced motion |
| `functional` | off | off | 0.5 | 0.5 | 0.35 | forms, dense tables, navigation |
| `expressive` (default) | on | on | 1 | 1 | 1 | cards, chart controls, signals |
| `showcase` | on | on | 1.35 | 1.4 | 1.5 | hero, flagship visualisation |

`useMotionProfile()` returns the resolved `{ intensity, pointer, ambient, travel,
glow, depth, stagger }`. `pointer` and `ambient` may be overridden on the
provider for a screen that wants one but not the other.

**Reduced motion always resolves to `none`.** A component that reads
`profile.pointer` therefore cannot forget the reduced-motion path, and a
component that renders an idle state when the profile is `none` cannot drift
from it.

### 2. New tokens

| Token group | Members | Meaning |
| --- | --- | --- |
| `pointer` | `magneticStrength`, `magneticRadius`, `tiltMaxAngle`, `tiltPerspective`, `glareRadius`, `glareOpacity`, `spotlightRadius`, `parallaxDepth` | Cursor geometry. |
| `surfaceResponse` | `hoverLift`, `hoverScale`, `pressScale`, `selectedLift`, `glowStrength` | Hover/press geometry. |
| `depth` | `enterBlur`, `exitBlur`, `backgroundBlur` | Depth-of-field amounts, in px. |
| `ambient` | `slowLoop`, `pulse`, `shimmer`, `trail`, `gridDrift` | Loop durations, in seconds. |

The CSS mirrors are `--ambient-loop`, `--ambient-pulse`, `--ambient-shimmer`,
`--ambient-trail`, `--ambient-grid-drift`, plus `--animate-border-trail` and the
`luc-border-trail`, `luc-ambient-pulse`, `luc-grid-drift`, `luc-press-spring`
keyframes.

### 3. Primitive catalogue

| Primitive | Behaviour | Reduced motion | Touch |
| --- | --- | --- | --- |
| `Magnetic` | Leans toward the pointer, springs home; travel hard-clamped to 16px × depth. | No listeners, inert wrapper. | Inert (`pointer: coarse`). |
| `TiltSurface` | 3D lean in `perspective()`, optional glare, spring release. | Flat, no listeners. | Inert. |
| `GlareSurface` | Reflection that follows the pointer across the surface. | Static, no listeners. | Inert. |
| `SpotlightSurface` | Interior light, lit border and optional texture from one rAF write. | Flat surface. | Inert. |
| `BorderTrail` | SVG dash travelling the perimeter on a normalised path. | Frozen into a static accent. | Runs (it is not pointer-driven). |
| `InteractiveGrid` | Base grid + pointer-masked reactive grid, optional drift. | Calm static grid. | Static grid. |
| `ClickBurst` | 4–8 rays from the pointer on a completion. | Nothing spawns. | Fires on tap. |
| `IconMorph` | One glyph dissolving into the next in a fixed box. | Instant swap. | Same. |
| `TransitionPanel` | Directional swap in one slot (outgoing panel leaves the flow). | Instant. | Same. |
| `TextReveal` | `blur` / `mask` / `word` / `char` headline entrance, CSS-driven and SSR-safe. | Text present. | Same. |
| `ScrambleText` | Short decode for a status; real text is the accessible name. | Prints immediately. | Same. |
| `Pressable` | Spring hover lift and press compression, scaled by intensity. | Inert, same DOM. | Tap press. |
| `MorphingDialog` | Shared-geometry panel over Radix's focus/Escape/unmount contract. | No shared geometry; plain overlay. | Same. |
| `MorphingPopover` | The same idea at popover scale. | No shared geometry. | Same. |

### 4. Ambient motion rules

Loops are allowed in V1.2, under four constraints:

1. **One loop per element, one loud element per view.** A border trail on every
   card is noise; a border trail on the featured card is a signal.
2. **Never on data.** No looping mark, no pulsing historical point. The only
   permitted data-adjacent loop is the current-point ripple, and it is gated on
   `motion.emphasis`.
3. **CSS where possible.** `BorderTrail`, `Shimmer` and `InteractiveGrid` are
   pure CSS, so they cost nothing while off-screen and clamp to a static state
   under reduced motion.
4. **Meaning or nothing.** A loop must say "this is active", "this is
   processing", or "this is the current value". Decoration for its own sake is
   an anti-pattern.

### 5. Pointer motion implementation contract

All four cursor-reactive primitives share `usePointerMotion()`:

- positions are `MotionValue`s, never React state;
- at most one `requestAnimationFrame` write per frame;
- listeners are not attached at all on coarse pointers or under reduced motion;
- the existing size is cached and refreshed on resize, so the normalised
  position is correct after a reflow.

`useSpotlight()` (V1.1) remains the CSS-custom-property tracker used by
`SpotlightSurface`, `BorderGlow` and `InteractiveGrid`; the two share the same
rules.

### 6. What V1.2 is not

- Not a second animation library: Motion is still the only engine, and CSS still
  owns the simple loops.
- Not motion on data: charts animate their *interaction*, never a fabricated
  history.
- Not motion on every surface: a dense table row, a form field, a menu item
  stays functional.
- Not optional accessibility: reduced motion is resolved once, in
  `useMotionProfile`, and every primitive above consults it.

## V3.0 — spatial motion

V1.2 made the library expressive. V3.0 makes it **spatial**: depth becomes a
coordinate system rather than an effect, and the six families below are each a
public export with a live control board on `/motion/spatial`.

| Primitive | Family | What it does | Key API |
| --- | --- | --- | --- |
| `ParallaxScene` / `ParallaxLayer` | surfaces & depth | Publishes one pointer offset as inherited custom properties; each layer multiplies it by its own depth (`depth`, `z`, `axis`). | `<ParallaxScene depth tilt perspective>` |
| `OrbitField` / `OrbitFieldRing` / `OrbitFieldNode` / `OrbitFieldCore` | geometric motion | Rings rotate on the compositor; seats counter-rotate at the ring's exact period, can be real buttons, and the ring rests while the pointer is on it. | `<OrbitFieldRing radius duration direction>` |
| `ExpandableSurface` (+ `Trigger`, `Content`, `Close`) | morphing & continuity | A compact face and its expanded detail share one layout identity in one grid cell — in flow, no portal, no scroll lock, focus moves in and returns on Escape. | `<ExpandableSurface open onOpenChange>` |
| `KineticHeadline` | kinetic typography | Layout-aware word transition when the text changes; one accessible string, real text nodes. | `<KineticHeadline text mode stagger live>` |
| `CardStack` / `CardStackItem` / `CardStackControls` | depth & navigation | The deck is the navigation: arrows/Home/End, a 48px touch drag, `inert` cards behind the active one, and a composable controls slot. | `<CardStack visible offsetY shrink spread loop>` |
| `SelectionBeam` | interactive data | Measures two refs and draws a travelling packet between them, re-anchored by `revision`. | `<SelectionBeam from to active tone bow>` |

### Engineering contract

1. **Compositor only.** Every one of them animates `transform` and `opacity`.
   No animated filters, no layout reads per frame.
2. **No React render per pointer frame.** `ParallaxScene` writes four custom
   properties on one element inside a single rAF loop; layers are plain divs.
   Measured in the Showcase QA: 21 pointer positions produced 82 style writes on
   the scene and **0** writes anywhere else in the document.
3. **The composition survives reduced motion.** Layers keep their `translateZ`
   separation, rings freeze into a correct arrangement (`0°→360°` collapses to
   its start frame), and the deck keeps every card where it belongs.
4. **Nothing decorative carries meaning.** All effect layers are `aria-hidden`
   and `pointer-events-none`; state lives in semantics, colour and text.
5. **A moving control is a defect.** `OrbitFieldRing` pauses on hover and
   `focus-within`, and its labels pause with it — resting a pointer must make a
   target hold still.

### Anti-patterns established in V3.0

- **A parallaxed text layer.** Moving what a person is reading is the fastest
  way to make a page feel cheap. Content sits at depth `0` (or outside the
  scene); depth belongs to decoration.
- **Glass on a stack.** Overlapping translucent surfaces show each other's text,
  so `CardStack` refuses the glass material and says so on the page.
- **A ring radius larger than the field.** `radius` is a percentage of the
  field's *width*: `50` is the largest ring that still fits, and a value above
  that deliberately overflows.
- **Counter-rotating with `animation-direction: reverse`.** A reversed keyframe
  set runs a *rotating* animation backwards, so the ring's angle is `-360t/T`;
  the label needs the forward set, not the inverse one. Getting this wrong
  leaves every label tilted by the live angle.
