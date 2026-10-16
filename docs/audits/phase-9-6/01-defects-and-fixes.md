# Phase 9.6 — defects found, root causes, fixes

Four defects are fixed in this phase. Three of them were found by new
instruments rather than by reading code, which is the point of building the
instruments.

## 1. Mobile accessibility had no coverage, and two defects were hiding in it

**Symptom.** Every axe scan in the harness ran at a desktop viewport (dark and
light). The Phase 9.5 report carried a `target-size` finding marked "mobile
only" for exactly that reason: the rule is geometry, and geometry is what a
narrow viewport changes.

**Fix (instrument).** `apps/showcase/qa/mobile-a11y.mjs` scans the 90 routes
that already declare a mobile variant, at 390×844 and 768×1024, with
`--viewports` and `--all-viewports` for a wider matrix. It reports each node's
real box, its overflow metrics and the path to the element — a finding whose
selector is a class name is not reviewable without them. It is a worker pool of
two by default, because this host runs other things.

**What it found, immediately — 3 nodes, 2 root causes, none of them visible at
1440 px:**

### 1a. A hand-rolled scrollable `<pre>` (serious, 2 nodes)

`/foundations/personality` rendered `<pre className="overflow-x-auto">` around a
692 px snippet. At 390 px the region scrolls — and a region that scrolls and
cannot be reached from the keyboard is unreachable content
(`scrollable-region-focusable`).

The same hand-rolled pattern existed in three more places
(`components/studios/{motion,chart,composer}-studio.tsx`, one of which had
already been patched with a bare `tabIndex={0}` in Phase 9.5). All four now use
the library's own `Code block`, which is focusable *and* carries
`contain: inline-size` so the snippet scrolls inside its box instead of widening
its column.

### 1b. A 24 px inspector column (serious, 1 node)

`/patterns/research-workspace` rendered `<Workspace mode="panes">`. `Workspace`
already stacks its panes below 64rem; forcing the desktop mode defeated that. At
390 px the two horizontal panes could not honour their own minimum sizes inside
the viewport, so the inspector collapsed to a **24 px** column still holding
76 px of content — unreadable, and a keyboard trap as a bonus.

The fix is the removal of `mode="panes"`: ≥64rem the page is the resizable
workspace it was designed as, below it the panes stack. `WorkspaceResizeHandle`
already returns `null` outside panes mode, so the keyboard contract follows.

**Verification.** `node qa/mobile-a11y.mjs` → **180 scans, 0 findings**.

### The `target-size` finding from Phase 9.5 is closed

Reported as open: the `yyyy` segment of a date-range end date measuring 21.2 px
of clickable space at 390 px. Re-measured this phase at 390/768/1280/1440/1920:
**no `target-size` finding anywhere** — the Phase 9.5 change (`py-0.5` → `py-1`
on the segment, `size-5` → `size-6` on the `sm` trailing trigger) closed it. The
mobile matrix now proves that, and will fail if it reopens.

## 2. A numeric x axis that is not declared positional drew a diagonal

Found by the external consumer fixture (§`06`), not by any test in this
repository, because every chart in the Showcase either uses dates, string
categories, or declares `x: { type: "value" }`.

**Symptom.** A spec with numeric x values and no declared axis type produced a
chart whose marks sat at `(y, y)`: a clean straight diagonal with an axis scaled
to the value range. The line below is `close = [100, 104, 101, 109, 113, 111]`
plotted against `step = 1…6` — the picture on the left was the product, the one
on the right is the data:

```text
before                                  after
$114 ┤                    ╱             $114 ┤          ╱╲
$108 ┤              ╱                   $108 ┤        ╱   ╲
$102 ┤        ╱                          $102 ┤  ╱╲  ╱      ╲
 $99 ┤  ╱                                 $99 ┤╱   ╲╱
     └───────────────                     └───────────────
      0   40   80  120                      1  2  3  4  5  6
```

**Root cause.** Two decisions in `buildCartesianOption` disagreed.
`positionalX` decided that a numeric x which the caller did not declare
positional is an *ordering*, so the series carry plain values and the axis
carries the labels (`data: categoryLabels`). But the axis type was derived from
the inferred data kind instead:

```ts
type: xKind === "time" ? "time" : xKind === "category" ? "category" : "value",
```

A `value` axis ignores `axis.data`, and reads a plain number as a coordinate
pair. So the labels were discarded, the marks were plotted against themselves,
and the axis and the data described two different coordinate systems — silently,
with no error and a plausible-looking picture.

**Fix.** The axis type now follows the decision, not the kind:

```ts
const xAxisType: "time" | "category" | "value" =
  xKind === "time" ? "time" : categoryX && !swap ? "category" : "value";
```

`swap` keeps the value axis because a horizontal bar puts its categories on the
y plate instead of using a category x.

**Guard.** `charts/adapters/echarts/axis-pairing.test.ts` asserts the invariant
over six configurations covering every branch: **plain values against a labelled
axis, coordinate pairs against a positional one, never a mix**. It reads the
pairing from the built option, so it cannot pass by accident of shape. The
consumer fixture asserts the same thing from outside, through the DOM: the x
axis carries the caller's own values.

**Blast radius.** None in the Showcase — every page either uses dates, string
categories, or declares the axis. The change is visible only to a consumer that
relied on the broken path, for whom the previous behaviour was wrong.

## 3. Sheet: the reported Phase 9.5 defect and its follow-on

The Phase 9.5 fix (edge latching in `SheetRoot`/`SheetContent`) is confirmed
still correct in all four directions. What this phase found was in the *check*,
not the component: the loop selected `[data-slot="sheet"]` with `.first()` and
one run matched a leftover node from the previous direction's exit, measuring a
0×0 box and reporting a product defect that did not exist. Exactly the failure
mode Phase 9.5 recorded once before (a measurement error that looks like a
finding), so it is recorded again here.

The panel is now selected by the edge it claims (`[data-side="left"]`), the loop
starts from a measured "nothing is open", and every wait is a DOM condition
rather than a duration: `waitForFunction` on "no sheet in the DOM" replaces the
700 ms sleep, so an exit that finishes early passes and an exit that never
finishes fails — which the sleep could not distinguish.

## 4. Nothing else regressed

The new overlay lifecycle check (§`02`) covers Dialog, AlertDialog, Popover,
DropdownMenu and ContextMenu — earlier groups only asserted "it opened". All
five close cleanly: no residue, no backdrop, no body lock left behind, focus
back on the trigger.
