# Product Tour — Stage 1 Design Review

**STATUS: DESIGN_REVIEW_REQUIRED**

## Summary

Stage 1 adds a standalone `ProductTour` prototype without changing the released
`GuidedTour` API. The showcase at `/components/product-tour` is a live product
surface with manual, auto, nested-scroll, viewport-edge, missing-target recovery,
light/dark, desktop/mobile and reduced-motion scenarios.

## Engine selection

Luc UI uses a React-free positioning adapter rather than Driver.js or Floating UI.
The measured viewport model handles fixed, sticky and nested-scroll targets and
adds no tour dependency. Driver.js contributes a complete lifecycle but carries
an opinionated visual layer; Floating UI contributes collision math but still
requires this module's spotlight, bubble, recovery and lifecycle.

## Architecture

- `product-tour.tsx`: status, lifecycle, focus, keyboard, pause policy and callbacks.
- `engine.ts`: target resolution, viewport measurement, flip/shift and reveal.
- `spotlight.tsx`: four scrim plates plus a decorative live-target ring.
- `bubble.tsx`: SVG contour, tail, controls, progress and countdown.
- `product-tour.css`: material and motion; token roles live in `tokens.css`.

The public entry is `@luc/ui/product-tour` and the implementation is also exported
from `@luc/ui`.

## Variants

**Minimal glass** uses a geometric rounded contour, restrained glass, a metallic
edge highlight and a precise tail. It is the recommended default for Luc UI:
it stays quiet over analytical products and maintains the strongest resemblance
to the existing surface language.

**Soft cloud glass** introduces a gently asymmetric contour with slightly uneven
corner curvature and a lighter floating feel. Its advantage is a warmer first-run
welcome without changing controls, focus, placement or text readability.

## Motion and spotlight

The page scrim, spotlight geometry and bubble enter/exit together. Step changes
move the spotlight and bubble on the emphasized curve while the bubble stays
mounted and swaps only its copy. Auto mode uses a 2-second hairline countdown,
pauses on hover, target focus, manual navigation and hidden pages, and stops at
the final step. Reduced motion clamps both CSS transitions and smooth scrolling.

The spotlight is built from four scrim plates so the target remains
pointer-interactive. A portal avoids page stacking and overflow contexts.

## Visual evidence

- [Desktop dark, Soft Cloud](./desktop-dark-cloud.png)
- [Desktop light, Soft Cloud](./desktop-light-cloud.png)
- [Desktop light, Minimal Glass](./desktop-light-minimal.png)
- [Mobile dark, Soft Cloud](./mobile-cloud.png)

## Validation

- `pnpm --filter @luc/ui test`: 102 files, 1,017 tests passed.
- `pnpm --filter @luc/showcase qa:product-tour`: all five browser scenarios pass.
- `pnpm --filter @luc/ui build:package`: package build passes.
- `pnpm --filter @luc/ui verify:package`: export map and tarball pass.
- `pnpm --filter @luc/ui verify:types`: ESM and bundler resolution pass.
- `pnpm --filter @luc/showcase docs:registry:check`: generated docs are current.
- Desktop and mobile axe passes found no Product Tour violations. One existing
  Showcase desktop landmark warning remains outside this module.

## Known limitations

- Cross-shadow-root selectors require an element/resolver target.
- Occlusion by a third-party overlay is not detected.
- The mobile browser matrix needs a native iOS Safari device pass in Stage 2.
- Public API names and defaults remain Stage 1 review candidates.
