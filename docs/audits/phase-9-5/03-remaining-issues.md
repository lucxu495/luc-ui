# Phase 9.5 — what is still open

Everything here is known, measured and not fixed. Nothing in this file is a
guess about what "should" work.

## Accessibility

**`/date-time/date-range` — `target-size` (serious), 2 nodes, both pre-existing.**

| Node | Measured | Required |
| --- | --- | --- |
| the `yyyy` segment of the end date (`role="spinbutton"`) | 36 × 22 px, 21.2 px of safe clickable space | 24 × 24 px |
| the calendar trigger at `size="sm"` | 20 × 20 px | 24 × 24 px |

The trigger is `size-5` for `sm` and `size-6` for `md` in
`datetime/date-picker.tsx`; the segment's box is `px-1 py-0.5 text-label` in
`datetime/segments.tsx`. Raising either changes the density of every date and
time control in the library — the field's height, the segment spacing and the
date/time pages' visual rhythm — which is a component-design change with a wider
blast radius than this phase. The measurement above is the whole fix: `sm`
trigger to 24 px, segment padding to 3 px, then re-review `/date-time/*` and the
four patterns that embed a date control.

## Layout

**The `reading` and `compact` intents are used once and four times.** They exist
and are exercised, but the vocabulary is broader than the current tree needs. If
the Showcase grows pages that are genuinely prose-only, `reading` is the intent
to reach for; the five intents are documented in `DocPage`.

**`--layout-wide-max` only binds above ~2100 px.** At 1440 and 1920 the `docs`
and `wide` intents resolve to the same number, because the outline rail and the
gutter have already been subtracted by then. The distinction is real but its
effect is a 2560-class display.

## Interaction

**WebKit is still not tested.** Playwright's WebKit cannot launch on this host
for missing system libraries, unchanged from Phase 8. Every browser assertion in
this phase is Chromium. The 390 px viewport is a real viewport, not an emulated
device, so touch-specific behaviour (momentum scroll, visual viewport, the
soft keyboard) is not covered by anything here.

**Overlay coverage was extended to Sheet's four edges only.** Dialog, Drawer,
Popover, Tooltip, HoverCard and the three menus were checked against the same
shared primitive by reading the code — they all go through Radix's presence and
portal machinery and none of them derives an anchor prop from the state that
closes them — but only Sheet has a direction-by-direction geometry assertion.

## Verification

**There are no visual baselines for the new measure.** The Playwright baseline
suite (`pnpm qa:baseline`) compares against images captured under the old
widths; this phase reviewed screenshots by eye and did not re-freeze the
baseline set. Re-freezing is a deliberate, separate act: it should be done after
the height/density question above is settled, not before.
