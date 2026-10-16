# Phase 9.6 — what is still open

Nothing here is hidden elsewhere, and nothing here is claimed as done.

## Verification gaps

1. **WebKit and Firefox are not covered.** Playwright's WebKit cannot launch on
   this host for missing system libraries (unchanged since Phase 8);
   `qa/browsers.mjs` exists and runs Firefox, but this phase's gates are
   Chromium-only by decision, not by accident. A cross-engine run is the largest
   remaining hole in the browser evidence.
2. **390×844 is a viewport, not a device.** No touch momentum, no visual
   viewport behaviour, no soft keyboard.
3. **Visual baselines are stale.** `pnpm qa:baseline` was not re-run; the
   Playwright image baselines still describe the Phase 9.5 widths. They were
   left stale on purpose — re-freezing them is a reviewed act, and the phase that
   changes widths is the phase that should do it with the images in front of
   someone. The screenshots from `qa:full` are the current visual record.
4. **The PDF was never opened.** The capture fixture proves the charts are in
   the file (93 KB vs 33 KB with them hidden) and that the SVG chart emits real
   vector paths; it does not prove the printed page *looks* right.
5. **`qa:providers` (live TradingView) was not run** in this phase.

## Product gaps stated as facts

6. **The source registry has four items.** It is a verified proof of concept,
   and `05-source-registry.md` says what it would take to grow it: one component
   at a time, with a browser check per item. Nothing claims the library is
   installable as source.
7. **No licence, no version policy decision, no npm scope.** All three are
   product decisions, listed in `04-release-readiness.md` §3 with the trade-off
   each one carries. `@luc/ui` still declares `"license": "UNLICENSED"`, which is
   correct for a private package and blocks publication.
8. **No `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` or
   CI workflow exists.** They belong to the extraction commit, and creating a
   licence file is not an engineering decision.
9. **Lightweight Charts has no vector path.** A financial chart is raster at any
   renderer setting, and `docs/STATIC_RENDERING.md` says so rather than letting a
   host discover it in a PDF.
10. **No component declares a static fallback.** A chart still needs a client
    bundle; LUC UI does not promise that any component renders without one.

## Cost recorded, not hidden

11. **The DOM-free theme tables cost ~0.5 KB raw** in `charts-financial`
    (43.5 → 44.0 KB) and `financial-engine` (33.8 → 34.1 KB), both inside the
    8 % budget and after the first implementation — which was 3.9 KB and would
    have failed it — was split so that only the dark table travels with
    interactive charts. A `@luc/ui/charts/static` subpath would remove the
    remaining half. `button-only` is unchanged at 10.9 KB raw / 3.6 KB gzip.
12. **`chartThemeFromTokens` takes a `fallback` parameter** with a positional
    third argument. It is new in this phase, so nothing depends on the shape yet;
    if it grows further it should become an options object.

## Not a defect, recorded so nobody re-reports it

13. **Tooltip and HoverCard have no dismissal lifecycle** and are therefore not
    in the overlay geometry check. Their open behaviour is asserted in the
    `primitives` behaviour group.
14. **The `reading` and `compact` layout intents** (Phase 9.5) are still broader
    than current usage. Unchanged, and still documented in `DocPage`.
