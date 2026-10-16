# LUC UI — interaction matrix

The canonical motion contract, component family by component family.

Every row answers the same six questions, so "is this component accidentally
static?" has an answer that can be checked rather than argued about:

| Column | Question |
| --- | --- |
| **Rest** | What does it look like when nothing is happening? |
| **Hover** | What changes under the pointer? |
| **Press** | What changes while held? |
| **Focus** | What changes for `:focus-visible`? |
| **Selected** | What changes when it is the active choice? |
| **Enter/Exit** | What happens when it appears, disappears or changes value? |
| **Intensity** | Which profile level it targets. |

Two rules apply to every row:

1. **Reduced motion resolves to `none`.** Anything described below as pointer or
   ambient behaviour is skipped, not slowed, and the state change is instant.
   Focus, selection and value changes are *never* animated away — they are
   semantics, not decoration.
2. **Focus is never replaced by motion.** Every interactive element keeps a
   visible `:focus-visible` treatment (`luc-focus` / `luc-focus-inset`).

---

## Controls

| Component | Rest | Hover | Press | Focus | Selected | Enter/Exit | Intensity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Button` | Surface + hairline, no glow | Lift, border step, brighter glow on `primary`; optional `magnetic` lean; optional `trail` beam | Spring compression (`luc-press`, `luc-press-spring`) | Focus ring | Loading swaps label for a spinner at constant width | Icon/leading slot fades; success state optional | functional → expressive |
| `IconButton` | Toolbar-quiet | Surface step, colour step, optional magnetic/beam | Spring compression | Focus ring | — (stateless) | Icon morph slot is stable-size | functional |
| `Link` | Text, underline transparent | Underline draws in, colour steps to accent | — | Focus ring | — | — | functional |
| `Switch` | Sunken track, neutral knob | Border warms to accent | Knob squishes horizontally | Focus ring | Accent track, knob at end, accent knob colour | Thumb springs between ends | functional |
| `Checkbox` | Hairline well | Border warms, surface lifts a step | — | Focus ring | Accent fill; tick draws via `stroke-dashoffset` | Tick draw | functional |
| `Radio` | Hairline ring | Border warms, surface lifts a step | — | Focus ring | Accent ring + inner dot scales in with 2% overshoot | Dot scale | functional |
| `Slider` | Quiet track, small thumb | Track fills further, thumb gains halo | Drag is live; value bubble appears | Focus ring on the thumb; bubble shows the value | — | Bubble fades in on hover/focus/drag, out on release | functional |
| `Input` / `Textarea` / `SearchInput` | Sunken shell | Border steps to strong | — | Border steps to accent + focus glow | — | Clear/validation affordances fade in | functional |
| `Select` / `Combobox` | Trigger + chevron | Trigger border step | Press compression | Focus ring | Menu item highlight glides | Menu fades/scale in from its trigger, out faster | functional |
| `Tabs` / `SegmentedControl` | Quiet track | Label brightens | — | Focus ring inset | One indicator glides and resizes (`--motion-normal`, `emphasized`) | Panel content fades in | expressive |
| `Badge` / `Tag` | Static | Static (non-interactive) | Static | Static | Tone carries meaning | Removable tag fades/scales out | none |
| `ClickBurst` | Invisible | — | Fires on pointer-down | — | — | 4–8 rays from the pointer, ~420ms | expressive |

## Surfaces

| Component | Rest | Hover | Press | Focus | Selected | Enter/Exit | Intensity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Card` | Hairline + small shadow | `interaction="interactive"`: 1px lift, border step, shadow step | `luc-press` compression | Focus ring (when interactive) | Accent border + tinted surface | — | functional → expressive |
| `Card interaction="featured"` | Accent hairline, deeper shadow + subtle glow | 2px lift, accent glow | Compression | Focus ring | — | — | expressive |
| `MotionSurface` | Raised surface | Lift scaled by intensity; optional pointer light | — | — | Accent ring + tint | — | expressive |
| `SpotlightSurface` | Calm surface | Interior light, optional lit border and texture | — | — | — | — | expressive |
| `Pressable` | Any element | Spring lift (+ optional scale) | Spring compression | — | — | — | expressive |
| `TiltSurface` | Flat card | 3D lean + glare following the pointer | — | Never tilts on focus (predictability) | — | Springs back to rest on leave | showcase |
| `GlareSurface` | Flat | Sheen across the surface | — | — | — | — | expressive |
| `BorderTrail` | Nothing (or a faint track) | `hover` variant fades the beam in | — | `focus-within` shows the beam | `active` variant runs continuously | — | expressive |
| `StatCard` | Label / value / delta | Optional lift + pointer light | — | Focus ring when interactive | Accent ring | Digit-level value roll; `DataChangeFlash` on change | expressive |
| `Metric` | Label + value + meta | — | — | — | — | Digits roll; `NumberTicker` | expressive |
| `DataChangeFlash` | Transparent | — | — | — | — | One 720ms semantic tint, only on a real change | functional |

## Overlays

| Component | Rest | Hover | Press | Focus | Selected | Enter/Exit | Intensity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Tooltip` | Hidden | Appears after 220ms | — | Appears on focus (Radix) | — | Direction-aware fade/scale in, faster out | functional |
| `Popover` | Hidden | — | — | Focus trapped while open | — | Scale/fade from the anchor (`--motion-normal`) | functional |
| `Dropdown` / `ContextMenu` | Hidden | Row highlight glides | — | Arrow-key highlight uses the same row treatment | `ItemIndicator` check/radio | Menu fades/scales in, out faster | functional |
| `Dialog` | Hidden | — | — | Focus trapped, restored on close | — | Scrim fade + panel fade/scale; closed panels unmount | functional |
| `MorphingDialog` | Hidden | — | — | Same Radix contract | — | Shared `layoutId` bridges trigger → panel | showcase |
| `MorphingPopover` | Hidden | — | — | Same Radix contract | — | Shared `layoutId` at popover scale | expressive |
| `Drawer` / `Sheet` | Hidden | — | — | Focus trapped | — | Spring slide from the anchored edge + scrim | expressive |
| `Command` | Hidden | Row highlight glides | — | Arrow keys move the highlight | — | Panel springs in; results crossfade | expressive |
| `Toast` | Hidden | — | Dismiss | Focusable dismiss | — | Spring in, stack re-flows, fade out | functional |

## Data and navigation

| Component | Rest | Hover | Press | Focus | Selected | Enter/Exit | Intensity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `DataTable` rows | Static | Row tint | — | Focus ring on the row | Selected row highlight | No per-row entrance cascade | functional |
| `DataTable` sort | Quiet sort glyph | Glyph brightens | — | Focus ring | Sorted column emits a brighter header + glyph rotation | Glyph rotates to its new direction | functional |
| `Pagination` | Quiet | Surface step | Compression | Focus ring | Current page marked | — | functional |
| `Sidebar` / Primary rail | Icons only when collapsed | Icon surface + colour step | — | Focus ring | Active item marked; labels reveal on expand | Labels fade in; panel width transitions | expressive |
| `PageTabs` | Quiet row | Label brightens | — | Focus ring | One underline glides and resizes | — | expressive |
| `Outline` | Quiet list | Label brightens | — | Focus ring | Active section emphasised by the scrollspy | — | functional |
| `Breadcrumbs` | Quiet | Link colour step | — | Focus ring | Current crumb is text | — | functional |
| `Search` | Field | Field border step | — | Focus glow | — | Results fade in as they arrive | functional |

## Charts

| Component | Rest | Hover | Focus | Selected | Enter/Exit | Intensity |
| --- | --- | --- | --- | --- | --- | --- |
| Line / area | Series + gradient area | Focused stroke thickens and glows; peers dim (one shared `blur` definition) | — | Legend toggles visibility | Intro draw (~520ms, scaled by point count); updates transition | expressive |
| Current point | Lit core on the latest real value | — | — | — | Ambient ripple **only** where chart motion allows; static dot otherwise | expressive |
| Scatter / bubble | Points at 0.85 opacity | Hovered point grows 1.6×, gains a solid halo and lit border | — | — | Points settle in; no per-point animation above the threshold | expressive |
| Heatmap | Matrix at full geometry | Hovered cell lights its edge, lifts with a glow, prints its value and emphasises its label | — | — | Cells fade in; geometry never moves | expressive |
| Bar / histogram | Bars from the baseline | Hovered bar emphasises | — | — | Bars grow on first paint; updates morph magnitude | expressive |
| Waterfall | Contribution bars | Hovered step emphasises | — | — | Bars enter in contribution order | expressive |
| Fan / range band | Layered quantile bands | Tooltip lists every quantile | — | — | Bands reveal outward from the median | expressive |
| Regime strip | Categorical intervals | Hovered interval brightens and labels itself | — | — | — | functional |
| Event markers | Quiet markers | Hover reveals the label | — | Selected marker emphasises | One-shot emphasis on first view where it matters | expressive |
| Fullscreen | Toolbar control | Control surface step | Focus ring; Escape closes | — | Shared geometry from the chart card into the fullscreen panel | showcase |
| Scale selector (`ScaleSelector`) | `Linear / Log` segmented track with one raised thumb, or nothing at all when the chart has a single valid mode | Hover steps the item's text colour | — | Focus ring per item (inset) | The selected mode is a filled thumb **and** `aria-checked`; the mode itself is never carried by colour alone | The thumb glides between items (~`--motion-normal`, emphasized easing); reduced motion snaps it | functional |
| Scale change | The chart's axis | — | — | — | ECharts re-maps the value axis; Lightweight Charts re-applies its price-scale mode. One short update transition; reduced motion switches instantly. Tooltip and crosshair values never change | functional |

## Atmosphere

| Component | Rest | Hover | Press | Focus | Selected | Enter/Exit | Intensity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `InteractiveGrid` | Low-contrast grid, optional slow drift | Nearby nodes light up along the pointer | — | — | — | — | expressive |
| `TextReveal` | Visible text (SSR-safe) | — | — | — | — | Blur/mask/word/char entrance on mount or on scroll | showcase |
| `ScrambleText` | Settled text | — | — | — | — | One decode pass, ~700ms | showcase |
| `Shimmer` / `ShimmerText` | Static gradient | — | — | — | — | One sweep, or a steady gradient | expressive |
