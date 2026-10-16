# Phase 9 — Agent A report: homepage hero, product story, resource links

**Date:** 2026-10-09 (UTC)
**Owner:** `agent_a_home` (Agent A — website and brand)
**Scope of writes actually used:**

- `apps/showcase/components/home/**` (new: four files)
- `docs/audits/phase-9/i18n/agent-a.json` (new)
- `docs/audits/phase-9/agent-a-report.md` (this file)

Nothing else was touched. `lib/docs/**`, `lib/navigation.ts`, `lib/i18n/**`,
`components/playground/**`, `app/**`, `packages/ui/**` and `qa/**` were read
only, and `app/page.tsx` was deliberately left to the Lead.

---

## 1. What was delivered

Three chrome-free sections plus a barrel. They render inside whatever container
the page provides (they do **not** wrap themselves in `DocPage`/`Container` and
they do not render a page header), so the Lead composes them.

```tsx
import { HomeHero, HomeProductStory, HomeResources } from "@/components/home";

<DocPage>
  <HomeHero />
  {/* V4-era sections the Lead chooses to keep, if any */}
  <HomeProductStory />
  <HomeResources />
</DocPage>;
```

| Export | File | Answers the visitor's question |
| --- | --- | --- |
| `HomeHero` | `components/home/hero-section.tsx` | "What is this, and what does it look like?" |
| `HomeProductStory` | `components/home/product-story-section.tsx` | "What does it stand for, and can I hold it to that?" |
| `HomeResources` | `components/home/resources-section.tsx` | "Where do I go for what I need?" |

### `HomeHero`

One `AuroraSurface` moment, split into an argument and a demonstration.

- Left: two badges, a two-line display headline, one lead sentence and three
  real destinations (`/components`, `/charts`, `/foundations`).
- Right: a **miniature component page** — name, a live specimen, the exact
  import a reader would write, and one honest note. A `SegmentedControl`
  switches between three specimens (`Buttons`, `Badges`, `Cards`), each of
  which is rendered from the real `@luc/ui` component rather than a picture.
  This is the one claim the homepage makes about itself: *the documentation
  shows the component, and the component is the library*.

It is the homepage's only client island (`useState` for the specimen). No chart
engine, no provider code and no heavy dependency is imported, so the front door
does not drag ECharts, Lightweight Charts or TradingView into its bundle.

### `HomeProductStory`

A four-card `Section` stating the rules that decide how the library is built —
*tokens come before components*, *dark mode is the reference*, *the interface
never computes*, *documentation stays honest* — followed by a `Callout` that
describes the anatomy of a component page (purpose → live example → real import
path → API from the generated catalog → what it does not do).

Every rule is checkable against a real page, which is why these four were chosen
over claims like "fast" or "batteries included": a claim a reader cannot verify
is a claim that ages into a lie.

### `HomeResources`

Seven cards, one per destination: `Foundations`, `Components`, `Charts`,
`Motion`, `Experiences`, `Data table`, `Integrations`. All seven routes were
verified to exist on disk (`app/<route>/page.tsx`) rather than assumed. Card
titles go through `tn(...)`, so they reuse the navigation translations that are
already at 100 % instead of inventing a second label for the same surface.
Each card carries `data-testid="home-resource-<id>"`, which gives the Lead's
browser sweep a hook that fails loudly if a destination ever disappears.

---

## 2. Translation handoff

`docs/audits/phase-9/i18n/agent-a.json` holds **35 `{en, zh}` pairs** — exactly
the sentences `node apps/showcase/scripts/i18n-pending.mjs` reports for the
three source files, verified by machine:

```
json entries: 35 unique: 35
pending from extractor: 35
MISSING from json: []
EXTRA in json: []
```

Notes for the merge step:

- No key needs escaping (no `"` or `\` in any sentence), so the insert into
  `export const proseZh` is a straight one-line-per-pair paste.
- `"Data table"` is in the list on purpose. It is the `title` of a resource
  card, and a `title` inside a documentation data array is prose by
  `scripts/i18n-prose.mjs`, so it needs a *prose* entry even though the
  navigation dictionary already translates the same words.
- **Blast radius:** the coverage script attributes every sentence found under
  `components/**` to *every* route ("Showcase chrome is rendered by every
  route"). Until this file is merged, `pnpm verify:i18n` will report all routes
  as incomplete, and each of the 35 sentences will fall back to English on the
  Chinese page. That is the designed handoff from the plan of record (§7), not a
  regression I introduced silently — but it is the one merge that unblocks it.

---

## 3. Verification (exact commands and results)

```bash
cd luc-ui/apps/showcase
pnpm exec eslint components/home --max-warnings 0
#   exit 0, no output

pnpm exec tsc --noEmit
#   no diagnostic mentions components/home (the only errors in the tree are in
#   the Lead's in-flight lib/docs/curation/summaries.ts)

for r in foundations components charts motion experiences data/table integrations/tradingview; do
  test -f "app/$r/page.tsx" && echo "OK /$r"
done
#   all seven routes present

node scripts/i18n-pending.mjs
#   lists exactly the 35 sentences now supplied in agent-a.json
```

Not run here, by the plan's own rules: `pnpm qa:full`, any Docker build, and any
full `pnpm verify` (the Lead owns the shared browser sweep and the image rebuild,
and the tree is mid-implementation while Checkpoint 0 lands).

**Known gap, stated rather than hidden:** the three sections have not been
rendered. The Showcase still has no unit runner (that is a Checkpoint 0
deliverable), the host `next build` cannot run in this sandbox, and the image
build belongs to the Lead — so "it typechecks, lints and its copy is extractable"
is the honest claim, not "it looks right". First render happens in the Lead's
next build; the sections are deterministic, so a hydration complaint there is a
real defect worth reporting back to me.

Accessibility and hydration notes, since neither can be checked by those
commands alone:

- Heading order is `h1` (hero) → `h2` (specimen card, then each `Section`) →
  `h3` (principle cards); no level is skipped and the page has one `h1`.
- The import-path blocks are `<pre tabIndex={0}>`, which keeps a horizontally
  scrollable region reachable by keyboard (`scrollable-region-focusable`).
- All three sections are deterministic on the server and the client: no
  `Math.random`, no `Date.now` in render, and the numbers are literals. The
  `MetricValue` / `Delta` formatting runs through `formatNumber`, whose default
  locale is a fixed `en-US`, so there is no locale-dependent hydration
  mismatch.
- The segmented control carries a translated `aria-label`, so it is not an
  unlabelled group.

---

## 4. Decisions and trade-offs

1. **The hero demonstrates the documentation format instead of a dashboard.**
   The previous homepage hero staged a live revenue metric with a simulated
   button. That reads as a product demo for a product that does not exist; a
   miniature component page reads as *this Showcase*, which is the actual
   subject of the site.
2. **No registry coupling yet.** The plan gives the sidebar, search and
   breadcrumbs one registry (`lib/docs`). The homepage does not need it to be
   correct, and importing a half-written module would have made this work depend
   on someone else's in-flight file. Once `lib/docs/generated/registry.json`
   exists, a "featured components" strip driven by it would be a good fourth
   section — say the word and I will add it to my own directory.
3. **Copy is literal English wrapped in `tcs(...)`**, not new `tc("symbol")`
   keys: the dictionary is Lead-owned, and the sentence-keyed path is the one
   the plan asks agents to use.
4. **No numbers about scale.** The old homepage displayed test counts and route
   counts (662 tests, 104 routes). Both were stale, and a homepage is the worst
   place for a number that needs someone to remember to update it. The claims
   that remain are properties, not quantities.

---

## 5. Open questions for the Lead

1. **`app/page.tsx` composition** — do you want to compose these three yourself,
   or should I write the page once you have decided what happens to the V4-era
   sections (personalities, palettes, industries, bilingual, engineering,
   index)? I did not delete or move any of them.
2. **Featured strip** — should I add a registry-driven "featured components"
   section once `lib/docs/generated/registry.json` lands, or keep the homepage
   independent of the registry?
3. **`/docs/*` getting started** — when the getting-started pages exist, I can
   add them to `HomeResources` (one card each) so the front page routes into
   them; today they would be 404s, which is why they are not there.

---

## 6. Commands to run after the merge (for the Lead)

```bash
cd /home/luc/code/luc-quant/luc-ui
pnpm verify:i18n                                  # expect 0 pending sentences
pnpm --filter @luc/showcase typecheck
pnpm --filter @luc/showcase lint
# once app/page.tsx composes the sections:
pnpm qa:changed                                   # "/" is touched
```
