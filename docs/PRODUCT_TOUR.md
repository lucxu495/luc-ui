# Product Tour

`ProductTour` is the production-shaped product tour prototype for Luc UI. It is
separate from `GuidedTour`, whose released modal API remains unchanged in
v1.1.0.

```tsx
import { ProductTour, type ProductTourStep } from "@luc/ui";

const steps: ProductTourStep[] = [
  {
    id: "search",
    target: "#workspace-search",
    eyebrow: "WORKSPACE · 01",
    title: "Find the signal",
    description: "Search the current workspace without changing views.",
  },
];

<ProductTour
  steps={steps}
  defaultOpen
  variant="cloud-glass"
  mode="manual"
  onComplete={() => {}}
  onSkip={() => {}}
/>;
```

## Engine selection

The prototype uses a small positioning adapter in `src/product-tour/engine.ts`
rather than Driver.js or Floating UI.

| Option | Strength | Cost for this module |
| --- | --- | --- |
| Driver.js 1.10 | Complete tour lifecycle and familiar API | Ships an opinionated overlay, popover styling and roughly 206 kB unpacked; replacing the visual contract leaves less reusable code than it saves |
| Floating UI 1.8 | Excellent collision, flip, shift and anchored positioning | Adds a dependency layer and still requires a custom spotlight, bubble, lifecycle, recovery and visual system |
| Luc adapter | Exact viewport model for fixed/sticky/nested targets; SSR-safe pure helpers; no added runtime package | Luc owns the tested geometry and must verify browser edge cases itself |

The adapter measures `getBoundingClientRect()` in viewport coordinates, so it
does not need scroll offsets and works equally for fixed, sticky and nested
scroll targets. It supports preferred-side flip, viewport shift, tail clamping,
target-element or selector resolution, missing-target recovery and scroll into
view. `ResizeObserver`, capture-phase scroll and viewport resize are subscribed
only while a tour is active.

## Architecture

- `product-tour.tsx` owns open/step/status state, callbacks, focus, keyboard
  handling, pause policy, cleanup and the optional imperative handle.
- `engine.ts` is React-free positioning logic.
- `spotlight.tsx` draws four scrim plates around the live target. The target
  remains pointer-interactive.
- `bubble.tsx` owns the two SVG contours, anchored tail, countdown and content
  transition.
- `product-tour.css` owns material and geometry transitions. All colour roles
  resolve through tokens in `tokens.css`.

## Visual variants

**Minimal glass** uses a precise asymmetric-soft rectangle, a 1 px metallic rim,
a restrained top highlight and a small pointed tail. It is the closer fit to an
analytical product surface.

**Soft cloud glass** changes only the contour: gently uneven corners and a tiny
edge lift, supported by the same typography, controls and interaction states.
It is softer without becoming a cartoon cloud.

## Motion and interaction

- Spotlight and bubble geometry use one emphasized 300 ms transition.
- Text changes through a short opacity/4 px transition; the bubble itself never
  unmounts between steps.
- Auto mode advances every 2000 ms by default, shows a hairline countdown and
  pauses on bubble hover, target focus, manual navigation and a hidden page.
- The final auto step does not advance or loop.
- Escape, Arrow Left/Right and the imperative handle expose the same navigation
  paths.
- `prefers-reduced-motion` and Luc UI's `data-motion="reduced"` override remove
  transitions and smooth scrolling.

## Known limitations

- Shadow DOM targets need a resolver that is rooted in the shadow tree. The
  adapter accepts an element or resolver, so the integration is possible, but a
  selector does not cross a shadow root.
- A target that is visually covered by another overlay is measurable; the tour
  cannot prove the target is hit-testable without hiding its own spotlight.
- The demo verifies mobile layout at a narrow viewport, but native mobile Safari
  visual-viewport keyboard behaviour still needs a device pass.
- This is Stage 1. The public names and defaults are review candidates, not a
  promise for a released version.

**Status: DESIGN_REVIEW_REQUIRED**
