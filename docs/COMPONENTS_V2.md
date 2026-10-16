# LUC UI — Components V2

The authoritative specification for the component library's **taxonomy, API
conventions and documentation UX**. Where this document and a page disagree, the
page is wrong.

It exists because the library is large and does not yet read like one product:
103 documented component entries, several page shapes, ordinary controls wrapped
in a full-width playground, and installation instructions repeated on every
detail page. Ant Design is the reference for *taxonomy and documentation UX* —
what goes where, how much a page says, what an example owes the reader — not for
visual identity, source or copy. LUC's own tokens, materials and motion stay exactly
as they are.

## 1. What was measured, and where

| Source | What it gave |
|---|---|
| `https://ant.design/components/overview/` (fetched, 2026-10-12) | 72 components in seven groups: General, Layout, Navigation, Data Entry, Data Display, Feedback, Other |
| `https://ant.design/components/{button,float-button,icon,typography,divider,input,table,modal}/` | the page shape: title → one-line description → examples → API, with a per-example code toggle and no separate "playground" |
| LUC `lib/docs/generated/registry.ts` | 103 component entries, 27 families |
| LUC `packages/ui/package.json` + `src/index.ts` | 32 public export subpaths; the real exported names, read from the barrel rather than from filenames |

The Ant Design pages were read for principles only. No source, no assets and no
copy were taken from them.

## 2. Taxonomy

Ant Design's seven groups are the model. LUC maps them onto the families that
already exist in `lib/docs/generated/registry.ts` rather than inventing a second
vocabulary: a reader who has learnt the sidebar must not have to learn it twice.

| LUC family | AntD group it answers to | What belongs there |
|---|---|---|
| `actions` | General | Button, IconButton, ButtonGroup, Toggle, Link, Kbd |
| `typography` | General | Typography (the type roles), plus prose and inline code treatments |
| `layout` | Layout | Container, Grid, Inline, Stack, Section, Card, Panel, Separator, ScrollArea, AspectRatio |
| `navigation` | Navigation | AppShell, Tabs, Stepper, Pagination, TreeView, OutlineDrawer, URL state |
| `forms` | Data Entry | Input, Textarea, NativeSelect, Select, Combobox, Checkbox, Radio, Switch, RangeSlider, SegmentedControl, Rating, SearchInput, InputGroup, NumberInput, PasswordInput, OtpInput, FileInput, TagInput, ColorPicker, Form, Field, Label, DatePicker, TimePicker |
| `data-display` | Data Display | DataTable, VirtualDataTable, Table parts, Badge, Delta, Metric, StatCard, FreshnessBadge, Timeline, DataDetails, FacetFilter, ColumnVisibilityMenu, TransferList, KanbanBoard, SortableAnnouncer, SortableList |
| `feedback` | Feedback | Alert, Progress, Spinner, Skeleton, EmptyState, StatusBadge, Toaster, NotificationCenter, GuidedTour |
| `overlays` | Feedback / Other | Dialog, AlertDialog, Sheet, Popover, HoverCard, Tooltip, DropdownMenu, ContextMenu, Command |
| `media` | Data Display | Avatar, Carousel, ImageGallery, ImageCompare |
| `ai`, `experiences`, `application`, `integrations`, `typography` | Other | kept as their own families: they are product surfaces, not primitives |

Rules that keep the taxonomy honest:

1. **One primary family per component.** Secondary discovery is a *tag* in
   `lib/discovery/curation.ts`, never a second family.
2. **No empty categories.** A group exists when it has components, not when a
   diagram wants symmetry.
3. **Motion is a family of Components**, per the product decision recorded in
   `lib/discovery/areas.ts`; it keeps `/motion/**` and does not become a seventh
   AntD-style group.
4. **Layout primitives are named for geometry** (Inline, Stack, Grid) rather than
   for AntD's Box model (Flex, Space). The mapping is documented in §4 so a reader
   arriving from AntD finds them.

## 3. API conventions

These are checkable rules, not aspirations. Each applies where it is meaningful —
a Divider has no `loading`.

| Convention | Rule |
|---|---|
| Naming | Components are nouns (`Button`, `DataTable`). Boolean props are adjectives without a `is` prefix (`disabled`, `invalid`, `selected`). Event props are `onX` (`onValueChange`, `onOpenChange`) and never `onChange` for a non-DOM control. |
| Variants | `variant` is an intent, not a colour: `primary`, `accent`, `secondary`, `outline`, `ghost`, `danger`. A family that needs fewer ships fewer. |
| Sizes | `size` is `sm`, `md` (default), `lg`. Density is a token, not a prop. |
| Disabled | `disabled` is native where the element is native; a control that cannot be disabled says so in its API table rather than accepting the prop and ignoring it. |
| Loading | `loading` keeps the width, sets `aria-busy` and blocks activation while staying focusable — never removes the label. |
| Controlled / uncontrolled | Every stateful control takes `value` + `onValueChange` **or** `defaultValue`, never both, and never silently prefers one. |
| Theme and tokens | Colours, radii, spacing and motion come from CSS custom properties. A component never names a raw colour or a pixel radius. |
| Keyboard and focus | Every interactive element is a real `<button>`/`<input>`/`<a>` or has an explicit role and key handling. Focus is visible via `luc-focus`; focus is never moved except by an overlay. |
| Public imports | One public path per component family (`@luc/ui`, `@luc/ui/charts`, `@luc/ui/motion`, …). Deep-importing `src/**` is not a public contract. |
| TypeScript | Props extend the underlying element's props when the component renders one; the export carries its own props type (`ButtonProps`). |
| Responsive | A component is usable at 390px without horizontal scroll; a family that changes shape at a breakpoint says which one. |

## 4. Ant Design → LUC coverage

Read from LUC's real exports, not from filenames. `COMPLETE` means the capability
exists publicly with a documented page; `RENAMED` means LUC ships it under a
different name (the mapping is the point); `PARTIAL` means something real is
missing; `MISSING` means there is no public equivalent; `N/A` means the capability
is deliberately out of scope.

| AntD component | LUC equivalent | Status |
|---|---|---|
| Button | `Button`, `buttonVariants` | COMPLETE |
| FloatButton | `FloatButton`, `FloatButtonGroup` | COMPLETE (batch 3) |
| Icon | `Icon`, `iconSet`, `searchIcons` | COMPLETE (batch 3) |
| Typography | `Typography`, `Heading`, `Text`, `Code` | COMPLETE |
| Divider | `Separator` | RENAMED |
| Flex | `Inline` (row) | RENAMED |
| Grid | `Grid` | COMPLETE |
| Layout | `AppShell`, `Section`, `Panel`, `Card` | COMPLETE |
| Masonry | — | N/A (no layout engine) |
| Space | `Stack` (column), `Inline` (row) | RENAMED |
| Splitter | `Workspace`, `Panel` | COMPLETE |
| Anchor | `PageOutline`, `useScrollSpy` | COMPLETE |
| Breadcrumb | `Breadcrumbs` | COMPLETE |
| Dropdown | `DropdownMenu` | COMPLETE |
| Menu | `DropdownMenu`, `ContextMenu` | COMPLETE |
| Pagination | `Pagination`, `DataTablePagination` | COMPLETE |
| Steps | `Stepper` | RENAMED |
| Tabs | `Tabs` | COMPLETE |
| AutoComplete | `Combobox` | RENAMED |
| Cascader | `TreeView` + `Combobox` | N/A — a hierarchical choice is a tree in a popover; see §4.1 |
| Checkbox | `Checkbox` | COMPLETE |
| ColorPicker | `ColorPicker` | COMPLETE |
| DatePicker | `DatePicker`, `Calendar` | COMPLETE |
| Form | `Form`, `Field`, `FieldArray` | COMPLETE |
| Input | `Input`, `InputGroup` | COMPLETE |
| InputNumber | `NumberInput` | RENAMED |
| Mentions | — | N/A |
| Radio | `Radio`, `RadioGroup` | COMPLETE |
| Rate | `Rating` | RENAMED |
| Select | `Select`, `NativeSelect` | COMPLETE |
| Slider | `RangeSlider` | RENAMED |
| Switch | `Switch` | COMPLETE |
| TimePicker | `TimePicker` | COMPLETE |
| Transfer | `TransferList` | RENAMED |
| TreeSelect | `TreeView` + `Combobox` | PARTIAL — a documented composition, not a new component; see §4.1 |
| Upload | `FileInput`, `FileUpload` | COMPLETE |
| Avatar | `Avatar` | COMPLETE |
| Badge | `Badge`, `StatusBadge` | COMPLETE |
| Calendar | `Calendar` | COMPLETE |
| Card | `Card`, `Panel` | COMPLETE |
| Carousel | `Carousel` | COMPLETE |
| Collapse | `Accordion`, `Collapse` (motion) | COMPLETE |
| Descriptions | `DataDetails` | RENAMED |
| Empty | `EmptyState` | COMPLETE |
| Image | `ImageGallery`, `ImageCompare` | COMPLETE |
| List | `List`, `ListItem`, `ListHeader`, `ListFooter` | COMPLETE (batch 3) |
| Popover | `Popover`, `HoverCard` | COMPLETE |
| QRCode | — | N/A |
| Segmented | `SegmentedControl` | RENAMED |
| Statistic | `Metric`, `StatCard` | RENAMED |
| Table | `DataTable`, `VirtualDataTable` | COMPLETE |
| Tag | `Badge`, `TagInput` | COMPLETE |
| Timeline | `Timeline` | COMPLETE |
| Tooltip | `Tooltip` | COMPLETE |
| Tour | `GuidedTour` | RENAMED |
| Tree | `TreeView` | COMPLETE |
| Alert | `Alert`, `Callout` | COMPLETE |
| Drawer | `Sheet` | RENAMED |
| Message | `Toaster` + `toast()` | RENAMED |
| Modal | `Dialog`, `AlertDialog` | COMPLETE |
| Notification | `NotificationCenter` | RENAMED |
| Popconfirm | `AlertDialog` | RENAMED |
| Progress | `Progress` | COMPLETE |
| Result | `Result` | COMPLETE (batch 3) |
| Skeleton | `Skeleton` | COMPLETE |
| Spin | `Spinner` | RENAMED |
| Watermark | — | N/A |
| Affix | `sticky` utilities + `PageOutline` | N/A |
| App | `LucProvider` | RENAMED |
| BorderBeam | LUC ships `BorderTrail` in Motion | RENAMED |
| ConfigProvider | `LucProvider`, `ThemeProvider`, `LocaleProvider` | RENAMED |

**Verdict:** LUC is not short of components — it was short of *four foundational
ones* (`Icon`, `FloatButton`, `List` and a full-page `Result`) and of a **uniform
page**. All four now ship (batch 3); the page is the longer job and is why the
roadmap below puts the migration first.

Two of these were asserted from a filename scan first and corrected by reading the
barrel: `List` looked exported (the match was `TabsListProps`, a Radix prop type)
and `Icon` looked present (46 source files import `@remixicon/react` directly,
which is an internal dependency rather than a public component). Neither was
publicly exported. `packages/ui/src/index.ts` is the authority — and it is what
the four new components were exported from, which is how they appear in the
catalogue, the sidebar and the type tables without a second list being written.

### 4.1 Cascader and TreeSelect — the decision, stated

Both rows are marked with a decision rather than a gap, because "Ant Design has
one and LUC does not" is not a reason to add a component:

- **Cascader is deliberately not built.** What it offers is a hierarchical choice
  rendered as columns of options, whose value is the path. LUC's product surface
  has no such control: the hierarchical chooser it actually needed is a `TreeView`
  inside a `Popover` — one value, one tree, keyboard support that the platform
  already defines — and a column chooser is a second interaction model to
  maintain, test and translate for no page in this repository.
- **TreeSelect stays a documented composition, not a component.** `TreeView` is
  the tree; `Popover` is the surface; the trigger is a `Button`. A wrapper that
  fused them would have to invent the *value* contract (a path? a node id? a list
  of ids?), and inventing one here would be a guess that consumers then have to
  live with. The `Combobox` remains the answer for a flat, searchable list — which
  is the case the library was actually asked for.

If a real consumer appears with a hierarchical *form* field, this is the note to
reopen: the missing piece is a value contract, not a rendering.

## 5. Documentation template for a Components detail page

Every `components/**` detail page follows this order. Nothing is optional except
where marked.

1. **Title** — the component's own name (`Button`), as `h1`.
2. **One sentence** saying what it is for, addressed to the reader's job, not to
   the implementation.
3. **The import statement**, copyable, printed once. Not an installation block —
   package setup lives in Documentation → Installation.
4. **Grouped live examples.** Each one is an `<Example>` (§6): a title, an
   optional one-line description, the live specimen, and its own Show code /
   Copy code.
5. **API / Props**, generated from the compiler where the entry is in the
   registry, or a hand-written table for a family page.
6. **Accessibility or usage notes** — only when there is something a reader would
   otherwise get wrong.
7. **Related navigation** — the sibling components, then previous/next.

### 5.1 The rendered order, and the four sections it replaced

The two page kinds — a curated page written by hand and a page assembled from the
registry — render the same seven sections in the same order, with the same
anchors, so a reader cannot tell which kind they are on until they look at the
status badge. In the registry's template that is:

```
#overview    the header: family, status, title, one sentence, import path
#examples    the page's own specimen, then the entry's declared configurations
#usage       the import statement plus the minimal call (and the setup link)
#api         one area: exports, then a props table per symbol that has one
#guidelines  Do / Don't and an accessibility note — only when curated (notes.ts)
#rendering   folded, and only where the answer is specific (charts, motion, overlays)
            then: family card, related row, previous/next
```

Five sections that used to be rendered at the wrong granularity are gone, and
each removal is a rule rather than a taste:

| Was | Why it changed |
| --- | --- |
| `h2 Live preview` | The page's own specimen and its variants are one list of capabilities; two headings named the same idea twice. The specimen is now the first `<Example>`, with a title. |
| `h2 Usage` with nothing under it | A heading over an empty section. Usage now prints the real import statement and, where curated, the shortest call that does something. |
| Loose `X props` headings after the API | They read as a second reference and the outline listed them as page sections. They live inside `#api` now (`entry-api.tsx`). |
| The family's accessibility paragraph, on every member page | Identical on eight Actions pages, eleven form pages and six overlay pages. A per-component statement lives in `curation/notes.ts`; the family's own statement lives on the family page. |
| `SSR and rendering` on every component page | One generic paragraph on 150 pages, and it was *false* for overlays: `renderingCopy` was keyed by `DocEntry.group`, which is `"components"` for every component family, so the overlay case was unreachable. It is keyed by family now, and a component with nothing specific to say renders no section at all. |

### 5.2 Where an entry's page notes live

`apps/showcase/lib/docs/curation/notes.ts` is the one new registry. Three kinds of
judgement, keyed by the canonical entry id, everything optional:

```
usage          { code, note }        the shortest call that does something
guidance       { use[], avoid[] }    what to reach for, and what not to
accessibility  { detail }            true of this component, not of its family
api            { note }              why this module's surface looks like this
```

plus `RELATED_ENTRIES` for the two to four pages a reader most likely wants next
(the footer used to fall back to the first four siblings in reading order, which
is the sidebar with worse ordering). `scripts/docs-registry.mjs` validates every
id, every related link and the family it stays inside; `tests/unit/docs-notes.test.ts`
checks that a snippet imports only symbols the entry's own subpath publishes and
that a code sample names the component it demonstrates. An entry with no record
renders no Usage snippet, no Guidelines and no Accessibility section — the
sections are optional, the headings are not empty.

The prose keys are `note`, `use`, `avoid`, `detail`, which is not cosmetic:
`scripts/i18n-prose.mjs` watches exactly those names, and
`scripts/i18n-coverage.mjs` attributes the file's sentences to the routes of the
entries it names, so a note that is not translated fails the gate instead of
shipping in English.

Deliberately absent from a component page:

- a mandatory **Playground**. A playground is a *configuration* surface for
  charts and studios, where changing a prop changes a plotted result. An ordinary
  control is demonstrated by examples, not by a 16rem control column beside a
  half-empty stage. A page may offer a playground for a component whose prop space
  is genuinely large (DataTable, charts), and then it comes **after** the examples.
- repeated **installation** instructions.
- "Copy for an AI agent" and "not controllable here" prose in the primary reading
  path. Agent guidance stays available at the foot of the page, folded.

## 6. The example system

One primitive, `components/docs/example.tsx`, renders every example on a
Components page. It owns:

| Capability | Rule |
|---|---|
| Title | Required. It names the capability being shown, not the prop (`"Three sizes"`, not `"size"`). |
| Description | Optional, one line, and only when the specimen alone is ambiguous. |
| Preview | The real exported component with a deterministic fixture. |
| Show / Hide code | A real `<button aria-expanded aria-controls>`; the code is hidden by default on a long page and shown on a short one. |
| Copy code | Copies the snippet the preview was built from, and says so in its accessible name. |
| Layout | `inline` (a row of small specimens), `block` (stacked), `grid`, `stage` (one full-width surface). Chosen per example, not per page. |
| Responsive | The specimen is centred in its own card with a bounded height; code scrolls horizontally rather than wrapping. |

The rule that makes this worth having: **the code is printed from the props the
preview rendered**, so the two cannot disagree. `lib/demo/jsx.ts` already enforces
that for registry entries; the V2 example primitive takes the same discipline to
hand-written pages.

## 7. Visual layout standard

| Aspect | Standard |
|---|---|
| Reading width | `docs` intent (104rem) for component pages; `wide` (120rem) for charts and studios. Prose inside a page is capped at 68ch. |
| Preview sizing | A specimen card is `min-h-[6rem]` inside a bordered, radius-`lg` surface with `p-5`. It grows with its content and never reserves a fixed 24rem stage. |
| Centring | An `inline` example centres its row horizontally; a `block`/`stage` example fills the card's width. A single small control is never pinned to a corner of an empty half-screen. |
| Demo card | One border, one radius, one padding scale, no shadow. Elevation is reserved for overlays. |
| Section spacing | `gap-9` between page sections (the `DocPage` rhythm); `gap-4` inside an example. |
| Code display | `surface-sunken`, mono at `text-caption`, `overflow-x-auto`, focusable so a keyboard user can scroll it. |
| Copy affordance | Top-right of the code block, revealed on hover **and** on focus-within, with a named label. |
| API tables | Same table component as the registry pages: `text-caption`, one hairline per row, a monospace type column, no zebra striping. |
| Mobile | Examples stack; the code block goes edge to edge; nothing scrolls horizontally at 390px. |

## 8. Roadmap

Prioritised from the coverage matrix in §4 and the state of the pages. Status is
kept honest here as well as in the ledger: a batch is done when its pages are
migrated and its components ship, not when one of them does.

| Batch | Work | Class |
|---|---|---|
| 1 | `Example` primitive; Button, Toggle, Dialog canonical pages | **done** — sets the standard |
| 2 | The remaining `actions`, `forms` and `overlays` pages: drop the leading playground, group examples, one import line | **in progress** — the whole registry now renders the canonical order of §5.1 (Examples, then Usage, then one API area). **Actions, Forms, Date & time, Layout, Navigation and Feedback are complete**: 8 + 24 + 3 + 10 + 5 + 10 entries, each with curated notes, capability-covering examples and a measured outline of at most four sections. The Input, Card, Button and ProfileHero playgrounds are gone (the last two were wired but mounted by no page); `/components/slider` was migrated from a prose `PropsTable` plus a "Rules" section to the compiled API plus curated Guidelines. The remaining handwritten pages outside those categories still use the older always-visible-code frame |
| 3 | `Icon`, `FloatButton`, `List`, `Result` | **done** — see §4; each ships a public export, an examples-first page, unit tests and a live specimen |
| 4 | `data-display` and `layout` pages | **in progress** — all ten `layout` entries and the three `date-time` entries now follow §5 (Examples → Usage → one API area → Guidelines), with 3–5 capability examples each and compiler-generated API tables; the Cards page was converted to the same shape. `data-display` is next; `List` was done with batch 3 |
| 5 | `Cascader`, `TreeSelect` | **decided, not built** — §4.1 |
| 6 | Charts, Visuals, Motion, Blocks keep their own page shapes — see §9 | deliberately out of scope |

### Findings from the Actions review, for the next batch

Four things the review measured rather than assumed. Each is a decision waiting
for an owner, not a fix that was smuggled in:

1. **`toolbar.tsx` does not exist — `Toolbar*` shares a module with
   `ButtonGroup`.** Seven `Toolbar*` symbols are exports of
   `components/button-group.tsx`, so the registry's one-entry-per-module rule puts
   both families on one page. The page now explains the relationship and
   demonstrates each, but the honest structure is a module split: it would give
   Toolbar its own documented page, its own notes and its own related row. It is
   a source-layout change with no public-API consequence (`@luc/ui` still exports
   both), and it needs approval.
2. **The `Toolbar*` parts are unstyled re-exports.** `Toolbar` styles the shell;
   `ToolbarButton`, `ToolbarSeparator`, `ToolbarLink`, `ToolbarToggleGroup` and
   `ToolbarToggleItem` are the Radix primitives as they come. Measured: three
   items render as a 96 px column inside a 106 px toolbar unless the caller adds
   `flex`. The examples now show the composition and say so; styling those five
   exports is a component change and needs approval.
3. **`toggleVariants` cannot be called from a Server Component.** It is published
   from `toggle.tsx`, which is a `"use client"` module, so React refuses the call
   on the server — measured as a 500 on `/components/button-group`. Contrast
   `buttonVariants`, which deliberately lives in its own server-safe module, which
   is why `buttonVariants` is documented on the Button page and `toggleVariants`
   is only usable inside a client page. Moving the recipe to a `toggle-variants.ts`
   would remove the asymmetry; it is a public-module change and needs approval.
4. **`Icon`'s `icon` prop cannot be demonstrated from a server-rendered demo.**
   `icon={RiPlayLine}` passes a function, which React will not serialise across
   the RSC boundary. The specimen lives in `components/demo/islands/icon-glyph-demo.tsx`,
   which is why the Icon page has one client island among otherwise static
   examples. The `name="…"` path needs none.

Acceptance for a migrated page: the specimen is visible in the first desktop
viewport, every example has a title and its own copyable code, the page has one
import line and no installation block, the API table is present, and the page
passes the shared gates (route health, outline, i18n, console, 390px).

### Findings from the Forms review

The Forms batch reused the Actions infrastructure without a second template, a
second notes registry or a second API renderer. What it added to the shared layer
is small and is stated here because it changes how a page may be written:

1. **`EntryApiSection` takes one or more entry ids.** `/components/file-upload`
   is the documented page for *two* registry entries — `file-input` (`FileInput`,
   `DropZone`) and `file-upload` (`FileUpload`) — and the page rendered only the
   second one's compiled tables, so `FileInput`'s props were reachable nowhere on
   the site. `entryId` now accepts a list, both modules' export tables and prop
   tables render into the single `#api` area, and `primary` decides which table a
   reader meets first. A single id behaves exactly as before.
2. **`primary` folds the rest of a module behind a disclosure.** `select.tsx`
   publishes nine symbols and `forms.tsx` six; a page whose API ran for several
   screens before reaching its own subject now renders the primary table unfolded
   and the other tables inside a native `<details>`. Every prop is still on the
   page, compiled and one click away — nothing was dropped to make the page short,
   which is the failure mode this mechanism has to avoid.
3. **Two Slider composition defects are compensated on the page and need an
   owner.** `showValue="always"` prints the value in a bubble *above* the
   control's own box, and a `mark` label is positioned `absolute top-full`, so
   both escape the slider's layout height: a slider under a `Field` label has the
   bubble land on the label text, and a sentence under a marked slider collides
   with the mark labels. Measured on `/components/slider` before the change: the
   label "Lookback (bars)" was overlapped 21 px by its own value bubble, and the
   mark label "200" touched the description below it by 7 px. The page now
   reserves the room (`mt-6` / `mb-5`), which fixes the *page*; reserving it
   inside `slider.tsx` would change every existing slider's layout, so it is
   reported for approval rather than smuggled into the library.
4. **`Fieldset`'s legend lost the flex gap it assumed, and the library was
   fixed.** The confirmed overlap on `/forms/validation` was not a page defect:
   `field.tsx` gave the description `-mt-2` on the assumption that the
   `flex gap-3` around it applied after the `<legend>`, and a `<legend>` receives
   no flex gap at all. Measured before the fix: the legend ended at y=803 and the
   description began at y=795 — an 8 px overlap on *every* `Fieldset` with a
   description. The legend now owns its own bottom margin and the description has
   no negative offset. This is a `packages/ui` change, and it is the only one this
   batch made.
5. **Three pattern pages still have no API area of their own.** `/forms/validation`,
   `/forms/async` and `/forms/sections` are compositions rather than component
   entries, so their `#api` section is `RelatedApi`'s set of links into the
   components they are built from — the `REFERENCE_ONLY` row of §10, working as
   designed, and the reason the Forms review left them alone.

### Findings from the Date & time and Layout review

The third batch. Seven things, all measured in a browser rather than inferred from
a screenshot; the first four are fixes to shipped defects, the last three are
decisions about the pages.

1. **Two hairlines under Related, on every generated page.** `entry-page.tsx`
   rendered its own `<Separator>` and then `PrevNextNav`, which opens with one of
   its own — two children of `DocPage`'s `gap-9` column, so the page drew two 1 px
   rules 37 px apart with nothing between them. Measured on `/components/container`
   before the fix: y=1369 and y=1406. The page-level copy is gone; the pager keeps
   its rule, so a page that renders no pager now renders no orphan line either.
2. **A slider drew its value bubble and its mark captions outside its own box.**
   The bubble is `bottom-full` on the thumb and a caption is `top-full` on the
   tick, and the root was sized to the groove and the thumb — 20 px at `md`, which
   cannot contain a 21 px bubble plus its 8 px gap. Measured before: the bubble
   covered the field label above by 21 px, and a mark caption covered the sentence
   below by 7 px. `slider.tsx` now reserves a padding band, *only* when that
   decoration is configured (`showValue="never"` and non-captioned ticks reserve
   nothing, so a compact toolbar slider keeps its 20 px), and the groove and its
   ticks share a rail so the ticks still land on the groove's centre once the root
   is padded. The page-local `mt-6`/`mb-5` compensation is gone.
3. **A combobox was filtered by its own selection.** The uncontrolled query was
   seeded from `value.label`, and Downshift writes the selected label into the
   input value whenever the menu opens, blurs or selects — so a combobox with a
   predefined `value` opened showing exactly the row already chosen. Measured on
   the shipped build: a nine-country list with Germany selected, opened, listed
   one country. The query and the field's text are separate things now: the query
   starts empty and is only ever set by typing, the field keeps showing the
   selection, the first keystroke starts a new search (the text is selected while
   the query is empty), and closing the menu restores the label — which also fixes
   Escape and the "re-select the row that was already selected" case, both of which
   used to leave the abandoned query in the field.
4. **A client island cannot receive server JSX.** The measure readout on
   `/components/container` was first written as a client island taking the
   container as `children` and injecting the ref with `cloneElement`; the element
   type does not survive that boundary, so the route failed to render on the
   *server* (`Element type is invalid … got: undefined`, a 500) while the client
   quietly recovered from the RSC payload — which is why it looked fine in a
   screenshot and was caught by the browser QA pass instead. Islands in
   `components/demo/islands` are self-contained and take plain props; that is a
   rule, not a preference.
5. **The outline listed a specimen's heading.** `/components/section` was showing
   a row called "Position sizing" between Examples and Usage, because the
   `Section` component's own `<h2>` inside the example stage was harvested as a page
   section. `[data-slot="example-stage"]` joins the specimen selectors in
   `page-outline.tsx`, and the rail is back to the four real sections.
6. **Layout pages showed one specimen each.** Ten entries with a single "Default"
   stage and no declared configurations now demonstrate their real prop space —
   width modes with a live measurement, column counts and auto-fit tracks, gap and
   alignment scales, section spacing, panel tones, separator weight, scroll
   policies, ratio presets — 3 to 5 examples per page, each with its own copyable
   source. The example frame gained `layout` (it framed every configuration as a
   centred row, which is wrong for a primitive that is *about* space).
7. **Two things deliberately left alone.** The Cards page keeps its Playground:
   §5 allows a panel where the configuration is genuinely entangled, `selected`
   means nothing unless `interaction` is `selectable`, and that one dependency is
   the only live example of WB-004's "disabled combinations state their reason"
   contract — it simply moved to *after* the examples, where §5 puts it. And demo
   specimen copy is not translated at runtime: a sentence inside a `node`, or a
   plain caption prop, stays English on `/zh/…`, which is measurable today on
   `/zh/components/section`. The coverage gate counts those sentences and this
   batch supplied their renderings (the dictionary stands at 119,293/119,293), but
   nothing applies them to a specimen yet. That is a separate piece of work, and
   it predates this batch.

### Findings from the Navigation review

The fifth batch — AppShell, Tabs, Pagination, Stepper, TreeView — and the batch
that looked hardest at the *components* rather than at the copy. Eleven findings;
the first six are defects in shipped code, and each one was measured before it was
changed.

1. **Pagination printed the last page twice.** `paginationWindow` always ends on
   the last page (`1 … 3 4 5 … 24`) and `edges` *also* rendered a numbered "jump
   to last" control, so page 4 of 24 produced two controls named "Page 24" — one
   of them additionally hidden below `sm`. Measured in the DOM of
   `/components/pagination`: `aria-label="Page 24"` twice, `Last page, 24` twice.
   What was missing was the *jump*, not the number: `edges` now renders the
   first/last double chevrons `DataTablePagination` already uses for the same two
   actions, outermost and disabled at the ends, and no page number is ever printed
   twice. `edges`, `siblings`, `compact` and the numbered window are unchanged; the
   hover/press/focus treatment matches the numbered controls beside it. Six
   boundary cases (1 of 1, 2 of 2, 5 of 5, 1 of 24, 24 of 24, 37 of 40) are now
   asserted, and the compact shape keeps both jumps because that is the shape that
   has nothing else.
2. **A Stepper's page promised an interaction it did not have.** The specimen's
   own note read "a completed step is a real button that reports its index" while
   it passed no `onStepSelect` at all — every step was a `<span>`, and the only
   specimen on the page was that one. The page's specimen is now a client island
   (a function prop cannot cross the RSC boundary and the structured printer
   cannot print one), so clicking a completed step really moves the current one,
   and four more configurations cover the rest of the prop space: `orientation`,
   `showNumbers`, a `complete` step finished out of order, and long labels.
3. **A tree could lose its only Tab stop.** A tree is *one* stop with a roving
   `tabindex`; collapsing a branch with the chevron while one of its children held
   the stop left `activeId` pointing at a row that was no longer rendered, so no
   row carried `tabIndex={0}` and the control had no keyboard way back in. The
   stop now falls back to the selection and then to the first visible row, the
   chevron hands it back to the branch it collapsed, and the invariant ("exactly
   one visible row in the tab order") is asserted for both the chevron and a
   controlled `expandedIds` change.
4. **`*` opened the whole tree, not the level.** This module's own header and the
   CHANGELOG both document ARIA's optional binding — expand the focused row's
   *siblings* — and the implementation expanded every branch in the tree. The
   implementation now follows the documented contract, and the test uses two
   levels to prove the difference (`A`, `A1`, `B`, `B1` visible; `A1X` not).
5. **A `disabled` node was deleted rather than disabled.** `flatten` dropped
   disabled nodes that had no children, although the row renderer already styled
   and announced them (`aria-disabled`, `cursor-not-allowed`, `text-fg-disabled`,
   a click handler that returns early). `/components/tree-view`'s own fixture ends
   in `{ id: "archive", disabled: true }` and it rendered nothing at all — the
   reader was told the branch existed and could not see it. Every node is a row
   now, and the keyboard step-over is what makes it inert; the page demonstrates
   both a disabled leaf and a disabled row inside a branch.
6. **A disabled tab looked enabled.** Radix renders the native `<button disabled>`
   plus `data-disabled`, and the trigger had no styling for either, so "Notes" on
   `/components/tabs` hovered and read exactly like the three beside it. Measured
   before: `rgb(243,245,247)` for the disabled trigger and for a live one; now the
   disabled trigger takes `fg-disabled` (`rgb(100,105,111)`) and is out of the
   pointer path.
7. **The family card repeated the Related row on every small family**, and on a
   one-entry family it was worse than redundant: `/components/typography` linked
   to `/components/typography` under the words "Open the family index". The card
   is now rendered exactly when the Related row *cannot* name the whole family —
   `RelatedEntries` fills at most four links and the curated rows are validated to
   stay inside the family — so `/components/stepper` (5 entries) no longer shows
   it and `/components/container` (10) still does. A chart or motion page keeps it
   whenever it has siblings, because those routes have no family index to link to.
8. **The Cards Playground is gone**, reversing the exception the Layout batch
   recorded above. It was right about the dependency (`selected` means nothing
   unless `interaction` is `selectable`) and wrong about the instrument: an
   ordinary component page is examples, and the sentence is now a Guidelines row.
   The examples absorbed what the panel offered — `featured` joined the four
   interaction modes, and a new example covers the `padding` scale and `as` — and
   `adapters/card.tsx` was deleted rather than unwired, because the wiring test
   forbids an adapter no page can reach. `qa/playground.mjs`'s default route list
   was updated to the five routes that still have panels.
9. **The AppShell page never showed the shell.** It explained the model, the
   derived surfaces and the router adapter, and the frame itself was only on the
   *Application family index* — a reader who wanted a product shell had to scroll
   past three architecture paragraphs to find out the component existed. The page
   now runs frame → model → derivations → adapter and names the three layers it
   keeps apart (`AppShell` is layout, the model is data, routing is injected).
   `DemoShell` gained `mobileTrigger` and `onCollapsedChange` so the demo can be
   collapsed from the outside (measured: the column 256 px → the rail 56 px) and so
   the drawer is reachable below `lg` (measured at 390 px: the trigger opens it).
10. **The Sidebar, Breadcrumbs and PageHeader API tables are reachable nowhere.**
    `app-shell/sidebar`, `app-shell/breadcrumbs` and `app-shell/page-header` are
    `referenceOnly` entries whose route is this page, and the generator drops a
    reference entry that shares its route with a real page *in the same family* —
    so `SidebarItem`, `SidebarGroup`, `SidebarRail`, `SidebarToggle`, `Breadcrumbs`
    and `PageHeader` appear in no export table and no prop table on the site. The
    page states the composition in Usage and demonstrates it in the examples, which
    is honest but not the same thing. Fixing it means either relaxing that filter
    for the API projection or splitting the module; both are bigger than a page, so
    it is reported for approval rather than decided here.
11. **Dictionary housekeeping.** The three rewritten pages moved onto the sentence
    dictionary, which left 68 `components.pagination.*` / `components.treeView.*`
    message keys with no caller (82 lines, both locales) — removed, as the Layout
    batch removed its own. Four `routes.zh.ts` headers were stale in the same way
    and were corrected: a route header is only checked for *presence*, so a page
    whose title changes keeps its old Chinese title until somebody reads it.

### Findings from the Feedback review

The sixth batch — the ten Feedback entries and the family overview — plus the two
pieces of shared infrastructure it had to fix, and the Navigation leftovers the
fifth batch recorded for approval. Fifteen findings.

1. **A specimen was English on the Chinese page, for three batches.** The
   coverage gate reads every sentence a page renders, *including* the ones inside
   a demo's `node`, and the dictionary held a rendering for each — and the
   Chinese page still showed them in English, because a specimen is JSX text
   rather than a `tcs()` call. The extractor read it; the runtime never did. The
   fix is one shared function (`lib/i18n/specimen.tsx`) applied in the four
   places a `DemoSpec` reaches the screen: the generated route, both frames of
   `DemoExamples`, `DemoStage` (the catalogue, charts and motion) and the
   `Example` frame that curated client pages render into. It walks the tree,
   translates the strings a reader can see or hear (text nodes and a whitelist of
   caption props), and deliberately leaves `code`/`pre` and every behavioural
   prop alone. Measured on `/zh/components/section`, `/zh/components/tree-view`,
   `/zh/application/navigation`: leaking → clean.
2. **The dictionary could not translate what the extractor could not see.** Short
   chrome labels (`"Gutters"`, `"Nesting"`) and island copy are invisible to a
   sentence rule that wants four words, so they stayed English even with
   coverage at 100%. Two changes: the feedback batch's islands and pages route
   *all* their copy through `tcs` (including button labels and fixture
   sentences), and the labels the extractor cannot reach were added to the
   dictionary by hand. The `ALLOWED` list in `qa/i18n-live.mjs` grew only where
   the text really is data — a textarea's contents, a chart's fixture labels.
3. **A wired Playground that no page mounted.** `button` and `profile-hero` had
   adapters and curation rows, and their pages mount no `PlaygroundSection`, so
   the rows promised a panel nobody rendered — invisible to the wiring test,
   which checks that a row resolves to an adapter rather than that a page
   demonstrates it. Both adapters are deleted and the rows removed;
   `qa/playground.mjs` reports both routes as `no-playground`, which is now the
   truth.
4. **`Sidebar`, `Breadcrumbs` and `PageHeader` had no reachable API.** Three
   registry rows were *reference* rows — modules documented on the page that
   composes them — and the generator dropped any reference row that shared its
   route with a real page, so `SidebarItem`, `SidebarRail`, `SidebarToggle`,
   `Breadcrumbs` and `PageHeader` were published by the package and appeared in
   **no** table anywhere on the site. The rows now survive in `entries` (which is
   what `entryById` and `apiFor` resolve against) while staying out of the family
   index and the reading order (three extra previous/next stops leading to the
   page you are already on is not navigation). Auditing the other reference rows
   found five more in the same state, and all seven are now named by the page
   that owns their route: AppShell (`sidebar`, `breadcrumbs`, `page-header`,
   `navigation`), Calendar (`locale-provider`, `month-year-picker`), DatePicker
   (`datetime-picker`), Workspace (`inspector-pane`), Packaging
   (`luc-provider`) and Themes (`theme-provider`).
5. **A reference row is not a page, and the tests said it was.** Two family
   contracts ("every entry has notes", "every entry is listed by a family") and
   one registry invariant had to learn the distinction; three new assertions in
   `docs-registry.test.ts` hold the new shape — a reference row resolves by id,
   is not an index row, and is named by the page that hosts it.
6. **The Feedback family was fifteen pages of loading indicators.** The family
   overview answered "Skeleton, Spinner or Progress?" and nothing else, so the
   two questions a reader actually arrives with — *how loud should this be* and
   *is this a state or an outcome* — were unanswerable from the page that
   introduces the family. It now leads with a twelve-row decision table and three
   live comparisons (a wait, a message, an end), names each member, and carries no
   API tables of its own.
7. **Five Feedback pages had one example each.** Progress, Spinner, Skeleton,
   Result and GuidedTour were a single "Default" specimen — and for Progress and
   Spinner that specimen was a still picture of a moving thing: a bar at 62 per
   cent, a centred spinner. Each now has a live specimen plus four (or, for the
   tour, two) configurations, and each live specimen is a state the caller owns:
   a job the reader starts, pauses and resets; a button that really becomes busy;
   a placeholder swapped for the data it reserved; a tour that opens, steps and
   closes.
8. **Result rendered a page-level `h1` inside every example.** The component
   defaults to `titleAs="h1"` because its usual job is to *be* the page, so a
   documentation page with five of them had five `h1`s in its body. Every
   specimen now declares its level, and a QA assertion keeps them out.
9. **The "404" on the Result page was a sound example with a confusing label.**
   The screenshot that started this batch showed "No page at this address" inside
   the Result page: not a routing defect and not the site's 404 page, but a
   `Result status="empty" icon={null}` specimen whose *copy* happened to be the
   same sentence the site's not-found page uses. The example is still there —
   it is the right way to show a mark-less outcome — and the status vocabulary
   now covers all five tones plus the text-only variant, so it reads as a
   specimen rather than as a broken route.
10. **A NotificationCenter row's dismiss control was invisible on touch.** It is
    revealed on hover *and* on focus, which is an optical nicety with a pointer
    and an unfindable affordance without one: the button existed, was tappable,
    and could not be seen. It is now always visible under `@media (hover: none)`.
11. **The tour's spotlight teleported.** `luc-transition-slow` animates colour,
    shadow, opacity and transform — not `top`/`left`/`width`/`height` — so the
    highlight jumped between steps while the card beside it slid, which reads as
    two animations in disagreement. The spotlight now carries its own geometry
    transition on the emphasized curve, over the same duration the card uses, and
    the base layer's reduced-motion clamp turns it into a snap for a reader who
    asked for one.
12. **`/components/notifications` documented two components.** NotificationCenter
    *and* GuidedTour, and the tour already had a canonical page at
    `/components/guided-tour` — the same shape the Forms review split for
    ColourPicker and TransferList. The page is now the inbox alone, with the tour
    in its Related row.
13. **QA route discovery sampled dynamic segments instead of enumerating them.**
    Each bracket shape was expanded into three representative pages, so **151
    documented routes were in no browser gate at all** — no axe scan, no 390 px
    overflow check, no console-error check, no i18n probe. `/components/stepper`
    was one, and its 390 px `scrollable-region-focusable` failure was found by
    hand. `qa/routes.mjs` now derives its list from the documentation registry
    (every non-reference entry route plus the thirteen family indexes), the policy
    table still wins where a human chose narrow/light coverage, and
    `qa/route-coverage.test.mjs` keeps the contract: a new entry is swept the
    moment it is generated, and the sweep cannot shrink below the registry. 207 →
    367 routes.
14. **The Slider's reserved room was measured rather than trusted.** The Forms
    batch moved the value bubble and the mark captions inside the slider's own
    box; this batch measured the result at 1440/768/390 in both themes — a slider
    with no decoration is 20 px at every size, a bubble slider is 36/38/40,
    nothing escapes its root and nothing outside it is covered — and found the
    library's own internal consumer (the colour picker's three sliders) already
    opts out explicitly. What the page was missing is the *compact* case: a new
    example shows `showValue="never"` and caption-less ticks, because "the room is
    reserved only when that decoration is configured" is a claim a reader should
    be able to see.
15. **The dictionary's own hygiene.** 385 new sentences arrived with the Feedback
    copy (pages, examples, notes, islands) and all of them were translated before
    the gate ran; the additions are grouped under a `feedback review` heading in
    `lib/i18n/prose.zh.ts`, and the family's seven new entries joined the
    per-family contract in `tests/unit/docs-notes.test.ts`.

## 9. Product architecture boundaries

One documentation shape does **not** fit every product area, and this specification
does not force it:

- **Components** — examples first, grouped, API after. No mandatory playground.
- **Charts** — a wide visual preview with real data; a playground only where a
  control changes the plotted result, which is most of them.
- **Visuals** — their own Styles, Sizes and Fixtures, owned by Agent B. No forced
  adoption of the Components format.
- **Motion** — interactive, replayable examples with code; no generic property
  editor.
- **Blocks** — composition-level previews and usage.

A single universal workbench across all five would be the failure mode this
section exists to forbid.

## 10. API reference, by page kind

§5 requires an API section on a component page. What that section *is* depends on
what the page documents, and the inventory now says which of the five shapes each
of the 56 handwritten routes is. There is no such thing as a combined props table
for a page that exports nothing.

| Page kind | API section | Example |
| --- | --- | --- |
| `SINGLE_PUBLIC_COMPONENT` | The compiler's own prop table, from the registry | `/components/select`, `/data/table`, `/date-time/calendar` |
| `COMPONENT_FAMILY` | The module's exports with real signatures, plus a props table per symbol that has one | `/components/tags`, `/components/toast`, `/forms` |
| `APPLICATION_COMPOSITION` | The module's exports — a shell or a workspace has a surface but no props | `/application/workspace`, `/application/url-state`, `/application/outline-drawer` |
| `REFERENCE_ONLY` | Links to the canonical `#api` of every component the page composes | `/forms/validation`, `/forms/async`, `/date-time/date-range` |
| `COLLECTION_OR_GUIDE` | None. A catalogue is the index; a process guide documents a process | `/components`, `/application/packaging` |

Two rules keep this honest:

- **Nothing is invented.** Every row comes from `generated/api.ts`, which is the
  TypeScript compiler's reading of the published package. A default value in the
  table is a default the compiler saw; a prop that is absent does not exist. Where
  the compiler found no props for a symbol (a provider, a context, a constant),
  the page shows its export and signature and says so, rather than an empty table.
- **A page that could not show a table shows the way to one.** `RelatedApi`
  renders `#api` links to the components a composition is made of. The anchor is
  the one the generated pages already give their API section, so the link lands
  on the props table rather than on the top of a page.

### Delivery: the API tables are server-rendered, and that is measured

`generated/api.ts` is ~650 KB of compiler output — the largest single artifact the
project generates, and one no reader should download to read one table. The
browser therefore reads the compact projection (`lib/docs/nav.ts`: id, title,
route, family) and the server reads the registry.

Twenty of the 56 handwritten routes are a *static* `page.tsx` at exactly the URL a
registry entry owns (`/components/select` is entry `select`'s route), so the
generated page — and with it the prop tables — never rendered anywhere for those
20 ids. They close with a **server wrapper**: `page.tsx` reads the registry and
hands the rendered section into `page-client.tsx` as a node. The page stays a
client component; the table never becomes client JavaScript.

That claim is checked rather than asserted, by `qa/api-delivery.mjs`: it samples
47 byte windows from the middle of `api.ts` and searches every built client chunk
for them. Current result, against a production build —

| | |
| --- | --- |
| `generated/api.ts` | 650.2 KB |
| client chunks searched | 215 (8123 KB) |
| windows found in client | **0** |
| windows found in `.next/server` (positive control) | 4 |

The positive control is the point: a "0" from a sampler that is not sampling the
payload would prove nothing, so the probe fails if the same windows are absent
from the server output too. `qa/api-delivery.test.mjs` pins the negative
regression — a chunk that carries one leaked window must be reported.
