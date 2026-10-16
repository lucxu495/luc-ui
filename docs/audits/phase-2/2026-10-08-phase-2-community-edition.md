# Phase 2 — Community Edition product excellence

Date: 2026-10-08 · Branch `main` · Revision `9cec3c2578911629e7fcf2248d50c35f8cb35240` ·
Author: server Codex agent · Status: **partial delivery, delivered and verified on the live Showcase**

This is the execution record for the Phase 2 cycle. It separates what was verified
from what was interpreted, and it names the batches that were **not** completed.

---

## 1. What Phase 2 actually produced

Three things, in order of product impact:

1. **A brand layer that did not exist.** Seven accent palettes and four type
   voices, selected by one attribute (`data-palette`, `data-typeface`) on `<html>`
   or on any subtree. This is the flexibility the brief asked for, and it is the
   change most visible to a developer evaluating the library.
2. **A Showcase that can be discovered.** The Design Lab — three finished
   treatments of the linked-selection flow — was reachable only by typing a URL.
   It is now a first-class navigation group, part of the standard QA registry, and
   documented as a promoted recipe. Two new pages (`/foundations/themes`,
   `/patterns/industries`) carry the new capabilities.
3. **A cross-industry proof.** Four vignettes — AI/dev tools, commerce, creator,
   finance — built from the same public components, each scoped to a different
   brand, on one page. This is the evidence for "general-purpose, with data as a
   specialisation rather than a ceiling".

Everything above is visible in the deployed Showcase. See the deployment report
for the image digests and route checks.

---

## 2. Batch status

| Batch | Scope | Status | Evidence |
| --- | --- | --- | --- |
| A — Visual foundation & core | Button, Card, Badge, Tabs, SegmentedControl, Typography | **Partial** | Button: new `accent` variant + `luc-sheen`. The rest reviewed and deliberately left unchanged (see §3.2). |
| B — Forms & selection | Input, Select, Combobox, Checkbox, Slider, dates | **Not started** | Reviewed only. No defect found that justified a change in this cycle; nothing was rewritten for the sake of change. |
| C — Overlays & feedback | Dialog, Sheet, Popover, Toast, Skeleton | **Not started** | Review pending. |
| D — Navigation & workspaces | AppShell, Sidebar, Workspace | **Partial (Showcase side)** | Sidebar now auto-expands the group containing the current route; the status bar no longer overflows at 390px. The library components themselves were not modified. |
| E — Data, charts, advanced composition | DataTable, chart inspection, linked selection | **Partial** | The Design Lab recipe was promoted to a documented recipe + QA gate (§5). No new public component or hook was added, on purpose. |
| F — Showcase & developer experience | Navigation, themes, discovery, recipes | **Substantially complete** | Two new pages, an appearance control in the topbar, Experiments navigation, `experiments` QA group, DESIGN_SYSTEM §4a. |

The remaining work is stated in §8. It is not hidden inside "done".

---

## 3. Design decisions

### 3.1 The brand layer: one accent family, never the status colours

The token file now carries two new attribute-scoped layers:

- `[data-palette="…"]` — `cyan` (default), `violet`, `cobalt`, `emerald`, `rose`,
  `ember`, `graphite`. Ten declarations per mode, all in `--accent-*`,
  `--fg-accent`, `--fg-on-accent` and `--focus-ring`.
- A second block re-derives everything that is a `color-mix` of the accent
  (`--surface-selected`, `--line-accent`, `--glow-*`, `--calendar-*`,
  `--chart-marker|selection|band`). This is not decoration: a custom property
  containing `var()` is substituted *where it is declared*, so without this block
  a **scoped** palette would keep the parent's tints. It is what makes
  `data-palette` work on a `<section>` and not just on `<html>`.

**What a palette deliberately cannot do:** change `positive` / `negative` /
`warning` / `info`, the surface stack, the text levels, radius, spacing, density
or motion. The status set has no palette override at all — a token file that
offered one would let a product make "negative" green, and every product built on
LUC UI would inherit that ambiguity. Hues are also chosen clear of the status
hues (26 / 66 / 156 / 252); `ember` (48) is the closest pair at ~18° from
`warning` and is documented as needing care.

**Contrast is a gate, not a hope.** `palette-tokens.test.ts` parses `tokens.css`,
converts the declared oklch values to sRGB and computes WCAG ratios for the two
pairs a palette can break. Measured (light / dark):

| Palette | Label on accent | Accent text on surface |
| --- | --- | --- |
| LUC Cyan | 5.49 / 9.66 | 6.37 / 11.30 |
| Electric Violet | 6.46 / 8.92 | 7.46 / 10.46 |
| Cobalt | 6.19 / 9.02 | 7.16 / 10.59 |
| Emerald | 5.53 / 9.72 | 6.38 / 11.36 |
| Rose | 6.55 / 8.79 | 7.56 / 10.37 |
| Ember | 6.32 / 8.97 | 7.31 / 10.49 |
| Graphite | 16.26 / 14.77 | 14.59 / 12.93 |

Every pair clears 4.5:1 in both modes. The same page is re-measured in the
browser by axe (§6.3), so this is not only a unit-test claim.

### 3.2 Type is organised by role, not by family

`--font-sans`, `--font-display` and `--font-mono` were already the three roles.
Phase 2 makes them swappable and ships four presets: `inter` (default),
`humanist` (a system stack — no webfont at all), `editorial` (platform serif,
plus the extra leading serif body copy needs) and `technical` (monospaced
display). No font was bundled beyond the three OFL families already in the repo:
a preset demonstrates the *mechanism*, and a consumer with licensed brand fonts
points the three variables at their own stack.

### 3.3 Button: a sixth variant and one signature gesture

`variant="accent"` is the tinted twin of `primary` and matches the existing
`IconButton variant="accent"` — the naming gap between the two families was a
real DX wart. `luc-sheen` gives the two filled variants a single soft highlight
that crosses the fill once, on hover: it answers the pointer, never loops, never
fires on scroll, and the existing global reduced-motion clamp removes it entirely
(measured: `animation-duration` 0.62s → 1e-06s under `data-motion="reduced"`).

The rest of Batch A was reviewed and left alone. `Card` already had
`interaction="static|interactive|selectable|featured"`, `Tabs` and
`SegmentedControl` already slide one shared indicator, `Badge` already had an
accent tone. Adding variants there would have been change for the sake of a diff.

### 3.4 Rejected approaches

| Rejected | Why |
| --- | --- |
| A palette per CSS file / six stylesheets | Six stylesheets is six places for the design system to drift. One token file, attribute-scoped, keeps a palette a data change. |
| Palette changes status colours too | Breaks the meaning of "negative is red" for every consumer. |
| Bundle a serif for the `editorial` preset | Heavy, and it would force one editorial taste on every consumer. The preset shows the mechanism; the family is the consumer's choice. |
| A `<ThemeProvider>`-style React API for palettes | The attribute already is the API, works without JavaScript, and works on a subtree. A provider would have added a context and a hook for no capability. |
| Extract a `useLinkedSelection` hook for Batch E | The flow is already expressible as three controlled props on existing primitives; a hook would have been a fourth way to say the same thing. Revisit only if a fourth product repeats the recipe verbatim. |
| Restyle every component in Phase 2 | The brief asks for visible product improvement, not churn. Component families with no measured problem were left exactly as they were. |

---

## 4. Skills

Three Skills installed at `/home/luc/.codex/skills/` were read and applied (each
carries a `SOURCE.md` with its pinned upstream commit from the earlier handoff).

| Skill | What it changed here | What was rejected |
| --- | --- | --- |
| `frontend-design` | The palette set was designed as one recipe (same lightness trajectory, different hue/chroma) rather than seven unrelated looks; "spend your boldness in one place" is why only the two filled Button variants move, and why the Themes page shows eleven live subtrees rather than a wall of animated cards. The "all-caps eyebrow" and "numbered marker" tells were rejected as *new* devices but kept where the system already uses them (section eyebrows, a 01/02/03 sequence that is genuinely a sequence). | Bundling a display serif; a decorative gradient treatment for the palette cards. |
| `web-design-guidelines` | Drove the two accessibility fixes: the Showcase's horizontally scrollable docs table is now a named, focusable `region`; the status bar no longer overflows at 390px (a scrollable strip below the fold a keyboard user cannot reach). Also kept every new control's accessible name explicit. | — |
| `vercel-composition-patterns` | The reason the palette was implemented as a scoped attribute rather than a pile of boolean props, and the reason Batch E produced a recipe instead of a new component with `selected`, `synced`, `inspectorOpen` props. | `react19-no-forwardref` was not applied as a blanket refactor: the components use `ref`-as-prop already, and a repo-wide change was out of scope. |

**Limitation:** `web-design-guidelines` instructs a fetch of the latest rules from
GitHub at review time. The local copy was used instead, because the review had to
be deterministic and the Skill's own `SKILL.md` is the reviewed artefact. This is
recorded rather than silently skipped.

---

## 5. Design Lab promotion (Batch E)

The Design Lab experiments themselves were completed in the previous cycle (see
`docs/research/design-intelligence/experiments/comparison-and-results.md`). Phase 2
did three things with them:

1. **Navigation.** `experiments/design-lab` plus its three treatments are now a
   first-class sidebar group, `defaultOpen` when the current route is inside it —
   which also fixed the same latent problem for the TradingView sub-tree: a nested
   page reached by link or ⌘K used to stay invisible in the tree.
2. **QA.** The four routes are registered in `qa/routes.mjs` under a new
   `experiments` group (they were previously excluded from every tier on purpose,
   which is exactly how they became invisible). `qa/route-map.mjs` routes changes
   under `app/experiments/**` to that group, so the standard sweep covers them.
3. **Recipe.** The one reusable outcome — table selection → chart marker →
   inspector detail — is documented with a working code sketch on the Design Lab
   overview page, including the deliberate decision *not* to freeze it into a
   component yet.

---

## 6. Verification

### 6.1 Commands and results

All run from `/home/luc/code/luc-quant/luc-ui`.

| Command | Exit | Result |
| --- | --- | --- |
| `pnpm --filter @luc/ui test` | 0 | 70 files, **650 tests passed** (617 before Phase 2; 33 new) |
| `pnpm --filter @luc/ui typecheck` | 0 | clean |
| `pnpm --filter @luc/showcase typecheck` | 0 | clean |
| `pnpm --filter @luc/ui lint` | 0 | clean, 0 warnings |
| `pnpm --filter @luc/showcase lint` | 0 | clean, 0 warnings |
| `pnpm --filter @luc/ui catalog:generate` | 0 | 34 public paths, 10 path fixtures pass |
| `pnpm --filter @luc/ui catalog:check` | 0 | no drift |
| `pnpm --filter @luc/showcase build` | 0 | 89 routes prerendered, incl. the 2 new pages |
| **`pnpm verify`** | **0** | typecheck + lint + 650 tests + catalog + package build + consumer tree-shaking + type resolution |
| `node apps/showcase/qa/run.mjs …` (official tier, deployed container) | 0 | 9 routes, 25 screenshots, 17 axe scans, 0 violations |
| Phase 2 focused browser QA driver (deployed container) | 0 | 25/25 checks, 14 axe runs, 0 console errors |

### 6.2 Bundle

From `pnpm verify` (`consumer-test.mjs`, baseline in `bundle-baseline.json`,
budget = recorded + max(8%, 1 KB)):

| Entry | Before | After | Note |
| --- | --- | --- | --- |
| `button-only` | 5,803 B raw / 2,104 B gzip | 6.1 KB raw / 2.1 KB gzip | +~0.4 KB raw for the `accent` variant + `luc-sheen`. Within the 1 KB budget; gzip unchanged at 2.1 KB. |
| `charts` | 60,952 B raw / 18,602 B gzip | 59.1 KB raw / 18.1 KB gzip | No chart code changed; within measurement noise. |
| all other entries | — | unchanged | `slider`, `menus`, `surfaces`, `date-picker`, `app-shell`, `tradingview`, `barrel` all hold. |

CSS delivered by the Showcase (concatenated `.next/static/chunks/*.css` in the
previous vs. new image):

| | Raw | gzip |
| --- | --- | --- |
| previous image | 147,915 B | 26,333 B |
| Phase 2 image | 168,885 B | 29,260 B |

So the entire theming capability costs **+20,970 B raw / +2,927 B gzip** of CSS,
paid once per application. No new runtime dependency was added. The palette
selectors are inert for a product that never sets the attribute.

### 6.3 Browser QA (deployed container, `http://127.0.0.1:3000`)

Focused driver, 25 checks, all passed:

- **Scoping:** seven distinct `--accent-default` values resolve inside seven
  sibling cards; the scoped accent reaches the buttons inside them.
- **Document scope:** "Use <palette>" sets `data-palette` on `<html>`, persists to
  `localStorage`, survives client-side navigation, and is reflected in the shell
  status bar.
- **No layout shift:** the page `h1` box is byte-identical before and after a
  palette switch (paint, not layout).
- **Status independence:** `--positive` resolves to the same value inside all four
  industry vignettes despite four different accents.
- **Reduced motion:** `getComputedStyle(button, "::after").animationDuration`
  goes from `0.62s` to below `0.01s` with `data-motion="reduced"`.
- **Keyboard:** `Enter` on a focused Design Lab row selects it, in all three
  treatments.
- **Stability:** the chart frame's bounding box is within 1.5px before/after
  selection.
- **Responsive:** no horizontal page overflow at 390px on any tested route.
- **axe** (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa): **0 violations across 14
  scans**, including light and dark, 1440 and 390.
- **Console:** 0 errors, 0 page errors, no hydration warnings.

Two defects were found and fixed during this work, both in Showcase-owned files:

1. `/components/buttons` at 390px: `scrollable-region-focusable` on the props
   table — **pre-existing**, confirmed identical against the previous deployment.
   Fixed by making the docs table a named, focusable `region`.
2. Design Lab and other long-titled routes at 390px: the shell status bar
   overflowed into a non-focusable scroll strip. **Introduced by this work** (the
   Design Lab routes now have a real page title in the bar, plus more registered
   routes). Fixed by letting the title ellipsize and hiding the secondary segments
   below the `xs` breakpoint.

### 6.4 Screenshots

Stored in `docs/audits/phase-2/screenshots/`:

| File | What it shows |
| --- | --- |
| `themes-1440-dark.png` | Seven palettes as live subtrees, contrast table, four type voices |
| `themes-1440-light.png` | The same page in light mode (light is designed, not inverted) |
| `themes-390-dark.png` | Mobile: no overflow, stacked palette cards |
| `industries-1440-dark.png` | Four products, four brands, one component set |
| `industries-1440-light.png` | The same in light mode |
| `design-lab-focused-1440-dark-selected.png` | Table → chart → inspector after a selection |
| `design-lab-focused-390-dark-reduced.png` | Mobile with reduced motion forced |
| `design-lab-precision-1440-light.png` | The Precision Instrument treatment in light mode |

---

## 7. Luc UI → Luc Web compatibility

**Cumulative classification: `COMPATIBLE`.**

No public export was removed, renamed or re-typed. The catalog (`34 public paths`)
regenerated with identical structure; the one change is the *additive* variant
union below.

| Change | Import path | Before | After | Luc Web uses it? | Tested against Luc Web? | Required action |
| --- | --- | --- | --- | --- | --- | --- |
| `Button` gains `variant="accent"` | `@luc/ui`, `@luc/ui/components/button` | 5 variants | 6 variants | Not verified in this session (Luc Web was not opened) | No | None. Additive union member; existing values are unchanged. |
| `primary` / `accent` buttons gain a hover sheen | same | static fill | one 620ms highlight on hover | Same as above | No | None. CSS-only, reduced-motion aware, removed under the global clamp. |
| `tokens.css` gains `[data-palette]` / `[data-typeface]` blocks | `@luc/ui/tokens.css`, `@luc/ui/styles.css` | cyan accent only | same default cyan, seven optional accents | Yes, indirectly — Luc Web imports the stylesheet | Yes, indirectly: the same stylesheet is consumed by the deployed Luc Web build, which serves normally | None. Default output is byte-for-byte the same accent ramp; CSS grows ~2.9 KB gzip. |
| Button's filled variants get `overflow: hidden` | `@luc/ui` | — | — | Not verified | No | None known. The focus ring is an `outline` and is unaffected; a consumer placing content outside a button's box would already be clipped by the button's own bounds. |

Everything else in this cycle is Showcase-owned (`apps/showcase/**`), so it
cannot reach Luc Web.

Nothing was verified *inside* Luc Web: Luc Web was not opened, built or modified.
The classification above is therefore based on the shape of the public API and on
the stylesheet being shared, not on a Luc Web test run.

---

## 8. Known limitations and remaining work

1. **Batches B, C and D are not done.** Forms, overlays and the workspace/navigation
   library components were reviewed at source level only. No measured defect was
   fixed in this session, so no work should be reported as complete there.
2. **`ember` sits ~18° from the `warning` status hue.** Documented; acceptable
   when a view does not carry warning semantics.
3. **`humanist` renders identically to `inter` in the server's headless browser**
   (no distinct system sans is installed in the container). On a normal desktop it
   resolves to the platform sans, which is the point of the preset.
4. **The status bar remains `overflow-x-auto` in the library.** The Showcase no
   longer overflows it, but a consumer with a very long title would hit the same
   non-focusable scroll region. A library-level fix (focusable region, or
   truncation contract) is proposed but not made.
5. **No palette persistence for consumers.** `localStorage` handling lives in the
   Showcase; a consumer wires its own. A tiny `useThemeAttribute` hook is a
   candidate for a later cycle.
6. **Design Lab screenshots were not re-shot after the recipe section was added** —
   the deployed routes were re-verified with axe and the QA driver, but the stored
   Design Lab images are from the earlier cycle.

## 9. Proposed Phase 3 (not started)

1. Batch B: forms and selection states, one family at a time, with the palette set
   in place so state colours are designed against all seven accents.
2. Batch C: overlay choreography — trigger-to-overlay continuity, focus return,
   reduced-motion answers.
3. The `AppShellStatusBar` overflow contract (item 4 above) as a small,
   independently reviewable library change.
4. A consumer-facing theming recipe (`data-palette` + a custom accent) in
   `DEVELOPER_GUIDE.md`, plus a Luc Web compatibility check once Luc Web is opened.
