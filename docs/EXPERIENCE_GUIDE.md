# Experience guide — layer C: products built from the library

`@luc/ui` has two layers of reusable code and this guide is about the second one.

**Layer B — the root barrel.** One control at a time: `Button`, `DataTable`,
`Accordion`, `TreeView`, `KanbanBoard`. A component is published here when a
single element has a contract worth naming.

**Layer C — `@luc/ui/experiences`.** The assemblies a *page* is made of: a
profile hero, a career timeline, a filterable bibliography, a reading shelf, a
`/now` block. These exist because the same six assemblies were being rewritten
by hand on every personal site, and because getting them wrong is expensive in
ways a screenshot does not show — an unlabelled icon link, a "present" that
never ends, a date that shifts by a day across time zones.

Everything else a product page contains is a **recipe**: `Card`, `Accordion`,
`Badge` and `Button` arranged by the application. Those live in the Showcase at
`/experiences`, not in the package, because publishing them would publish this
repository's copywriting rather than a contract.

## The published composites

| Import | What it is | Why it is not a recipe |
| --- | --- | --- |
| `ProfileHero` | Name, role, lead, portrait, facts, links, actions | Owns the heading hierarchy (the name is the `h1`) and the editorial/instrument variants |
| `SocialLinks` | A labelled list of profile links | Gets the three recurring defects right: accessible name, new-tab warning, list semantics |
| `ExperienceTimeline` | Roles with an org, a period and a current flag | The period is a `<time>` with a machine-readable `dateTime` range, and the open end is localisable |
| `ProjectShowcase` | A grid that grows the chosen project into a detail region | Keeps the collection on screen and reports the choice to a controlled caller |
| `PublicationList` | A bibliography with year/type/topic facets | Facets are derived from the entries, and nothing is invented — no DOI, no citation count |
| `ReadingShelf` | Books grouped by status, with progress | Progress is a real `role="progressbar"`, not a coloured bar with a number beside it |
| `NowSection` | A `/now` block | Requires the date it was last true and formats it in UTC so it cannot drift by a day |

```tsx
import { ProfileHero, ExperienceTimeline, SocialLinks } from "@luc/ui/experiences";

<ProfileHero
  name="Ada Okonkwo"
  title="Distributed systems engineer"
  lead="I build storage layers that keep working when a region does not."
  facts={[{ id: "base", label: "Based in", value: "Lisbon" }]}
  links={[{ id: "gh", label: "GitHub", href: "https://github.com/", handle: "ada" }]}
/>
```

## Composition rules

**Slots, not booleans.** `ProjectShowcase` takes `renderMedia` and
`renderDetail`; the component owns the interaction and the caller owns the
content. A `variant="photo"` prop would have been a second implementation with
the same accessibility, kept in sync by hand.

**Controlled or uncontrolled, never both.** `ProjectShowcase` and
`PublicationList` use `value` + `onValueChange`, or `defaultValue` on their own.
That is the same contract `DataTable` has for every piece of its state, so a
demo and a URL-synced product screen use the same props.

**The library renders; it does not compute.** No composite derives a statistic,
a reading pace, a citation count or a date from a locale-sensitive input. The
`NowSection` date is the only formatting the package performs, and it is UTC
pinned by construction.

**Localisable by the caller.** Every user-visible string that is not content has
a prop: `currentLabel`, `label`, `emptyText`, `filterLabel`, `statusLabels`,
`updatedLabel`, `locale`. Library defaults are English and are documented as
overridable; the Showcase passes Simplified Chinese.

**Spatial language, inherited.** Every composite styles itself with the shared
tokens — `luc-rest`, `luc-hover`, `luc-float`, `luc-well`, `luc-focus` — so
`data-palette`, `data-typeface`, `data-personality` and `data-space` on any
ancestor restyle it with no per-component work and no second token set.

## Recipes (not published, by decision)

The sixteen reference experiences compose these from primitives. They are
documented here so they are reusable without being shipped:

| Recipe | Built from | Where to see it |
| --- | --- | --- |
| Pricing table with a billing toggle | `Card` + `Button` + `Badge`, one local `boolean` | `/experiences/general/marketing` |
| Feature storytelling rows | `Section`-scale grid, an aria-labelled figure | `/experiences/general/marketing` |
| Lead form with inline validation | `Field` + `Input` + `NativeSelect` + `Callout` | `/experiences/general/marketing` |
| Testimonial wall | `Rating` (read-only) + `blockquote` | `/experiences/general/marketing` |
| Article index with a share control | `SearchInput` + `Button` filters + `Toast` | `/experiences/general/publishing` |
| Feed with reactions and replies | `Card` + `Textarea` + `DropdownMenu` + `AlertDialog` | `/experiences/general/community` |
| Quiz with explanations | `RadioGroup` + `Callout` + `Progress` | `/experiences/vertical/education` |
| Checkout stepper | `Stepper` + `RadioGroup` + `Field` | `/experiences/vertical/commerce` |
| Instrument panel | `Slider` + `SegmentedControl` + charts | `/experiences/vertical/science` |

Each recipe is a *local state machine over primitives*. If two products need the
same one and the arrangement is stable, that is the evidence for promoting it to
layer C — the same test `ProjectShowcase` passed before it was published.

## What is deliberately absent

- **No application fixtures in the package.** `@luc/ui/experiences` has no
  dataset, no fixture and no example content; every string arrives as a prop.
- **No router, no fetching, no engine.** The subpath's consumer test asserts
  that a bundle importing all seven composites contains no chart engine, no date
  system and no provider script.
- **No templates.** A full page — a hero plus three sections plus a footer — is
  the application's document, and shipping one as a component would make the
  library opinionated about a product it does not own.
