# Showcase deployment — Phase 4

**Date:** 2026-10-09 02:24 SGT (2026-10-08 18:24 UTC)
**Scope:** the LUC UI Showcase only. No other service was touched.

---

## 1. What is running

| Fact | Value |
| --- | --- |
| Compose project / service | `luc-ui` / `showcase` |
| Container | `luc-ui-showcase` — **healthy** |
| Endpoint | `127.0.0.1:3000` (loopback only, reached through the existing SSH forward) |
| Image tag | `luc-ui/showcase:1.0.0` |
| New image id | `sha256:ddd6cb73c3442d4b843cfb7751e0e262f63a5cc53a68c492958f1c87f2552b31` |
| Image size | 412 MB (76.9 MB compressed) |
| Container started | 2026-10-08T18:24:34Z = **2026-10-09 02:24:34 SGT** |
| Built from | the **working tree** (nothing was committed; see §4) |

## 2. Rollback

| Tag | Image id | What it is |
| --- | --- | --- |
| `luc-ui/showcase:rollback-20261008-pre-phase-4` | `4def6689c753` | The Phase 3 image that was live before this cycle |
| `luc-ui/showcase:rollback-20261008-pre-visual-transform` | `ab730c093218` | The pre-Phase-2 image |
| `luc-ui/showcase:rollback-20261008-pre-phase-2` | `f7ccb0b9a70c` | The Phase 1 closure image |

Rollback is one command, and it does not rebuild:

```bash
cd luc-ui
docker tag luc-ui/showcase:rollback-20261008-pre-phase-4 luc-ui/showcase:1.0.0
docker compose up -d
```

## 3. Verification performed on the deployed artifact

Everything below ran against the container on `127.0.0.1:3000`, not against a
host build.

| Check | Command | Result |
| --- | --- | --- |
| Full route sweep + behaviour + axe | `pnpm qa:full` | 120 routes · 358 screenshots · behaviour **81/81** · **185 axe scans, 0 violations** · 0 console errors · 0 page errors · **no problems** |
| Live TradingView providers | `pnpm qa:providers` | 6/6 behaviour · 147 widgets ready · 14 axe scans, 0 violations · no problems |
| Visual baselines | `pnpm qa:baseline` | 15/15 pass (regenerated for the new design) |
| Health | `docker ps` / `curl` | container healthy, `/` → 200 |

Route-level spot checks on the deployed image: `/`, `/foundations/spatial`,
`/components/{accordion,toggle,avatar,pagination,alert-dialog,timeline,carousel,field-parts}`,
`/charts/{statistical,scientific,workflow,quantitative,multidimensional,catalog}` —
all 200, all hydrating, no console output.

### 3.1 Defects the deployed sweep caught (and that were fixed)

These are the reason the sweep runs against a real container rather than a
storybook:

1. **Two chart pages returned HTTP 500.** A contour fixture read
   `rings[rings.length - 1]` before checking that a ring existed. Fixture code
   runs at *module evaluation*, so the bug took down the whole route rather than
   one panel. Fixed, and the rule is now in the Skill: guard every index in a
   fixture.
2. **A nested-interactive violation and a hydration failure** on the Accordion
   page: a `SegmentedControl` had been placed inside a disclosure *trigger*. A
   button inside a button is invalid HTML, the browser's parser un-nests it, and
   the server HTML then disagrees with the client tree. The `aside` slot is now
   documented as non-interactive by contract.
3. **Carousel dots were 8px targets** (axe `target-size`, serious). The visible
   dot is still 8px; the *target* is now 24px.
4. **ScrollArea's viewport was not focusable** (axe `scrollable-region-focusable`,
   serious). It now takes a tab stop, like the carousel track.
5. **`HierarchyTreeChart` crashed the engine** (`Cannot read properties of null`)
   because `orient` and `symbol` were given readable words (`"left-right"`,
   `"emptyCircle"`) instead of ECharts' enums (`"LR"`, `"circle"`).
6. **Three charts rendered blank** — Ternary, Contour and Vector field. The first
   two drew data-unit coordinates into a `custom` series, which paints in
   *pixels*; the third used the `lines` series for a quiver plot and the engine
   drew only a fraction of the arrows. All three now use `api.coord`, and the
   vector field is a `custom` series with a constant head size.

Only the screenshot review could have found 6 — the tests, the axe scan and the
behaviour suite were all green while those charts were empty.

## 4. Working tree

Nothing was committed or pushed. 170 paths under `luc-ui/**` are modified or new
relative to `fce36146` (the Phase 3 commit), and the image was built from that
working tree, not from `HEAD`.

Unrelated, pre-existing dirty files under `luc-api/**` and `luc-web/**` belong to
another agent and were not touched, built into the image, or reverted.
