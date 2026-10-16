# Phase 9 — Agent C report: Playground reference adapters (round 2)

**Date:** 2026-10-09 (UTC)
**Owner:** `agent_f_adapters` (`/root/agent_f_adapters`, spawned by the Phase 9 Lead)
**Brief:** `docs/audits/phase-9/briefs/playground-adapters.md`
**Writable scope actually used:** exactly the brief's list. Nothing under `lib/**`,
`app/**`, `components/docs/**`, `qa/**`, `scripts/**` or any `package.json` was touched.

---

## 1. What was delivered

Seven adapters, the two registries, the chart boundary, the control improvements and the
adapter tests.

| File (under `apps/showcase/`) | Adapter id | Component | Import path | Controls |
| --- | --- | --- | --- | --- |
| `components/playground/adapters/input.tsx` | `input` | `Input` | `@luc/ui/components/input` | 8 |
| `components/playground/adapters/card.tsx` | `card` | `Card` + the five parts | `@luc/ui` | 5 |
| `components/playground/adapters/kinetic-headline.tsx` | `kinetic-headline` | `KineticHeadline` | `@luc/ui/motion` | 5 |
| `components/playground/adapters/profile-hero.tsx` | `profile-hero` | `ProfileHero` | `@luc/ui/experiences` | 9 |
| `components/playground/adapters/ai-message.tsx` | `chat-message` | `ChatMessage` | `@luc/ui` | 6 |
| `components/playground/adapters/line-chart.tsx` | `line-chart` | `LineChart` | `@luc/ui/charts` | 8 |
| `components/playground/adapters/violin-chart.tsx` | `violin-chart` | `ViolinChart` | `@luc/ui/charts` | 5 |

Supporting files:

- `components/playground/registry.ts` — the six light adapters. Still imports no engine.
- `components/playground/registry.charts.ts` — new: the two chart adapters, `chartPlaygroundFor`, `chartPlaygroundIds`.
- `components/playground/chart-boundary.tsx` — new: `ChartPlayground`, mirroring `boundary.tsx` against the chart registry.
- `components/playground/controls/index.tsx` — the control improvements in §3.
- `tests/unit/playground-adapters.test.ts` — the brief's four required checks plus four more (§5).
- `docs/audits/phase-9/i18n/agent-c.json` — 103 sentence pairs for the Lead's merge.

Every prop name and type came from the component source under `packages/ui/src/**` and from
`lib/docs/generated/api.ts`; nothing was invented. `ProfileHero` needed the source rather than
`api.ts`, because the compiler extracted no prop table for it (`propsType: None`) — its props
are declared on an interface that extends `React.ComponentPropsWithRef<"header">`.

## 2. The panel's promise, and the one prop shape it cannot express

The standing contract (`tests/unit/playground-engine.test.ts`, line 156) requires the generated
element at its declared defaults to carry **no attributes at all**. That is right for a design
default (`variant`, `size`), and it has one consequence worth writing down, because three of the
seven components have a *required* prop:

| Adapter | Prop the element cannot be honest without | What the default snippet says |
| --- | --- | --- |
| `input` | `aria-label` | `<Input />` |
| `kinetic-headline` | `text` | `<KineticHeadline />` |
| `profile-hero` | `name` | `<ProfileHero />` |
| `chat-message` | `from` | `<ChatMessage>…</ChatMessage>` |

For the Input it is the accessible name rather than a type requirement, and the stage passes it
either way — a preview is never an unnamed field. The values are on screen and in the AI prompt
(`buildAiPrompt` prints the chosen configuration as
words as well as code, so `text`, `name` and `from` are never lost from the prompt), but the code
pane omits them until the reader edits them. There is no way around it inside the current engine:
any attribute written unconditionally fails that assertion at defaults.

Two things follow, and both need a Lead-owned file:

1. If a required prop should always appear in the code, `Control` needs a `required` flag that
   `serializeProps` exempts from the defaults-omission rule (`components/playground/engine.ts`
   — out of my scope).
2. It does **not** affect the charts: they are outside the light registry, so they write their
   fixture in full (`const rows = […]` then `<LineChart … data={rows} />`), exactly as the
   Studio snippet does. A chart with no data is not a chart, and `<LineChart />` is not something
   a reader should ever be handed.

## 3. Control improvements (`controls/**`, which the brief assigned to me)

| Control | Before | Now | Why |
| --- | --- | --- | --- |
| `color` | a bare hex text field with a decorative swatch | the library's `ColorPicker` | a real picker with a hex field, three keyboard sliders and a reset; the reader no longer types a colour they cannot see |
| `number`, ranged | `Slider` + a static readout | unchanged, but the value bubble now carries the unit via `formatValue` | the bubble said `48` where the readout beside it said `48px` |
| `number`, unbounded or half-open | `NumberInput` with the domain dropped | `NumberInput` receives `min`, `max`, `step` and `unit` | a control that declares `min` without `max` (or a step) silently accepted any value |
| `list` | bare checkboxes under a heading | `role="group"` named by the control's label | a screen reader read four unrelated checkboxes and the heading was decoration |
| every label, help text and option label | rendered as raw English | wrapped in `tcs(…)` at the render site | the Chinese panel was partly English, and the strings were invisible to the coverage measure because the lookups were variables |

Option *values* are deliberately not translated (`{option.label ? tcs(option.label) : option.value}`):
a value is an identifier a developer types in either language, and `sm` must stay `sm`.

## 4. Two defects found while writing the adapters

1. **The Button adapter emitted `leadingIcon` twice** — once as `leadingIcon="spinner"` from
   `serializeProps` and again as the composed `leadingIcon={<Spinner size={16} />}`. A duplicated
   JSX attribute is a compile error in the reader's editor, so the copy button handed them broken
   code. Fixed by declaring the slot's placement `composed` (it is written by the adapter, as a
   slot must be). `tests/unit/playground-adapters.test.ts` now asserts that no adapter, light or
   chart, ever emits the same attribute twice.
2. **The required-prop omission** in §2 — reported, not fixed: the fix belongs to the engine.

## 5. Verification

```bash
cd /home/luc/code/luc-quant/luc-ui && pnpm --filter @luc/ui test:showcase
cd /home/luc/code/luc-quant/luc-ui/apps/showcase && pnpm typecheck
cd /home/luc/code/luc-quant/luc-ui/apps/showcase && pnpm lint
```

| Command | Real output |
| --- | --- |
| `pnpm --filter @luc/ui test:showcase` | `Test Files 1 failed \| 9 passed (10)` · `Tests 1 failed \| 78 passed (79)`. The one failure is `playground-wiring.test.ts` → *"card is not used by any page"* — see §6, it is a Lead-owned map. `playground-engine.test.ts` (8 tests) passes with all six light adapters registered, and `playground-adapters.test.ts` (8 tests) passes for all eight. |
| `cd apps/showcase && pnpm typecheck` | clean (`tsc --noEmit`, no output) |
| `cd apps/showcase && pnpm lint` | clean (`eslint . --max-warnings 0`, no output) |
| `node apps/showcase/scripts/i18n-merge.mjs` (dry run, no write) | `handoff files: 7 · new sentences: 103 · already translated: 277 · refused: 0` |

No `next build`, no Playwright, no `qa:*`, no Docker — as the brief required.

`tests/unit/playground-adapters.test.ts` checks, explicitly importing from `vitest`:

1. the same four the brief asked for — the component is really published by its import path (read
   from `docs/component-catalog.json`), serializing twice is byte-identical, chart fixture values
   are finite, and each snippet names its component;
2. the registry is 8 ids with each adapter in exactly one half;
3. a generated snippet contains no `Math.random` / `Date.now`;
4. every changed control reaches the code — as an attribute, as the element body, or (for a
   composed slot) as a visibly different snippet;
5. no duplicated attribute (the Button defect above);
6. no control label, option label, stage note or unsupported reason is empty — the panel's
   vocabulary is printable and translatable.

## 6. What the Lead still owns (each one blocks something visible)

1. **`lib/docs/curation/playgrounds.ts`** — the five light adapters are registered but not wired,
   so `playground-wiring.test.ts` fails on *"leaves no registered adapter unreachable"*. The lines
   are the ones `PLANNED_PLAYGROUNDS` already names:

   ```ts
   input: "input",
   card: "card",
   "kinetic-headline": "kinetic-headline",
   "profile-hero": "profile-hero",
   ai: "chat-message",
   ```

   plus `"line-chart": "line-chart"` and `"violin-chart": "violin-chart"` once the wiring test can
   see the chart registry. `lib/docs/generated/registry.ts` must be regenerated afterwards
   (`pnpm --filter @luc/showcase docs:registry`), because the generator is what copies the id onto
   each `DocEntry`.
2. **`tests/unit/playground-wiring.test.ts`** — it resolves ids through `playgroundFor` only, so a
   wired chart entry would fail *"resolves every wired entry to a registered adapter"*. It needs
   `chartPlaygroundFor` as a second lookup (and `chartPlaygroundIds` for the unreachable check).
3. **`components/doc-pages/entry-page.tsx`** — `<Playground entry={entry} />` is mounted for every
   group, so a chart page currently resolves nothing (the light registry has no chart id) and shows
   no panel. The `isChart` branch the file already computes should mount `<ChartPlayground …>`.
4. **`node apps/showcase/scripts/i18n-merge.mjs --write`** — 103 sentences, including the Button
   page's help text, stage note, reasons and option labels, which had no rendering at all, so the
   Chinese panel showed English there.
5. **The four curated client pages** (`/components/inputs`, `/components/cards`,
   `/components/ai`, `/motion/kinetic`) still cannot mount a Playground: `PlaygroundSection` is a
   server component and those pages are client components, which is why `PLANNED_PLAYGROUNDS` says
   they stay unwired until a client-safe entry projection exists. Wiring them in step 1 makes the
   tests green and the panels *invisible*; that trade is the Lead's call, not mine.

## 7. Declared unsupported, and why

Every entry below is a prop the Playground refuses to fake, and the page prints the reason.

| Adapter | Unsupported | Reason (short) |
| --- | --- | --- |
| `input` | `value`, `defaultValue`, `onChange`, `type`, `className` | form state and callbacks are the caller's; `type` changes the editing model; layout is the page's |
| `card` | `interactive`, `href`, `className` | the V1.1 boolean is superseded by `interaction`; `href` needs `as="a"`; layout is the page's |
| `kinetic-headline` | `className`, `style` | type scale and colour come from the tokens |
| `profile-hero` | `actions`, `className` | the primary action needs a destination and a handler |
| `chat-message` | `actions`, `footer`, `className` | hover actions need callbacks; sources and tool calls are the caller's data |
| `line-chart` | `data`, `xKey`, `series`, `className` | a whole dataset is never a control; the code writes the fixture instead |
| `violin-chart` | `groups`, `onReady`, `className` | the density outline is the caller's model output, never fitted here |
