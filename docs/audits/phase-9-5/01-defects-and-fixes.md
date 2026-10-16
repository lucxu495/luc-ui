# Phase 9.5 — the four reported defects

Each defect below is stated as it was reported, then as it was reproduced, then
as it was fixed. Nothing here was fixed from the description alone.

## 1. "Pages use almost none of the width"

**Reproduced.** `qa/probe-95.mjs width` measured the content column and the demo
stage at six widths. `/charts/line-chart` used 1216 px of a 1654 px content
column at 1920 and 1216 px of 2294 px at 2560; `/experiences/personal/career`
used 704 px of 1654 px.

**Cause.** Three caps stacked, described in `00-architecture-and-coordination.md`.

**Fix.** Layout intents owned by `DocPage`; the route-group layout stopped
capping; the rail stopped reserving a track when it renders nothing; the
experiences stopped wrapping a whole website in a 44 rem prose measure.

**Verified.** `qa/geometry.mjs` asserts the numbers: `/charts/line-chart` at
1920 must be ≥1500 px with a ≥1200 px demo, at 2560 ≥1800 px, at 1440 a ≥860 px
demo, and `/components/badges` at 1920 must stay ≤1000 px because a page whose
subject is a 20 px control should be composed rather than stretched. The check
reports `line-chart 1920: container 1654 / main 1654; line-chart 2560: container
1920; line-chart 1440: demo 902; badges 1920: container 896`.

## 2. "The Navigation page is cramped and its text wraps unnaturally"

**Reproduced.** A screenshot at 1440 showed the demo split 50/50, so the code
card was 530 px wide. The snippet's aligned trailing comments (`// true`,
`// false, segment boundary`) wrapped in the middle, and the right-hand card was
stretched to the height of the 19 rem tree beside it, leaving two thirds of it
empty.

**Cause.** Three separate things, none of them the code block:

1. an equal split, which gives a 352 px tree and a 770 px snippet the same track;
2. a `Code block` that wrapped rather than scrolled, so a line could not simply
   be read;
3. a fixed `h-[19rem]` demo frame that was smaller than its content on a wide
   screen and larger than it on a narrow one.

**Fix.**

* the grid is `minmax(0,22rem) / minmax(0,1fr)` with `items-start`, so the code
  gets what is left and the shorter card is not stretched;
* `Code block` preserves its lines and scrolls horizontally, and is a tab stop
  because of it (see §5);
* the demo frame is `max-h-[28rem]`, so its height follows its content;
* the snippet itself is written in ≤60-character lines, because a comment that
  lands on a different line from the statement it explains teaches the wrong
  thing at a glance.

**Verified.** `qa/geometry.mjs` asserts the columns are not equal and that
nothing spills out of the page container, and reports `columns 352 / 530; tree
382/382; spills=none`.

## 3. "Changing a Motion Playground control makes the page jump"

**Reproduced — and the first reproduction was wrong.** The first version of the
check clicked the controls through a locator, and Playwright scrolls an element
into view before clicking it. It reported a 1702 px jump that was entirely the
test's own doing. The measurement was rewritten to click by coordinate and to
measure the *document* position of the controls panel rather than its viewport
position, so a legitimate scroll cannot be mistaken for a reflow.

**Cause.** Two independent ones:

1. A document whose height crosses the viewport threshold gains or loses the
   classic overlay scrollbar, which moves every centred element by its width.
   Interacting with a preview is exactly the kind of change that crosses the
   threshold in either direction.
2. A motion effect that scales, tilts or throws a layer sideways paints outside
   its stage. Nothing clipped it, so the overflow became the *document's*
   scrollable area and the page could be dragged sideways.

**Fix.**

* `scrollbar-gutter: stable` on `html`, so the gutter is reserved permanently
  and the class of defect cannot occur rather than being chased per page;
* both Playground stages are `overflow-clip` with
  `overflow-clip-margin: 2rem`, so a transform stays inside its room while the
  focus ring and a modest glow survive at the edge. `overflow: clip` rather than
  `hidden` on purpose: it does not create a scroll container, so there is no
  scroll position to reset and no second scrollbar to explain;
* a `min-h` floor on the stage, so a control that legitimately makes the preview
  taller does not yank the page below it.

Overlays are unaffected: LUC's popovers, dropdowns and dialogs render into a
portal at the document root and were never inside the stage to begin with.

**Verified.** The check drives every slider and toggle on `/motion/kinetic`,
asserts the preview text actually follows a text control, and reports `worst
movement 0px, 0 overflowed step(s), preview text followed the control; 3
control(s) driven`.

## 4. "Top and Left sheets stay visible and slide away from the wrong place"

**Reproduced, and this one is a real component defect.** Sampling the exit
animation rather than the end state showed it immediately:

| Direction | Animation actually running on exit |
| --- | --- |
| top | `luc-sheet-out-bottom` |
| right | `luc-sheet-out-right` |
| bottom | `luc-sheet-out-bottom` |
| left | `luc-sheet-out-bottom` |

**Cause.** `SheetContent` anchored itself to whatever `side` it was *given*, and
the demo derives that prop from the state that closes the panel
(`side={open ? "left" : "top"}`, falling through to `"bottom"`). The instant the
panel started to close, the prop flipped to its fallback, so a 320 × 900 left
drawer became a full-width 1430 × 352 bottom sheet and slid away downwards. Top
and left were affected; bottom was not, because the fallback *is* bottom, and
right was not, because its side was a constant.

This is why "it eventually leaves the DOM" was never a sufficient test — the
geometry has to be sampled *during* the exit, and the panel has to still be the
same box on the same edge.

**Fix, in two places, because both were wrong.**

* **Library.** `SheetRoot` (previously a straight re-export of Radix's root)
  mirrors the open state — controlled and uncontrolled — into a context
  `SheetContent` reads, and `SheetContent` latches the edge and the size: a
  change is adopted while the panel is open or fully closed and ignored for the
  one render that matters. A caller can now write
  `side={open ? "left" : "right"}` and get a correct dismiss.
* **Showcase.** The Sheet page keeps the edge in its own state instead of
  deriving it from `open`, which is the pattern the page should be teaching.

**Verified.** `qa/geometry.mjs` opens all four edges, waits for each panel to
come to rest, presses Escape, samples 80 ms into the exit, and asserts the
animation name, the `data-side`, that the box is unchanged, that the panel is
still on its edge, and that no panel, overlay or scroll lock survives.

## 5. What the `Code` change cost, and what it fixed

Making `Code block` scroll instead of wrap fixed §2 and introduced a new
overflow: a block-level scroller still reports its widest line as its
*min-content* contribution, so inside an auto-sized grid track it stretched the
parent instead of scrolling inside it. `qa/geometry.mjs` caught it as
`/application/navigation @390×844 (+106px)`, the page was measured, and the
cause was confirmed by walking the ancestor chain.

The fix is `contain: inline-size` on the code element: its width becomes
independent of its contents, which is the contract a scroll region should have
in the first place. The per-page `grid-cols-[minmax(0,1fr)]` was kept as well,
because a grid track that sizes itself from its contents is a defect waiting for
its next long line.

## 6. Three pre-existing accessibility defects

The run before this phase reported five serious axe violations, not the zero the
Phase 9 report claimed — the same five are present verbatim in the committed
`artifacts/reports/full.json`. Three of them were cheap and correct to fix:

| Finding | Cause | Fix |
| --- | --- | --- |
| `application-shell{,-light}` · `scrollable-region-focusable` | the status bar's labels wrapped onto a second line and were clipped by the height they may not exceed, which made the bar scroll on the vertical axis — a real 4 px of cut-off text, not a false positive | `whitespace-nowrap` on the bar, plus the tab stop and `role="region"` it needs once it scrolls horizontally |
| `studios-composer` · `scrollable-region-focusable` | a `<pre>` that scrolls and cannot be reached from the keyboard | `tabIndex={0}` |
| `carousel.tsx` lint warning | an `eslint-disable` that became unnecessary once `region` joined the rule's allowlist | directive removed |

The status bar fix is worth its own note: the `no-noninteractive-tabindex` rule
and `scrollable-region-focusable` are in direct conflict for a scrollable strip
with no interactive child. The repository had already chosen the tab stop three
times (the carousel track, `DataTable`, the code block) and paid for it with a
per-file disable each time; `region` is now named in the shared ESLint config
instead, so the pattern is correct by default rather than by exception.

Two `target-size` violations remain on `/date-time/date-range`: the date
segment's `yyyy` spinbutton measures 36 × 22, and the calendar trigger measures
20 × 20 at `size="sm"`, both against the 24 × 24 WCAG 2.2 AA minimum. They are
unchanged by this phase and are recorded as such — see
`03-remaining-issues.md`.
