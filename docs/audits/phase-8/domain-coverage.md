# Phase 8 — domain coverage matrix and capability gap ledger

Date: 2026-10-09 (Asia/Singapore). Working tree only; nothing committed.

This is the ledger the brief asked for: one row per advertised experience, what
it is built from, what the public API could *not* do, and what happened as a
result. It is written to be checked rather than admired — every "verified"
column names the browser assertion that produced it.

## 1. Domain coverage

| Experience | Journey (what the browser test drives) | Public components used | Gap found while composing | Outcome | Mobile | Bilingual | Visual review |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Marketing site | billing period → price; FAQ open; form empty → malformed → valid | Button, Card, Badge, Progress, Accordion, Field, Input, NativeSelect, Callout, Rating | `Button` has no polymorphic `asChild`, so a link-styled button needs `buttonVariants()` | Recipe documented in `EXPERIENCE_GUIDE.md` (not a component) | yes | yes | yes |
| SaaS console | role filter → search empty state → clear → invite adds a row | DataTable, StatusBadge, SearchInput, NativeSelect, Dialog, Sheet, Switch, NotificationCenter, EmptyState, Tabs, Toast | `DataTable` bulk-empty needs an `emptyState` node, not a string | Used `emptyState={<EmptyState …/>}`; documented | yes | yes | yes |
| Publishing platform | topic filter → open article → related → back | SearchInput, Tag, Badge, Avatar, Button, IconButton, EmptyState, Separator, Toast | Clipboard can be blocked; a bare `navigator.clipboard.writeText` fails silently | The page reports the refusal in a toast, and the check tolerates it | yes | yes | yes |
| Community product | two-word post refused → real post → reaction → delete confirmed/cancelled | Card, Avatar, Textarea, Field, Button, DropdownMenu, AlertDialog, Badge, Toast | — (the AlertDialog contract already covers this) | — | yes | yes | yes |
| Career profile | open/close a project; print action | ProfileHero, SocialLinks, ExperienceTimeline, ProjectShowcase, Badge, Button, Separator | A "Download CV" promise with no bundled file is a lie | The action prints the page and says so | yes | yes | yes |
| Academic profile | year facet → topic facet → restore, watching the live count | ProfileHero, PublicationList, SocialLinks, Timeline, Badge, Card | — | — | yes | yes | yes |
| Creative portfolio | pointer parallax; gallery viewer + arrow key + Escape | ParallaxScene, KineticHeadline, Marquee, TiltSurface, ProjectShowcase, ImageGallery, Lightbox, Card | No bundled imagery, so covers are inline SVG data URIs with real `alt` and dimensions | `placeholder-art.ts`, documented in the report | yes | yes | yes |
| Journal & garden | kind filter → topic chips → impossible combination → way out | NowSection, ReadingShelf, SegmentedControl, SearchInput, Tag, Badge, Card | A `/now` block with no date is a claim about the present that may be years old | `NowSection` requires `updatedAt` and renders a `<time>` | yes | yes | yes |
| AI workspace | stream a prepared answer → stop → off-script fallback | MessageList, ChatMessage, StreamingText, ToolCallTimeline, AgentActivity, PromptComposer, NativeSelect | A mount effect that stores a `streaming` flag cascades renders | Streaming derived from the arrived text (Phase 7 pattern, reused) | yes | yes | yes |
| Research bench | bin slider → histogram rebuilds; figure switch | Slider, SegmentedControl, HistogramChart, ScatterRegressionChart, ContourChart, DataTable, Card | `ContourChart` takes prepared iso rings, and `ScatterRegressionChart` takes a prepared fit | The page computes both *as the analysis layer*, and says so | yes | yes | yes |
| Quant desk | range control → three figures; row → inspector | SegmentedControl, CandlestickChart, DrawdownChart, FactorExposureChart, DataTable, Badge, Card | Month-granularity duplicate time ticks (Phase 7 known issue) | **Fixed at the root** — see §2 | yes | yes | yes |
| Commerce flow | variant → price/stock; three-step checkout forwards and back | RadioGroup, NativeSelect, Stepper, Rating, Badge, Card, Field, Button, Toast | — | — | yes | yes | yes |
| Learning module | mark a lesson → progress; answer → score → explanations | Progress, RadioGroup, Radio, Callout, Badge, Card, Button | — | — | yes | yes | yes |
| Creator studio | edit metadata → switch asset → return; reorder the reel | ImageGallery, SortableList, Rating, Textarea, Field, Card, Badge, Toast | `SortableList` wants a `label`/`description` pair, so a metadata editor needs its own form | Kept as a recipe (a MetadataPanel would have been app-specific) | yes | yes | yes |
| Productivity board | keyboard move + announcement; bulk selection | KanbanBoard, Checkbox, Progress, Badge, Button, Card, Toast | `KanbanBoard` reports a move, not a list; the page must own the placement map | Documented in the guide | yes | yes | yes |
| Discussion forum | open thread → reply → report → cancel | Card, Avatar, Textarea, Field, Button, AlertDialog, Badge, Timeline, Toast | — | — | yes | yes | yes |

## 2. Capability gaps: closed, and how

### P0 — broken behaviour or accessibility found through composition

None. The Phase 7 repairs (dialog focus restoration, `luc-hit` targets,
read-only field styling) held up in sixteen new compositions; no composition
needed a fix to an existing primitive before it could work.

### P1 — important reusable capability that was missing

| Gap | Evidence it was real | Resolution |
| --- | --- | --- |
| Duplicate month labels on some time axes | Phase 7 recorded it as a known defect; the quant desk is the second page to hit it | **Fixed at the root.** `timeAxisTickPlan` derives the tick count *and* the label granularity from one span; `axis-time.test.ts` renders nine spans × four widths through the real engine and fails on an interior duplicate (43 assertions) |
| The whole of layer C: a page had to be assembled by hand every time | Sixteen reference products, eight of which repeated the same six sections | Published `@luc/ui/experiences` (seven composites) + `EXPERIENCE_GUIDE.md` for the recipes |
| A "current role" has no shared contract | Both personal-site experiences needed an open-ended period and a localisable word for it | `ExperienceTimeline` with per-entry and component-level `currentLabel`, and a `<time dateTime>` range |
| A bibliography needs facets that cannot drift from the data | The academic page's year/type/topic filters would have been hand-maintained lists | `PublicationList` derives every facet from the entries it is given |
| Dates that shift by a day across time zones | `new Date("2026-03-01")` is UTC midnight printed in local time | `NowSection` parses the parts and formats in UTC; the unit test pins it |

### P2 — valuable composites implemented as recipes

Pricing table, testimonial wall, quiz, checkout stepper, instrument panel,
media metadata editor, article index. Each is a local state machine over
primitives; each is documented with its composition in `EXPERIENCE_GUIDE.md`.
Promotion to layer C is deliberately gated on a second product needing the same
arrangement — the same test `ProjectShowcase` passed.

### P3 — polish

- The experience pages pin an appearance (palette / typeface / personality /
  depth) because the difference between them is part of the demonstration. A
  consumer setting a global appearance still overrides nothing on those pages:
  the attributes are on a subtree, so the global control still moves everything
  else.
- `placeholder-art.ts` generates deterministic covers. It is a Showcase module,
  not a package export, and it is honest about being artwork rather than
  photography.

## 3. What is *not* covered, stated plainly

- Payment collection, model inference and live market data are represented by
  local state with the same shape as the real interaction. No provider is
  contacted anywhere in the experiences, by construction.
- No native iOS/Android device was used. Mobile coverage is a 390 × 844
  Playwright viewport in Chromium and Firefox.
- WebKit could not be launched in this environment (missing host libraries);
  the same limitation Phase 7 recorded.
