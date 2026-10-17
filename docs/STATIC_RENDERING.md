# Static rendering and capture

Luc UI is an interactive React library. It is also the optional visual layer of
`luc-render`, which turns a document into a PNG, a WebP or a PDF — and those two
roles want different things from the same component. This is the contract
between them.

It is written for whoever writes that capture host. Everything here is a public
prop or a public export; there is no capture-only mode and no renderer
dependency inside Luc UI.

## 1. The three things a capture changes

A chart read on a screen and a chart captured into a file differ in three
places, and all three have a default that is right for the screen and wrong for
the file.

| Concern | Interactive default | Capture | Why |
| --- | --- | --- | --- |
| Animation | `standard` intro, per family | `animation: "none"` | the shutter must not open mid-intro |
| Engine creation | deferred until the box approaches the viewport | `eager` | a capture pass has no viewport; page 7 is always "off screen" |
| Drawing layer | `renderer: "canvas"` | `renderer: "svg"` | vector output stays sharp at any density and survives a PDF |

In code:

```tsx
import { Chart, staticChartSpec, CHART_STATIC_CAPTURE } from "@luc/ui/charts";

<Chart spec={staticChartSpec(spec)} height={360} eager onReady={settle} />;
```

`staticChartSpec` changes only those properties — it never drops a title, a
legend, a unit or an annotation, because a capture that silently loses the unit
label is a prettier, less true chart. `CHART_STATIC_CAPTURE` exposes the same
three values as data for a host that builds its own props.

## 2. Readiness

There is exactly one readiness signal: the `onReady` callback of `Chart` /
`ChartSurface`. It fires after the engine has applied its option, so it is safe
to capture once it has fired **and** a paint has been produced — wait two
animation frames, which is what the consumer fixture in
`apps/showcase/scripts/consumer-capture.mjs` does.

Do not wait on a duration. Do not read the DOM for a canvas: a chart in
`loading`, `empty` or `error` state never creates an engine at all, and treating
"there is a canvas" as "the chart is ready" captures a skeleton.

## 3. Motion

Two switches, and they compose:

* `prefers-reduced-motion: reduce` — honoured by `useChartMotion`, which
  renders the final frame immediately rather than slowing the animation down.
  Set this on the capture browser context; it is the library-wide contract and
  it applies to every motion component, not just charts.
* `spec.animation: "none"` — a per-chart switch that does not depend on the
  host's environment.

A capture host should set both. Either one alone is sufficient for charts;
reduced motion is the one that also settles `Reveal`, `NumberTicker` and the
rest of `@luc/ui/motion`.

## 4. Vector or raster

`renderer: "svg"` registers zrender's SVG painter on demand and paints the same
option into real `<svg>` elements. Verified in
`apps/showcase/scripts/consumer-capture.mjs`: a line chart emits 16 `<path>`
elements carrying real geometry, and the raster path paints ~38 000 pixels
across 64 distinct colours in the same box.

What this does **not** change:

* **The data, the axes, the formats and the units are identical.** The renderer
  chooses how marks are drawn, never what they mean.
* **Lightweight Charts is canvas-only.** A financial chart keeps its raster
  engine even when the spec asks for `svg`; a host that needs vector output for
  a candlestick series has to choose a different engine, and should say so
  rather than silently shipping a rasterised page.
* **Some families are raster by nature.** A 3D surface is a WebGL surface; it
  has no vector form at any renderer setting.

Cost: the SVG painter is a second drawing layer, so it is registered lazily —
interactive consumers never download it.

## 5. Themes without a DOM

A server-side render has no `getComputedStyle`. `resolveChartTheme()` reads the
token layer from the document when there is one, and returns the mode's default
when there is not; `chartThemeFromTokens` is the function both paths share, and
`chartThemeFallback("light" | "dark")` is the DOM-free entry point.

```ts
import { chartThemeFallback, CHART_THEME_TOKEN_NAMES } from "@luc/ui/charts";

const theme = chartThemeFallback("light");
```

Two honest limits:

* The table describes the **default palette**. A `data-palette` attribute or a
  personality overrides the accent and everything derived from it, and those
  values only exist in CSS. A capture host that knows its theme should supply
  them: `chartThemeFromTokens((token) => myResolvedTokens[token], mode)` with
  the names in `CHART_THEME_TOKEN_NAMES`.
* The values are a **verified copy** of `tokens/tokens.css`.
  `charts/core/theme-tokens.test.ts` parses that stylesheet and fails if any
  value drifts, so the copy cannot rot quietly.

## 6. Dimensions

`height` accepts a number (pixels) or a CSS length. For a fixed-size capture,
pass a number and give the container that size — a chart never guesses its box,
and a capture does not want it to. Charts that grow with their data
(`matrixHeight`, `horizontalBarHeight`) return numbers from pure functions, so a
server can reserve the same box the client will paint into.

Capture at `deviceScaleFactor ≥ 2` for a raster target: a canvas is painted at
the device pixel ratio, and a `1x` canvas stretched to print resolution is
visibly soft.

## 7. Fonts and images are the host's job

Luc UI resolves `--font-sans` and `--font-mono` from the document. A capture
that has not loaded the fonts it declares measures and paints different text
than the browser would; wait for `document.fonts.ready` before capturing.
Images referenced by a document model are the host's to materialise — Luc UI
never fetches anything.

## 8. What is not covered

* **Tooltips and overlays.** A tooltip is an HTML overlay positioned against a
  pointer; there is no pointer during a capture, so there is nothing to capture.
  If a document needs a value called out, that is an annotation, and
  annotations are part of the chart.
* **A declared static fallback per component.** A chart still needs a client
  bundle to hydrate. `luc-render` ships its own dependency-free SVG fallback for
  the no-JavaScript path; Luc UI does not promise that every component can
  render without one, and a component that measures the DOM at mount time will
  need its own static path before it can be used print-only.
