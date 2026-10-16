# Brief — Agent C: general UI Live Demos

## What you are fixing

52 of the 103 documented components are *generated* pages: a real import path, a
real compiler prop table, an install block and no specimen. You are giving 41 of
them a real, visible, working example.

## Read first

1. `luc-ui/docs/audits/phase-9-hardening/00-architecture-and-coordination.md`
   — contract, rules, ownership. Binding.
2. `luc-ui/apps/showcase/lib/demo/types.ts`, `jsx.ts`, `index.ts`.
3. `luc-ui/apps/showcase/lib/demo/components/data-display.tsx` — the reference
   implementation (structured demos, composition demos, islands).
4. `luc-ui/apps/showcase/components/demo/islands/{table-demo,list-demo,details-demo}.tsx`.
5. `luc-ui/apps/showcase/components/docs/demo-stage.tsx`.

## Your files (41 demos)

| File | export | ids |
| --- | --- | --- |
| `lib/demo/components/actions.tsx` | `actionDemos` | `button-group`, `icon-button`, `kbd`, `link` |
| `lib/demo/components/forms.tsx` | `formDemos` | `checkbox`, `input-group`, `label`, `native-select`, `radio-group`, `rating`, `search-input`, `sections`, `segmented-control`, `switch`, `textarea` |
| `lib/demo/components/layout.tsx` | `layoutDemos` | `aspect-ratio`, `container`, `grid`, `inline`, `panel`, `scroll-area`, `section`, `separator`, `stack` |
| `lib/demo/components/navigation.tsx` | `navigationDemos` | `stepper` |
| `lib/demo/components/feedback.tsx` | `feedbackDemos` | `guided-tour`, `progress`, `skeleton`, `spinner` |
| `lib/demo/components/overlays.tsx` | `overlayDemos` | `hover-card`, `popover`, `tooltip` |
| `lib/demo/components/media.tsx` | `mediaDemos` | `image-compare`, `image-gallery` |
| `lib/demo/components/experiences.tsx` | `experienceDemos` | `experience-timeline`, `now-section`, `profile-hero`, `project-showcase`, `publication-list`, `reading-shelf`, `social-links` |

The arrays and export names exist as stubs — keep them. `data-display.tsx` and
`typography.tsx` are the Lead's; do not touch them.

## How to write one

Simple, prop-driven:

```tsx
import { Progress, type ProgressProps } from "@luc/ui";
import { demo } from "../jsx";

demo<ProgressProps>({
  id: "progress",
  component: "Progress",
  props: { value: 62, "aria-label": "Tasks complete" },
  render: (props) => <Progress {...props} />,
});
```

Composition, or anything with state, is a `composition({ id, node, code })`, and
the state lives in a new island `components/demo/islands/c-<name>.tsx`
(`"use client"`). Those are the only files you may create outside the table
above, and you must not edit an island you did not create.

* Pass the props type explicitly (`demo<ProgressProps>(…)`) — without it
  TypeScript widens `"outline"` to `string` and the spread stops checking.
* Only use props the compiler lists for that export: see
  `lib/docs/generated/api.ts` (`"progress": [ … ]`).
* Working usage to copy from: the hand-written Showcase pages that already use
  the component — `apps/showcase/app/components/*/page.tsx`,
  `app/experiences/**`, `app/blocks/**`. Search by the export name.

## What "good" means here

* The specimen must be **the real component doing its real job** with a
  deterministic fixture: `Progress` at a value, `Stepper` on a step,
  `ImageGallery` with real image sources, `ProfileHero` with a plausible person,
  `SocialLinks` with honest links (an in-repo documentation URL or a `#`
  fragment — never a fabricated profile URL).
* Anything interactive must **actually work** in a browser and be reachable by
  keyboard: a `Tooltip` opens on focus, a `Popover` opens and closes, a
  `ScrollArea` scrolls, a `Stepper` advances, a `GuidedTour` steps.
* Prefer a structured `demo(...)`; use `composition` only when the specimen is
  several components at once or needs state, and write `code` as something a
  developer would paste. The frame adds the import line, so the snippet is the
  element.
* `note` is optional here. Write one when the fixture needs explaining (what the
  numbers are, what to try); skip it when the specimen speaks for itself.
* Keep every other string in a demo to three words or fewer — a fixture label is
  data, not documentation.
* Images: use assets already in the repo (`public/`), or a deterministic data
  URI. Never link a host that may 404.

## Hard constraints

* Write only your eight files plus any `components/demo/islands/c-*.tsx` you
  create. Do not touch registries, `types.ts`, `jsx.ts`, `entry-page.tsx`,
  `package.json`, translations, `packages/ui/**`, or anything outside
  `luc-ui/**`.
* No fabricated capabilities: no upload that pretends to send a file, no AI
  component that pretends to call a model. A simulated state is labelled as
  simulated.
* Do not commit, do not run Docker, do not run browser suites. The host is
  shared and loaded — one command at a time.
* If a component cannot be honestly demonstrated (needs a backend or a context
  only a product provides), leave it out and report it as an exception with the
  reason.

## Verify before reporting

```
cd /home/luc/code/luc-quant/luc-ui/apps/showcase && pnpm typecheck
cd /home/luc/code/luc-quant/luc-ui && pnpm --filter @luc/ui test:showcase
```

## Report back

ids delivered, ids skipped with reasons, islands created, the exact verification
commands and output, anything you found wrong in the library (report, do not
fix).
