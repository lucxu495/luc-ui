# Phase 9.6 — external consumer capture (workstream D)

```
node apps/showcase/scripts/consumer-capture.mjs

consumer-capture · PASS · luc-ui-<hash>.tgz
  SSR shell, hydration, vector paths=16 (16 with geometry, 1016px box),
  raster 43895/1300480 px painted across 64 colours
  reduced motion settled (transform none); PNG 2160×2400 160KB;
  PDF 93KB with charts vs 33KB without
  artifacts → ../../artifacts/consumer-capture
  timings  install 15224ms · ssr-build 696ms · ssr-run 1988ms ·
           client-build 2443ms · css 934ms
```

## What makes it independent

| Property | How it is enforced |
| --- | --- |
| Not in the workspace | the fixture is a `mkdtemp` directory under the system temp dir |
| Not the repository's resolver | installed with **npm**, not pnpm |
| Not the repository's toolchain | built by the fixture's own Vite, Tailwind and `node` |
| Not the repository's imports | only `@luc/ui`, `@luc/ui/charts`, `@luc/ui/data-table`, `@luc/ui/motion` — no `src/`, no Showcase file |
| Not a stale build | `pnpm build:package` runs first, because `ensurePack` caches the tarball by hashing `dist/` — a stale `dist` would produce a cached tarball that passes every check and tests the previous release |
| Not the old types | the installed manifest is asserted to point at `./dist/…`, not at `./src/…` |

The browser is launched from this workspace only because that is where the
Playwright download lives. Nothing from the workspace is bundled into the page.

## The component families it covers

The brief asks for a basic component, a professional chart, a data card, a
motion component, SSR, hydration, fixed-size capture, PNG and PDF:

| Requirement | In the fixture |
| --- | --- |
| Basic React component | `Heading`, `Text`, `Card`, `Button` styling through the compiled stylesheet |
| Professional chart | `Chart` with a line spec, once with `renderer: "svg"` and once with the default canvas |
| Data card / table | three `Metric` cards with `MetricValue`, plus a `DataTable` with three rows |
| Motion component, static-compatible | `Reveal immediate` under `reducedMotion: "reduce"` |
| SSR | a real `vite build --ssr` of a real consumer entry, then `renderToStaticMarkup` |
| Hydration | `hydrateRoot` for the shell, `createRoot` for the visual, with readiness reported from an effect |
| Fixed-size capture | a 1080 px page captured at `deviceScaleFactor: 2` |
| PNG | element screenshot, IHDR-verified dimensions, byte size floor |
| PDF | `page.pdf()` twice — with the charts and with them hidden |

## What each assertion proves, and what it does not

* **Vector output** is proved from the DOM: the SVG chart contains an `<svg>`
  with 16 `<path>` elements carrying geometry and **no** `<canvas>`. It is not
  proved that the PDF *contains* vector operators — the PDF is compressed, and
  asserting on its internals would be asserting on a decompressor.
* **The chart is in the PDF** is proved comparatively: hiding `#charts` and
  re-printing shrinks the file from 93 KB to 33 KB. A host that silently dropped
  the visual would produce two files of the same size.
* **Non-blank raster** is proved from the canvas in the page (43 895 painted
  pixels, 64 distinct colours in the sampled set), not from the PNG's size. A
  large PNG proves nothing.
* **The x axis is the data's own** is asserted against the axis labels, because
  that is how the defect in §`01` was visible from outside: the broken build
  labelled the axis 0…120 while the data was 1…6.

## What the fixture found

One defect, described in `01-defects-and-fixes.md` §2: a numeric x that was not
declared positional produced a `value` axis with plain series values, so the
engine plotted each point at `(y, y)` — a straight diagonal. Neither the 907
unit tests, the 152 browser checks, the 76-route chart sweep nor the axe scans
could see it, because every chart in the Showcase uses dates, string categories,
or declares the axis type. It took a consumer that wrote a spec the way the
public API documents it.

## Limits of this fixture

* It is a **single page**. It proves the contract works for the families listed
  above; it is not a survey of all 76 chart types.
* It captures **one density**. `deviceScaleFactor: 2` is what a print pipeline
  wants; nothing here proves behaviour at 1× or 3×.
* The PDF assertions are **structural and comparative**, not a pixel diff of the
  rendered page. Nobody has opened the PDF and compared it to the screen.
* It exercises Chromium only, for the reason in `03-verification.md`.
